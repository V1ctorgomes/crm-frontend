'use client';

import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { Contact, Message } from '@/components/whatsapp/types';
import { mergeWhatsappIngressDetail } from '@/lib/whatsapp-merge-ingress';
import { whatsappActiveContactRef } from '@/lib/whatsapp-presence';
import { whatsappIngressMergerRef } from '@/lib/whatsapp-stream-merge';

interface UseStreamIntegrationArgs {
  activeNumber: string | null;
  chatHistoryRef: MutableRefObject<Record<string, Message[]>>;
  setChatHistory: Dispatch<SetStateAction<Record<string, Message[]>>>;
  setContacts: Dispatch<SetStateAction<Contact[]>>;
}

/**
 * Liga o `WhatsappStreamProvider` ao estado local:
 * - regista o contacto activo (para evitar incrementar não-lidas dele);
 * - regista o merger que aplica eventos SSE ao histórico e à lista de contactos.
 */
export function useStreamIntegration({
  activeNumber,
  chatHistoryRef,
  setChatHistory,
  setContacts,
}: UseStreamIntegrationArgs) {
  useEffect(() => {
    whatsappActiveContactRef.current = activeNumber;
    return () => {
      whatsappActiveContactRef.current = null;
    };
  }, [activeNumber]);

  useEffect(() => {
    whatsappIngressMergerRef.current = (detail) =>
      mergeWhatsappIngressDetail(detail, setChatHistory, setContacts, chatHistoryRef);
    return () => {
      whatsappIngressMergerRef.current = null;
    };
  }, [chatHistoryRef, setChatHistory, setContacts]);
}
