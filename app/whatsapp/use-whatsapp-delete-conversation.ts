'use client';

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { Contact, Message } from '@/components/whatsapp/types';
import { apiDelete } from '@/lib/api-client';
import { saveUnreadAndBroadcast } from '@/lib/whatsapp-notifications';

interface UseWhatsappDeleteConversationArgs {
  activeContact: Contact | null;
  setActiveContact: Dispatch<SetStateAction<Contact | null>>;
  setChatHistory: Dispatch<SetStateAction<Record<string, Message[]>>>;
  setHistoryMeta: Dispatch<SetStateAction<Record<string, { hasMoreOlder: boolean }>>>;
  setContacts: Dispatch<SetStateAction<Contact[]>>;
  setUnreadByContact: Dispatch<SetStateAction<Record<string, number>>>;
  showFeedback: (type: 'success' | 'error', message: string) => void;
}

export function useWhatsappDeleteConversation({
  activeContact,
  setActiveContact,
  setChatHistory,
  setHistoryMeta,
  setContacts,
  setUnreadByContact,
  showFeedback,
}: UseWhatsappDeleteConversationArgs) {
  const confirmDeleteConversation = useCallback(async (deleteReason?: string) => {
    if (!activeContact) return;
    const num = activeContact.number;
    try {
      await apiDelete(`/whatsapp/history/${encodeURIComponent(num)}`, deleteReason);
      setChatHistory((prev) => {
        const next = { ...prev };
        delete next[num];
        return next;
      });
      setHistoryMeta((prev) => {
        const next = { ...prev };
        delete next[num];
        return next;
      });
      setUnreadByContact((prev) => {
        const next = { ...prev };
        delete next[num];
        saveUnreadAndBroadcast(next);
        return next;
      });
      setContacts((prev) =>
        prev.map((c) => (c.number === num ? { ...c, lastMessage: '', lastMessageTime: '' } : c)),
      );
      setActiveContact(null);
      localStorage.removeItem('lastActiveContact');
      showFeedback('success', 'Conversa apagada.');
    } catch {
      showFeedback('error', 'Erro ao apagar conversa.');
    }
  }, [
    activeContact,
    setActiveContact,
    setChatHistory,
    setHistoryMeta,
    setContacts,
    setUnreadByContact,
    showFeedback,
  ]);

  return { confirmDeleteConversation };
}
