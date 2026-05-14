'use client';

import { useCallback, useMemo } from 'react';
import { useWhatsappContactLists } from './use-whatsapp-contact-lists';
import { useWhatsappStartChat } from './use-whatsapp-start-chat';
import { useCreateTicketForm } from './use-create-ticket-form';
import type { WhatsappLayoutState } from './use-whatsapp-layout-state';
import type { WhatsappMessagingStack } from './use-whatsapp-messaging-stack';

export function useWhatsappListsAndOs(layout: WhatsappLayoutState, messaging: WhatsappMessagingStack) {
  const { filteredActiveContacts, filteredNewContacts } = useWhatsappContactLists(
    layout.contacts,
    layout.crmCustomers,
    layout.selectedInstance,
    layout.customerSearch,
    layout.contactKindFilter,
  );

  const startChatWithContact = useWhatsappStartChat({
    contacts: layout.contacts,
    selectedInstance: layout.selectedInstance,
    setContacts: layout.setContacts,
    setActiveContact: layout.setActiveContact,
    setCustomerSearch: layout.setCustomerSearch,
  });

  const osForm = useCreateTicketForm({ showFeedback: layout.showFeedback });

  const handleSendWithRecordingGuard = useCallback(
    (e?: React.FormEvent) =>
      void messaging.handleSendMessage(e, { isRecording: messaging.recorder.isRecording }),
    [messaging.handleSendMessage, messaging.recorder.isRecording],
  );

  const filteredMessages = useMemo(() => {
    const activeMessages = layout.activeContact
      ? layout.chatHistory[layout.activeContact.number] || []
      : [];
    if (!layout.chatSearchTerm) return activeMessages;
    const q = layout.chatSearchTerm.toLowerCase();
    return activeMessages.filter(
      (msg) =>
        (msg.text || '').toLowerCase().includes(q) || (msg.fileName || '').toLowerCase().includes(q),
    );
  }, [layout.activeContact, layout.chatHistory, layout.chatSearchTerm]);

  return {
    filteredActiveContacts,
    filteredNewContacts,
    startChatWithContact,
    osForm,
    handleSendWithRecordingGuard,
    filteredMessages,
  };
}
