'use client';

import { useWhatsappLayoutState } from './use-whatsapp-layout-state';
import { useWhatsappRealtimeThread } from './use-whatsapp-realtime-thread';
import { useWhatsappMessagingStack } from './use-whatsapp-messaging-stack';
import { useWhatsappListsAndOs } from './use-whatsapp-lists-and-os';
import type { WhatsappPageViewModel } from './whatsapp-page-view-model';

export function useWhatsappPage(): WhatsappPageViewModel {
  const layout = useWhatsappLayoutState();
  const realtime = useWhatsappRealtimeThread(layout);
  const messaging = useWhatsappMessagingStack(layout, realtime);
  const lists = useWhatsappListsAndOs(layout, messaging);

  const model = {
    ...layout,
    historyMeta: realtime.historyMeta,
    isLoadingOlder: realtime.isLoadingOlder,
    loadOlderMessages: realtime.loadOlderMessages,
    inputText: messaging.inputText,
    setInputText: messaging.setInputText,
    isSending: messaging.isSending,
    previewFile: messaging.previewFile,
    previewUrl: messaging.previewUrl,
    fileInputRef: messaging.fileInputRef,
    handleFileUpload: messaging.handleFileUpload,
    cancelPreview: messaging.cancelPreview,
    handleSendWithRecordingGuard: lists.handleSendWithRecordingGuard,
    cancelMediaSend: messaging.cancelMediaSend,
    recorder: messaging.recorder,
    msgActions: messaging.msgActions,
    kindSaving: messaging.kindSaving,
    updateActiveContactKind: messaging.updateActiveContactKind,
    confirmDeleteConversation: messaging.confirmDeleteConversation,
    filteredActiveContacts: lists.filteredActiveContacts,
    filteredNewContacts: lists.filteredNewContacts,
    startChatWithContact: lists.startChatWithContact,
    osForm: lists.osForm,
    filteredMessages: lists.filteredMessages,
  } satisfies WhatsappPageViewModel;

  return model;
}
