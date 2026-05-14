'use client';

import { useCallback } from 'react';
import type { Contact, Message } from '@/components/whatsapp/types';
import { apiRequest } from '@/lib/api-client';
import { saveUnreadAndBroadcast } from '@/lib/whatsapp-notifications';

interface Args {
  activeContact: Contact | null;
  setActiveContact: React.Dispatch<React.SetStateAction<Contact | null>>;
  setChatHistory: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
  setHistoryMeta: React.Dispatch<React.SetStateAction<Record<string, { hasMoreOlder: boolean }>>>;
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  setUnreadByContact: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  showFeedback: (type: 'success' | 'error', msg: string) => void;
}

/** Apaga todo o histórico local + API e limpa estado associado. */
export function useWhatsappDeleteConversation({
  activeContact,
  setActiveContact,
  setChatHistory,
  setHistoryMeta,
  setContacts,
  setUnreadByContact,
  showFeedback,
}: Args) {
  const confirmDeleteConversation = useCallback(async () => {
    if (!activeContact) return;
    try {
      await apiRequest(`/whatsapp/history/${encodeURIComponent(activeContact.number)}`, { method: 'DELETE' });
      const num = activeContact.number;
      setChatHistory((prev) => ({ ...prev, [num]: [] }));
      setHistoryMeta((prev) => ({ ...prev, [num]: { hasMoreOlder: false } }));
      setUnreadByContact((prev) => {
        const next = { ...prev };
        delete next[num];
        saveUnreadAndBroadcast(next);
        return next;
      });
      setContacts((prev) => prev.map((c) => (c.number === num ? { ...c, lastMessage: '', lastMessageTime: '' } : c)));
      setActiveContact(null);
      localStorage.removeItem('lastActiveContact');
      showFeedback('success', 'Conversa excluída com sucesso.');
    } catch {
      showFeedback('error', 'Falha de conexão ao apagar conversa.');
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

  return { confirmDeleteConversation } as const;
}
