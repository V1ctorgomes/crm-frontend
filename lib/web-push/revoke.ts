import { webPushApiBase } from './api-base';
import { notifyWebPushStateChanged } from './state';

/** Remove subscrição no servidor e no browser (chamar antes de limpar o token). */
export async function revokeWebPushSubscription(): Promise<void> {
  if (typeof window === 'undefined') return;
  const base = webPushApiBase();

  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await fetch(`${base}/notifications/push/subscribe`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    }).catch(() => undefined);
    await sub.unsubscribe().catch(() => undefined);
  } catch {
    // ignorar
  } finally {
    notifyWebPushStateChanged();
  }
}
