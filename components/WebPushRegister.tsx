'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ensureWebPushSubscription } from '@/lib/web-push-client';

/**
 * Após login, tenta registar push (chave pública via env ou GET no backend).
 * O pedido de permissão também existe no WhatsApp / Configurações (melhor com gesto do usuario).
 */
export function WebPushRegister() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (pathname === '/login') return;

    const id = window.setTimeout(() => {
      ensureWebPushSubscription().catch(() => undefined);
    }, 2000);

    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}
