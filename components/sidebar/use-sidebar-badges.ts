'use client';

import { useEffect, useState } from 'react';
import {
  loadUnreadByContact,
  unreadConversationsCount,
  WHATSAPP_UNREAD_STORAGE_KEY,
} from '@/lib/whatsapp-notifications';
import { REMINDERS_BADGE_EVENT, getLastReminderBadgeSnapshot } from '@/lib/solicitacoes-reminders';

export function useSidebarBadges() {
  const [whatsappUnreadTotal, setWhatsappUnreadTotal] = useState(0);
  const [solicitacoesRemindersGreen, setSolicitacoesRemindersGreen] = useState(
    () => getLastReminderBadgeSnapshot().greenCount,
  );
  const [solicitacoesRemindersRed, setSolicitacoesRemindersRed] = useState(
    () => getLastReminderBadgeSnapshot().redCount,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setWhatsappUnreadTotal(unreadConversationsCount(loadUnreadByContact()));

    const onUnread = (e: Event) => {
      const ce = e as CustomEvent<{ unreadConversations?: number; total?: number }>;
      const n = ce.detail?.unreadConversations ?? ce.detail?.total;
      if (typeof n === 'number') setWhatsappUnreadTotal(n);
    };

    const onStorage = (ev: StorageEvent) => {
      if (ev.key !== WHATSAPP_UNREAD_STORAGE_KEY) return;
      if (!ev.newValue) {
        setWhatsappUnreadTotal(0);
        return;
      }
      try {
        const o = JSON.parse(ev.newValue) as Record<string, unknown>;
        if (!o || typeof o !== 'object') {
          setWhatsappUnreadTotal(0);
          return;
        }
        const map: Record<string, number> = {};
        for (const [k, v] of Object.entries(o)) {
          const n = Number(v);
          if (Number.isFinite(n) && n > 0) map[k] = Math.min(n, 999);
        }
        setWhatsappUnreadTotal(unreadConversationsCount(map));
      } catch {
        setWhatsappUnreadTotal(0);
      }
    };

    window.addEventListener('crm-whatsapp-unread', onUnread as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('crm-whatsapp-unread', onUnread as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onReminders = (e: Event) => {
      const ce = e as CustomEvent<{ greenCount?: number; redCount?: number }>;
      if (typeof ce.detail?.greenCount === 'number') setSolicitacoesRemindersGreen(ce.detail.greenCount);
      if (typeof ce.detail?.redCount === 'number') setSolicitacoesRemindersRed(ce.detail.redCount);
    };

    window.addEventListener(REMINDERS_BADGE_EVENT, onReminders as EventListener);
    return () => {
      window.removeEventListener(REMINDERS_BADGE_EVENT, onReminders as EventListener);
    };
  }, []);

  return {
    whatsappUnreadTotal,
    solicitacoesRemindersGreen,
    solicitacoesRemindersRed,
  };
}
