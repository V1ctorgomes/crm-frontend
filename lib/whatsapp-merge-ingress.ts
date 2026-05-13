import { flushSync } from 'react-dom';
import type { Dispatch, SetStateAction, MutableRefObject } from 'react';
import type { Contact, Message } from '@/components/whatsapp/types';
import type { WhatsappIngressDetail } from '@/lib/whatsapp-sse-parse';
import { apiRequest } from '@/lib/api-client';

function idMatches(a: string | number, b: string | number) {
  const sa = String(a);
  const sb = String(b);
  if (sa === sb) return true;
  const tailA = sa.includes(':') ? sa.split(':').pop()! : sa;
  const tailB = sb.includes(':') ? sb.split(':').pop()! : sb;
  return tailA === tailB;
}

/**
 * Atualiza histórico e lista de contactos. Devolve true se entrou uma mensagem **recebida** nova no histórico.
 */
export function mergeWhatsappIngressDetail(
  detail: WhatsappIngressDetail,
  setChatHistory: Dispatch<SetStateAction<Record<string, Message[]>>>,
  setContacts: Dispatch<SetStateAction<Contact[]>>,
  chatHistoryRef: MutableRefObject<Record<string, Message[]>>,
): boolean {
  const {
    contactNumber,
    isFromMe,
    waId,
    newMessage,
    incomingText,
    fallbackSidebarText,
    payload,
    msgData,
  } = detail;

  const incomingNotify = { appendedIncoming: false };

  flushSync(() => {
    setChatHistory((prev) => {
      incomingNotify.appendedIncoming = false;
      const history = prev[contactNumber] || [];

      if (history.some((m) => idMatches(m.id, waId))) return prev;

      if (isFromMe) {
        let dupOptimistic = history.find(
          (m) => m.fromMe && m.text === incomingText && typeof m.id === 'number',
        );

        if (!dupOptimistic && newMessage.isMedia) {
          const recent = history.slice(-6);
          dupOptimistic = recent.find(
            (m) =>
              m.fromMe &&
              m.isMedia === true &&
              (m.fileName || '') === (newMessage.fileName || '') &&
              (m.mimeType || '') === (newMessage.mimeType || ''),
          );
        }

        if (dupOptimistic) {
          const next = {
            ...prev,
            [contactNumber]: history.map((m) =>
              m === dupOptimistic
                ? {
                    ...m,
                    id: waId,
                    sentAt: m.sentAt ?? detail.sentAtIso,
                    mediaData: newMessage.mediaData || m.mediaData,
                    mimeType: newMessage.mimeType || m.mimeType,
                    fileName: newMessage.fileName || m.fileName,
                    sendStatus: 'delivered' as const,
                  }
                : m,
            ),
          };
          chatHistoryRef.current = next;
          return next;
        }

        const nextSent = { ...prev, [contactNumber]: [...history, newMessage] };
        chatHistoryRef.current = nextSent;
        return nextSent;
      }

      incomingNotify.appendedIncoming = true;
      const nextIn = { ...prev, [contactNumber]: [...history, newMessage] };
      chatHistoryRef.current = nextIn;
      return nextIn;
    });
  });

  setContacts((prev) => {
    const idx = prev.findIndex((c) => c.number === contactNumber);
    const updated = [...prev];
    if (idx !== -1) {
      updated[idx].lastMessage = incomingText || fallbackSidebarText;
      updated[idx].lastMessageTime = detail.timeNow;
      updated[idx].instanceName = payload.instance;
      if (msgData.profilePictureUrl) updated[idx].profilePictureUrl = msgData.profilePictureUrl;
      const item = updated.splice(idx, 1)[0];
      updated.unshift(item);
    } else {
      apiRequest('/whatsapp/contacts')
        .then((data) => {
          setContacts(
            (data as any[]).map((c: any) => ({
              ...c,
              lastMessageTime: c.lastMessageTime
                ? new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '',
            })),
          );
        })
        .catch(() => {});
    }
    return updated;
  });

  return incomingNotify.appendedIncoming;
}
