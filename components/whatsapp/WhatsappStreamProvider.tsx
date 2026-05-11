'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { apiRequest } from '@/lib/api-client';
import { tryParseWhatsappSseMessage } from '@/lib/whatsapp-sse-parse';
import { whatsappIngressMergerRef } from '@/lib/whatsapp-stream-merge';
import { whatsappActiveContactRef } from '@/lib/whatsapp-presence';
import {
  loadUnreadByContact,
  playIncomingMessageSound,
  primeWhatsappNotificationAudio,
  saveUnreadAndBroadcast,
} from '@/lib/whatsapp-notifications';
import { applyTabFaviconBadgeIfHidden, resetTabFaviconToDefault } from '@/lib/tab-favicon-badge';

const sseIncomingSeenKeys = new Set<string>();

function tryMarkSseIncomingNew(contactNumber: string, waId: string | number): boolean {
  const k = `${contactNumber}:${String(waId)}`;
  if (sseIncomingSeenKeys.has(k)) return false;
  sseIncomingSeenKeys.add(k);
  if (sseIncomingSeenKeys.size > 2500) {
    const keep = Array.from(sseIncomingSeenKeys).slice(-1200);
    sseIncomingSeenKeys.clear();
    keep.forEach((x) => sseIncomingSeenKeys.add(x));
  }
  return true;
}

export function WhatsappStreamProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [canStream, setCanStream] = useState<boolean | null>(null);

  useEffect(() => {
    const once = () => {
      primeWhatsappNotificationAudio();
    };
    window.addEventListener('pointerdown', once, { once: true });
    return () => window.removeEventListener('pointerdown', once);
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        resetTabFaviconToDefault();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    if (pathname === '/login') {
      setCanStream(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const me = await apiRequest('/users/me').catch(() => null);
      if (cancelled) return;
      if (!me?.id) {
        setCanStream(false);
        return;
      }
      const fetchedInstances = await apiRequest(`/instances/user/${me.id}`).catch(() => []);
      if (cancelled) return;
      const connected = (fetchedInstances as any[]).filter((i: any) => i.status === 'connected');
      setCanStream(connected.length > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (canStream !== true) return;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
    const eventSource = new EventSource(`${baseUrl}/whatsapp/stream`);

    eventSource.onmessage = (event) => {
      try {
        const detail = tryParseWhatsappSseMessage(event.data);
        if (!detail) return;

        const merger = whatsappIngressMergerRef.current;
        let appendedIncoming = false;
        if (merger) {
          appendedIncoming = merger(detail);
        } else if (!detail.isFromMe) {
          appendedIncoming = tryMarkSseIncomingNew(detail.contactNumber, detail.waId);
        }

        if (!detail.isFromMe && appendedIncoming) {
          const path = typeof window !== 'undefined' ? window.location.pathname : '';
          const onWa = path.includes('/whatsapp');
          const viewing =
            onWa &&
            whatsappActiveContactRef.current === detail.contactNumber &&
            document.visibilityState === 'visible';
          playIncomingMessageSound(viewing);
          if (!viewing) {
            const prev = loadUnreadByContact();
            const next = {
              ...prev,
              [detail.contactNumber]: (prev[detail.contactNumber] || 0) + 1,
            };
            saveUnreadAndBroadcast(next);
          }
          if (document.hidden) {
            applyTabFaviconBadgeIfHidden();
          }
        }
      } catch {
        /* ignore */
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };
    return () => eventSource.close();
  }, [canStream]);

  return <>{children}</>;
}
