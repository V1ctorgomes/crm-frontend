import { getAuthToken, withAuthHeaders } from '@/lib/api-client';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://crm-crm-backend.pknzmz.easypanel.host';

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
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (!vapidPublic || typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (!getAuthToken()) return false;

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

  const res = await fetch(`${API_URL.replace(/\/$/, '')}/notifications/push/subscribe`, {
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
  const base = API_URL.replace(/\/$/, '');

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
