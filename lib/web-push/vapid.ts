import { webPushApiBase } from './api-base';

/** Chave pública VAPID: env do front ou GET no backend (evita rebuild só por causa disto). */
export async function resolveVapidPublicKey(): Promise<string | null> {
  const fromEnv = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (fromEnv) return fromEnv;
  try {
    const res = await fetch(`${webPushApiBase()}/notifications/push/vapid-public-key`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { publicKey?: string };
    const k = String(data.publicKey || '').trim();
    return k || null;
  } catch {
    return null;
  }
}

export function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer.slice(0) as ArrayBuffer;
}
