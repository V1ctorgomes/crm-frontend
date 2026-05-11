import { getAuthToken, withAuthHeaders } from '@/lib/api-client';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://crm-crm-backend.pknzmz.easypanel.host';

function apiBase(): string {
  return API_URL.replace(/\/$/, '');
}

/** Chave pública VAPID: env do front ou GET no backend (evita rebuild só por causa disto). */
export async function resolveVapidPublicKey(): Promise<string | null> {
  const fromEnv = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (fromEnv) return fromEnv;
  try {
    const res = await fetch(`${apiBase()}/notifications/push/vapid-public-key`);
    if (!res.ok) return null;
    const data = (await res.json()) as { publicKey?: string };
    const k = String(data.publicKey || '').trim();
    return k || null;
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Garante SW + subscrição push e regista no backend (requer JWT em cookie). */
export async function ensureWebPushSubscription(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (!getAuthToken()) return false;

  const vapidPublic = await resolveVapidPublicKey();
  if (!vapidPublic) return false;

  let permission = Notification.permission;
  if (permission === 'denied') return false;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;
  }

  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await reg.update().catch(() => undefined);

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublic),
    });
  }

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

  const res = await fetch(`${apiBase()}/notifications/push/subscribe`, {
    method: 'POST',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }) as HeadersInit,
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    }),
  });
  return res.ok;
}

/** Remove subscrição no servidor e no browser (chamar antes de limpar o token). */
export async function revokeWebPushSubscription(): Promise<void> {
  if (typeof window === 'undefined') return;
  const token = getAuthToken();
  if (!token) return;
  const base = apiBase();

  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await fetch(`${base}/notifications/push/subscribe`, {
      method: 'DELETE',
      headers: withAuthHeaders({ 'Content-Type': 'application/json' }) as HeadersInit,
      body: JSON.stringify({ endpoint }),
    }).catch(() => undefined);
    await sub.unsubscribe().catch(() => undefined);
  } catch {
    // ignorar
  }
}
