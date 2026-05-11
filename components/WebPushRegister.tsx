'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getAuthToken } from '@/lib/api-client';
import { ensureWebPushSubscription } from '@/lib/web-push-client';

/**
 * Após login, regista service worker + push e envia a subscrição ao backend.
 * Requer NEXT_PUBLIC_VAPID_PUBLIC_KEY e no backend VAPID_* + HTTPS (ou localhost).
 */
export function WebPushRegister() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()) return;
    if (!getAuthToken()) return;
    if (pathname === '/login') return;

    const id = window.setTimeout(() => {
      ensureWebPushSubscription().catch(() => undefined);
    }, 1500);

    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}
