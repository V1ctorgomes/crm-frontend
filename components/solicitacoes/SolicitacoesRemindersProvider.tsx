'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { apiRequest } from '@/lib/api-client';
import type { Stage } from '@/components/solicitacoes/types';
import { broadcastReminderBadgeFromStages, SOLICITACOES_BOARD_SYNC_EVENT } from '@/lib/solicitacoes-reminders';

const POLL_MS = 90_000;

export function SolicitacoesRemindersProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (pathname === '/login') {
      setAllowed(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const me = await apiRequest('/users/me').catch(() => null);
      if (cancelled) return;
      setAllowed(!!me?.id);
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const pollBoard = async () => {
    if (!allowed) return;
    try {
      const data = (await apiRequest('/tickets/board')) as Stage[] | null;
      if (data && Array.isArray(data)) {
        broadcastReminderBadgeFromStages(data);
        if (pathname?.includes('/solicitacoes')) {
          window.dispatchEvent(new CustomEvent(SOLICITACOES_BOARD_SYNC_EVENT, { detail: data }));
        }
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!allowed) return;
    void pollBoard();
    intervalRef.current = setInterval(() => void pollBoard(), POLL_MS);
    const onFocus = () => void pollBoard();
    const onVis = () => {
      if (document.visibilityState === 'visible') void pollBoard();
    };
    const onOnline = () => void pollBoard();
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [allowed, pathname]);

  return <>{children}</>;
}
