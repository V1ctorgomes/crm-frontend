'use client';

import { useEffect, useState } from 'react';
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
import { getApiBaseUrl } from '@/lib/api-client';

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
  /** SSE do WhatsApp é público no backend; mantém-se ligado mesmo sem sessão para contar não lidas ao vivo. */
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

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
    if (!clientReady) return;
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/whatsapp/stream`;

    let stopped = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let eventSource: EventSource | null = null;

    const handleMessage = (event: MessageEvent) => {
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
          const onLogin = path.includes('/login');
          const onWa = path.includes('/whatsapp');
          const viewing =
            onWa &&
            whatsappActiveContactRef.current === detail.contactNumber &&
            document.visibilityState === 'visible';
          if (!onLogin) {
            playIncomingMessageSound(viewing);
          }
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

    const scheduleReconnect = () => {
      if (stopped) return;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        if (!stopped) connect();
      }, 4000);
    };

    const connect = () => {
      if (stopped) return;
      eventSource?.close();
      eventSource = new EventSource(url, { withCredentials: true });
      eventSource.onmessage = handleMessage;
      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      eventSource?.close();
    };
  }, [clientReady]);

  return <>{children}</>;
}
