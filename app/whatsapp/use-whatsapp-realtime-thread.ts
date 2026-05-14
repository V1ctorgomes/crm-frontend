'use client';

import { useChatHistory } from './use-chat-history';
import { useNetworkResume } from './use-network-resume';
import { useStreamIntegration } from './use-stream-integration';
import type { WhatsappLayoutState } from './use-whatsapp-layout-state';

export function useWhatsappRealtimeThread(layout: WhatsappLayoutState) {
  const { historyMeta, setHistoryMeta, chatHistoryRef, isLoadingOlder, loadOlderMessages } = useChatHistory({
    activeNumber: layout.activeContact?.number ?? null,
    chatHistory: layout.chatHistory,
    setChatHistory: layout.setChatHistory,
    messageListScrollRef: layout.messageListScrollRef,
    onError: (msg) => layout.showFeedback('error', msg),
  });

  useNetworkResume({
    setContacts: layout.setContacts,
    setActiveContact: layout.setActiveContact,
    setChatHistory: layout.setChatHistory,
    setHistoryMeta,
  });

  useStreamIntegration({
    activeNumber: layout.activeContact?.number ?? null,
    chatHistoryRef,
    setChatHistory: layout.setChatHistory,
    setContacts: layout.setContacts,
  });

  return {
    historyMeta,
    setHistoryMeta,
    chatHistoryRef,
    isLoadingOlder,
    loadOlderMessages,
  };
}

export type WhatsappRealtimeThread = ReturnType<typeof useWhatsappRealtimeThread>;
