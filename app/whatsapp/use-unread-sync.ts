'use client';

import { useEffect, useState } from 'react';
import {
  WHATSAPP_UNREAD_STORAGE_KEY,
  loadUnreadByContact,
  saveUnreadAndBroadcast,
} from '@/lib/whatsapp-notifications';

/**
 * Estado de não-lidas por número, sincronizado entre abas via `storage` e evento custom.
 * Quando `activeNumber` muda para um contacto com não-lidas, zera o contador e persiste.
 */
export function useUnreadSync(activeNumber: string | null) {
  const [unreadByContact, setUnreadByContact] = useState<Record<string, number>>(() => loadUnreadByContact());

  useEffect(() => {
    const sync = () => setUnreadByContact(loadUnreadByContact());
    const onStorage = (e: StorageEvent) => {
      if (e.key === WHATSAPP_UNREAD_STORAGE_KEY) sync();
    };
    window.addEventListener('crm-whatsapp-unread', sync as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('crm-whatsapp-unread', sync as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    if (!activeNumber) return;
    setUnreadByContact((prev) => {
      if (!(prev[activeNumber] > 0)) return prev;
      const next = { ...prev, [activeNumber]: 0 };
      saveUnreadAndBroadcast(next);
      return next;
    });
  }, [activeNumber]);

  return { unreadByContact, setUnreadByContact } as const;
}
