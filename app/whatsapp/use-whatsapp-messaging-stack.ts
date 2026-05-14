'use client';

import { useWhatsappMessaging } from './use-whatsapp-messaging';
import { useAudioRecorder } from './use-audio-recorder';
import { useWhatsappMessageActions } from './use-whatsapp-message-actions';
import { useWhatsappContactKind } from './use-whatsapp-contact-kind';
import { useWhatsappDeleteConversation } from './use-whatsapp-delete-conversation';
import type { WhatsappLayoutState } from './use-whatsapp-layout-state';
import type { WhatsappRealtimeThread } from './use-whatsapp-realtime-thread';

export function useWhatsappMessagingStack(
  layout: WhatsappLayoutState,
  realtime: WhatsappRealtimeThread,
) {
  const {
    inputText,
    setInputText,
    isSending,
    previewFile,
    previewUrl,
    fileInputRef,
    handleFileUpload,
    cancelPreview,
    sendDirectMedia,
    handleSendMessage,
    cancelMediaSend,
  } = useWhatsappMessaging({
    activeContact: layout.activeContact,
    selectedInstance: layout.selectedInstance,
    setChatHistory: layout.setChatHistory,
    setContacts: layout.setContacts,
    showFeedback: layout.showFeedback,
  });

  const recorder = useAudioRecorder({
    onRecorded: (file) => void sendDirectMedia(file, ''),
    onTooShort: () =>
      layout.showFeedback('error', 'Gravação vazia ou demasiado curta. Tente falar mais perto do microfone.'),
    onPermissionDenied: () => layout.showFeedback('error', 'Acesso ao microfone negado.'),
  });

  const msgActions = useWhatsappMessageActions({
    activeContact: layout.activeContact,
    selectedInstance: layout.selectedInstance,
    chatHistoryRef: realtime.chatHistoryRef,
    setChatHistory: layout.setChatHistory,
    setContacts: layout.setContacts,
    showFeedback: layout.showFeedback,
  });

  const { kindSaving, updateActiveContactKind } = useWhatsappContactKind({
    activeContact: layout.activeContact,
    setActiveContact: layout.setActiveContact,
    setContacts: layout.setContacts,
    showFeedback: layout.showFeedback,
  });

  const { confirmDeleteConversation } = useWhatsappDeleteConversation({
    activeContact: layout.activeContact,
    setActiveContact: layout.setActiveContact,
    setChatHistory: layout.setChatHistory,
    setHistoryMeta: realtime.setHistoryMeta,
    setContacts: layout.setContacts,
    setUnreadByContact: layout.setUnreadByContact,
    showFeedback: layout.showFeedback,
  });

  return {
    inputText,
    setInputText,
    isSending,
    previewFile,
    previewUrl,
    fileInputRef,
    handleFileUpload,
    cancelPreview,
    handleSendMessage,
    cancelMediaSend,
    recorder,
    msgActions,
    kindSaving,
    updateActiveContactKind,
    confirmDeleteConversation,
  };
}

export type WhatsappMessagingStack = ReturnType<typeof useWhatsappMessagingStack>;
