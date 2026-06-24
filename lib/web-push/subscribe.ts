import { getWebPushBlockInfo, hasPushManagerCapability } from '../web-push-support';
import { webPushApiBase } from './api-base';
import { parseNestErrorMessage } from './parse-error';
import { notifyWebPushStateChanged } from './state';
import type { EnsureWebPushResult } from './types';
import { resolveVapidPublicKey, urlBase64ToUint8Array } from './vapid';

/** Permissão concedida e subscrição push ativa neste browser. */
export async function isWebPushActive(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!getWebPushBlockInfo().canTrySubscribe) return false;
  if (Notification.permission !== 'granted') return false;
  if (!('serviceWorker' in navigator) || !hasPushManagerCapability()) return false;
  const reg =
    (await navigator.serviceWorker.ready.catch(() => null)) ??
    (await navigator.serviceWorker.getRegistration());
  const sub = await reg?.pushManager.getSubscription();
  return Boolean(sub);
}

/** Garante SW + subscrição push e regista no backend (requer JWT em cookie). */
export async function ensureWebPushSubscription(): Promise<EnsureWebPushResult> {
  const empty = (): EnsureWebPushResult => ({
    serverSynced: false,
    hasLocalSubscription: false,
  });

  if (typeof window === 'undefined') return empty();
  if (!getWebPushBlockInfo().canTrySubscribe) {
    return { ...empty(), blocked: 'unsupported-environment' };
  }
  if (!('serviceWorker' in navigator)) {
    return { ...empty(), blocked: 'no-sw' };
  }
  const vapidPublic = await resolveVapidPublicKey();
  if (!vapidPublic) {
    return { ...empty(), blocked: 'no-vapid' };
  }

  let permission = Notification.permission;
  if (permission === 'denied') {
    return { ...empty(), blocked: 'permission-denied' };
  }
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch {
      return { ...empty(), blocked: 'permission-error' };
    }
    if (permission !== 'granted') {
      return { ...empty(), blocked: 'permission-denied' };
    }
  }

  let reg: ServiceWorkerRegistration;
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    reg = await navigator.serviceWorker.ready;
    await reg.update().catch(() => undefined);
  } catch {
    return { ...empty(), blocked: 'sw-register-failed' };
  }

  if (!reg.pushManager) {
    return { ...empty(), blocked: 'no-sw' };
  }

  let sub: PushSubscription | null = null;
  try {
    sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic),
      });
    }
  } catch {
    return { ...empty(), blocked: 'subscribe-failed' };
  }

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ...empty(), blocked: 'invalid-subscription-json' };
  }

  let serverSynced = false;
  let httpStatus: number | undefined;
  let serverError: string | undefined;
  try {
    const res = await fetch(`${webPushApiBase()}/notifications/push/subscribe`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      }),
    });
    httpStatus = res.status;
    serverSynced = res.ok;
    if (!serverSynced) {
      const text = await res.text().catch(() => '');
      serverError = parseNestErrorMessage(text);
    }
  } catch {
    serverError =
      'Sem ligação ao servidor (rede, CORS ou URL errado). Confirme NEXT_PUBLIC_API_URL ou o proxy /api/proxy.';
  }

  const hasLocalSubscription = Boolean(await reg.pushManager.getSubscription());
  if (serverSynced) notifyWebPushStateChanged();
  return { serverSynced, hasLocalSubscription, httpStatus, serverError };
}
