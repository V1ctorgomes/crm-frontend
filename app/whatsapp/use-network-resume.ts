'use client';

import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { apiRequest } from '@/lib/api-client';
import type { Contact, Message } from '@/components/whatsapp/types';
import { CRM_NETWORK_ONLINE } from '@/lib/crm-network-events';
import {
  WHATSAPP_HISTORY_PAGE_SIZE,
  mapApiRowToMessage,
  normalizeWhatsappHistoryResponse,
} from '@/lib/whatsapp-history-pagination';
import { whatsappActiveContactRef } from '@/lib/whatsapp-presence';
import { mapWhatsappContactApiRow } from './utils';

interface UseNetworkResumeArgs {
  setContacts: Dispatch<SetStateAction<Contact[]>>;
  setActiveContact: Dispatch<SetStateAction<Contact | null>>;
  setChatHistory: Dispatch<SetStateAction<Record<string, Message[]>>>;
  setHistoryMeta: Dispatch<SetStateAction<Record<string, { hasMoreOlder: boolean }>>>;
}

/**
 * Após uma queda de rede (evento `CRM_NETWORK_ONLINE`), reaproveita o número activo
 * para refrescar a lista de contactos e o histórico aberto sem recarregar a página.
 */
export function useNetworkResume({
  setContacts,
  setActiveContact,
  setChatHistory,
  setHistoryMeta,
}: UseNetworkResumeArgs) {
  useEffect(() => {
    const onNetworkResume = () => {
      if (typeof window === 'undefined' || !window.location.pathname.includes('/whatsapp')) return;
      void (async () => {
        const contactsData = await apiRequest<any[]>('/whatsapp/contacts').catch(() => []);
        const rawList = Array.isArray(contactsData) ? contactsData : [];
        const formattedContacts = rawList.map((c) => mapWhatsappContactApiRow(c as Record<string, unknown>));
        setContacts(formattedContacts);
        setActiveContact((prev) => {
          if (!prev) return prev;
          const match = formattedContacts.find((c) => c.number === prev.number);
          return match ? { ...prev, ...match } : prev;
        });
        const num = whatsappActiveContactRef.current;
        if (!num) return;
        const raw = await apiRequest(
          `/whatsapp/history/${encodeURIComponent(num)}?limit=${WHATSAPP_HISTORY_PAGE_SIZE}`,
        ).catch(() => ({ messages: [], hasMoreOlder: false }));
        const { rows, hasMoreOlder } = normalizeWhatsappHistoryResponse(raw);
        const formattedMessages = rows.map(mapApiRowToMessage);
        setChatHistory((prev) => ({ ...prev, [num]: formattedMessages }));
        setHistoryMeta((prev) => ({ ...prev, [num]: { hasMoreOlder } }));
      })();
    };
    window.addEventListener(CRM_NETWORK_ONLINE, onNetworkResume);
    return () => window.removeEventListener(CRM_NETWORK_ONLINE, onNetworkResume);
  }, [setContacts, setActiveContact, setChatHistory, setHistoryMeta]);
}
