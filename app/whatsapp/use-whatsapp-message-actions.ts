'use client';

import { useCallback, useRef, useState, type MutableRefObject } from 'react';
import type { Contact, Message } from '@/components/whatsapp/types';
import { apiRequest } from '@/lib/api-client';
import { canDeleteMessageByTime, canEditMessageByTime } from '@/lib/whatsapp-message-windows';

interface Args {
  activeContact: Contact | null;
  selectedInstance: string;
  chatHistoryRef: MutableRefObject<Record<string, Message[]>>;
  setChatHistory: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  showFeedback: (type: 'success' | 'error', msg: string) => void;
}

function instanceForContact(c: Contact | null, selectedInstance: string) {
  return c?.instanceName || (selectedInstance !== 'ALL' ? selectedInstance : undefined);
}

/**
 * Apagar para todos, editar texto, e estado dos modais de confirmação/edição de mensagem.
 */
export function useWhatsappMessageActions({
  activeContact,
  selectedInstance,
  chatHistoryRef,
  setChatHistory,
  setContacts,
  showFeedback,
}: Args) {
  const [messagePendingDelete, setMessagePendingDelete] = useState<Message | null>(null);
  const pendingDeleteRef = useRef<Message | null>(null);
  const [editMessage, setEditMessage] = useState<Message | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const handleRequestDeleteMessage = useCallback(
    (msg: Message) => {
      if (!activeContact || typeof msg.id === 'number') {
        showFeedback('error', 'Aguarde a confirmação do envio antes de apagar.');
        return;
      }
      if (!canDeleteMessageByTime(msg.sentAt)) {
        showFeedback('error', 'Só é possível apagar até 50 horas após o envio.');
        return;
      }
      setMessagePendingDelete(msg);
      pendingDeleteRef.current = msg;
    },
    [activeContact, showFeedback],
  );

  const confirmDeleteSingleMessage = useCallback(async () => {
    const msg = pendingDeleteRef.current;
    setMessagePendingDelete(null);
    pendingDeleteRef.current = null;
    if (!msg || !activeContact || typeof msg.id === 'number') return;
    if (!canDeleteMessageByTime(msg.sentAt)) {
      showFeedback('error', 'Só é possível apagar até 50 horas após o envio.');
      return;
    }
    const inst = instanceForContact(activeContact, selectedInstance);
    const num = activeContact.number;
    try {
      await apiRequest<{ success?: boolean }>('/whatsapp/messages/delete-for-everyone', {
        method: 'POST',
        body: JSON.stringify({
          contactNumber: num,
          messageId: String(msg.id),
          ...(inst ? { instanceName: inst } : {}),
        }),
      });
      const list = (chatHistoryRef.current[num] || []).filter((m) => m.id !== msg.id);
      setChatHistory((prev) => ({ ...prev, [num]: list }));
      const last = list[list.length - 1];
      setContacts((prev) =>
        prev.map((c) =>
          c.number === num
            ? {
                ...c,
                lastMessage: last ? last.text || (last.isMedia ? 'Mídia' : '') || '' : '',
                lastMessageTime: last?.time ?? c.lastMessageTime,
              }
            : c,
        ),
      );
      showFeedback('success', 'Mensagem apagada.');
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'Erro ao apagar mensagem.');
    }
  }, [activeContact, chatHistoryRef, selectedInstance, setChatHistory, setContacts, showFeedback]);

  const handleEditMessageRequest = useCallback((msg: Message) => {
    if (typeof msg.id === 'number') return;
    setEditMessage(msg);
    setEditDraft(msg.text || '');
  }, []);

  const handleSaveEditedMessage = useCallback(async () => {
    if (!activeContact || !editMessage || typeof editMessage.id === 'number') return;
    const text = editDraft.trim();
    if (!text) return;
    if (!canEditMessageByTime(editMessage.sentAt)) {
      showFeedback('error', 'Só é possível editar até 14 minutos após o envio.');
      return;
    }
    setEditSaving(true);
    const inst = instanceForContact(activeContact, selectedInstance);
    const num = activeContact.number;
    const cur = chatHistoryRef.current[num] || [];
    const isLast = cur.length > 0 && cur[cur.length - 1].id === editMessage.id;
    try {
      await apiRequest<{ success?: boolean }>('/whatsapp/messages/update-text', {
        method: 'POST',
        body: JSON.stringify({
          contactNumber: num,
          messageId: String(editMessage.id),
          text,
          ...(inst ? { instanceName: inst } : {}),
        }),
      });
      setChatHistory((prev) => ({
        ...prev,
        [num]: (prev[num] || []).map((m) => (m.id === editMessage.id ? { ...m, text } : m)),
      }));
      if (isLast) {
        setContacts((prev) => prev.map((c) => (c.number === num ? { ...c, lastMessage: text } : c)));
      }
      setEditMessage(null);
      setEditDraft('');
      showFeedback('success', 'Mensagem atualizada.');
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'Erro ao editar mensagem.');
    } finally {
      setEditSaving(false);
    }
  }, [activeContact, editDraft, editMessage, chatHistoryRef, selectedInstance, setChatHistory, setContacts, showFeedback]);

  const closeEditModal = useCallback(() => {
    if (!editSaving) {
      setEditMessage(null);
      setEditDraft('');
    }
  }, [editSaving]);

  const dismissDeleteModal = useCallback(() => {
    setMessagePendingDelete(null);
    pendingDeleteRef.current = null;
  }, []);

  return {
    messagePendingDelete,
    setMessagePendingDelete,
    dismissDeleteModal,
    handleRequestDeleteMessage,
    confirmDeleteSingleMessage,
    editMessage,
    editDraft,
    setEditDraft,
    editSaving,
    handleEditMessageRequest,
    handleSaveEditedMessage,
    closeEditModal,
  } as const;
}
