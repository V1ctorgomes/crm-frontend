'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Toast } from '@/components/ui/toast';
import type { Contact, Message, Stage } from '@/components/whatsapp/types';
import { NoInstancesView } from '@/components/whatsapp/NoInstancesView';
import { ContactsSidebar } from '@/components/whatsapp/ContactsSidebar';
import { WhatsAppEmptyChat } from '@/components/whatsapp/WhatsAppEmptyChat';
import { WhatsAppChatPanel } from '@/components/whatsapp/WhatsAppChatPanel';
import { WhatsAppPageModals } from '@/components/whatsapp/WhatsAppPageModals';
import type { TicketCatalogOptions } from '@/lib/ticket-catalog-types';
import { normalizeContactKind, type ContactKind } from '@/lib/contact-kind';
import { useWhatsappContactLists } from './use-whatsapp-contact-lists';
import { useUnreadSync } from './use-unread-sync';
import { useInitialWhatsappData } from './use-initial-data';
import { useNetworkResume } from './use-network-resume';
import { useChatHistory } from './use-chat-history';
import { useStreamIntegration } from './use-stream-integration';
import { useAudioRecorder } from './use-audio-recorder';
import { useCreateTicketForm } from './use-create-ticket-form';
import { useWhatsappMessaging } from './use-whatsapp-messaging';
import { useWhatsappMessageActions } from './use-whatsapp-message-actions';
import { useWhatsappContactKind } from './use-whatsapp-contact-kind';
import { useWhatsappDeleteConversation } from './use-whatsapp-delete-conversation';
import { useWhatsappStartChat } from './use-whatsapp-start-chat';

export default function WhatsAppPage() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  }, []);

  const [hasInstances, setHasInstances] = useState<boolean | null>(null);
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('ALL');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [ticketCatalog, setTicketCatalog] = useState<TicketCatalogOptions | null>(null);
  const [crmCustomers, setCrmCustomers] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({});

  const [isSearchChatOpen, setIsSearchChatOpen] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [contactKindFilter, setContactKindFilter] = useState<'ALL' | ContactKind>('ALL');
  const [isInstanceModalOpen, setIsInstanceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [viewerMessage, setViewerMessage] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListScrollRef = useRef<HTMLDivElement>(null);

  const { unreadByContact, setUnreadByContact } = useUnreadSync(activeContact?.number ?? null);

  useInitialWhatsappData({
    setContacts,
    setActiveContact,
    setStages,
    setTicketCatalog,
    setCrmCustomers,
    setInstances,
    setHasInstances,
  });

  const { historyMeta, setHistoryMeta, chatHistoryRef, isLoadingOlder, loadOlderMessages } = useChatHistory({
    activeNumber: activeContact?.number ?? null,
    chatHistory,
    setChatHistory,
    messageListScrollRef,
    onError: (msg) => showFeedback('error', msg),
  });

  useNetworkResume({ setContacts, setActiveContact, setChatHistory, setHistoryMeta });

  useStreamIntegration({
    activeNumber: activeContact?.number ?? null,
    chatHistoryRef,
    setChatHistory,
    setContacts,
  });

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
    activeContact,
    selectedInstance,
    setChatHistory,
    setContacts,
    showFeedback,
  });

  const recorder = useAudioRecorder({
    onRecorded: (file) => void sendDirectMedia(file, ''),
    onTooShort: () => showFeedback('error', 'Gravação vazia ou demasiado curta. Tente falar mais perto do microfone.'),
    onPermissionDenied: () => showFeedback('error', 'Acesso ao microfone negado.'),
  });

  const msgActions = useWhatsappMessageActions({
    activeContact,
    selectedInstance,
    chatHistoryRef,
    setChatHistory,
    setContacts,
    showFeedback,
  });

  const { kindSaving, updateActiveContactKind } = useWhatsappContactKind({
    activeContact,
    setActiveContact,
    setContacts,
    showFeedback,
  });

  const { confirmDeleteConversation } = useWhatsappDeleteConversation({
    activeContact,
    setActiveContact,
    setChatHistory,
    setHistoryMeta,
    setContacts,
    setUnreadByContact,
    showFeedback,
  });

  const { filteredActiveContacts, filteredNewContacts } = useWhatsappContactLists(
    contacts,
    crmCustomers,
    selectedInstance,
    customerSearch,
    contactKindFilter,
  );

  const startChatWithContact = useWhatsappStartChat({
    contacts,
    selectedInstance,
    setContacts,
    setActiveContact,
    setCustomerSearch,
  });

  const osForm = useCreateTicketForm({ showFeedback });

  const handleSelectContact = (contact: Contact | null) => {
    setActiveContact(contact);
    setIsSearchChatOpen(false);
    setChatSearchTerm('');
    setCustomerSearch('');
    if (contact) localStorage.setItem('lastActiveContact', contact.number);
    else localStorage.removeItem('lastActiveContact');
  };

  const handleSendWithRecordingGuard = useCallback(
    (e?: React.FormEvent) => void handleSendMessage(e, { isRecording: recorder.isRecording }),
    [handleSendMessage, recorder.isRecording],
  );

  const filteredMessages = useMemo(() => {
    const activeMessages = activeContact ? chatHistory[activeContact.number] || [] : [];
    if (!chatSearchTerm) return activeMessages;
    const q = chatSearchTerm.toLowerCase();
    return activeMessages.filter(
      (msg) =>
        (msg.text || '').toLowerCase().includes(q) || (msg.fileName || '').toLowerCase().includes(q),
    );
  }, [activeContact, chatHistory, chatSearchTerm]);

  return (
    <div className="flex h-screen overflow-hidden bg-brand-canvas font-sans">
      <Sidebar />
      <main className="flex-1 flex pt-[60px] md:pt-0 h-full relative overflow-hidden">
        {toast && <Toast type={toast.type} message={toast.message} onDismiss={() => setToast(null)} />}

        {hasInstances === null ? (
          <div className="flex-1 flex items-center justify-center bg-brand-canvas">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : hasInstances === false ? (
          <NoInstancesView />
        ) : (
          <>
            <ContactsSidebar
              activeContact={activeContact}
              customerSearch={customerSearch}
              setCustomerSearch={setCustomerSearch}
              instances={instances}
              selectedInstance={selectedInstance}
              onOpenInstanceModal={() => setIsInstanceModalOpen(true)}
              filteredActiveContacts={filteredActiveContacts}
              filteredNewContacts={filteredNewContacts}
              handleSelectContact={handleSelectContact}
              startChatWithContact={startChatWithContact}
              unreadByContact={unreadByContact}
              contactKindFilter={contactKindFilter}
              onContactKindFilterChange={setContactKindFilter}
              onPushToast={(message, type) => setToast({ type, message })}
            />

            <div className={`flex-1 flex-col relative bg-brand-canvas overflow-hidden ${!activeContact ? 'hidden md:flex' : 'flex'}`}>
              {activeContact ? (
                <WhatsAppChatPanel
                  activeContact={activeContact}
                  openNewTicketModal={() => osForm.openFor(activeContact)}
                  isSearchChatOpen={isSearchChatOpen}
                  setIsSearchChatOpen={setIsSearchChatOpen}
                  chatSearchTerm={chatSearchTerm}
                  setChatSearchTerm={setChatSearchTerm}
                  onOpenDeleteModal={() => setIsDeleteModalOpen(true)}
                  contactKind={normalizeContactKind(activeContact.contactKind)}
                  onContactKindChange={(k) => void updateActiveContactKind(k)}
                  kindSaving={kindSaving}
                  handleSelectContact={handleSelectContact}
                  previewFile={previewFile}
                  previewUrl={previewUrl}
                  cancelPreview={cancelPreview}
                  inputText={inputText}
                  setInputText={setInputText}
                  handleSendMessage={handleSendWithRecordingGuard}
                  isSending={isSending}
                  filteredMessages={filteredMessages}
                  setViewerMessage={setViewerMessage}
                  messageListScrollRef={messageListScrollRef}
                  messagesEndRef={messagesEndRef}
                  onMessageDelete={msgActions.handleRequestDeleteMessage}
                  onMessageEditRequest={msgActions.handleEditMessageRequest}
                  hasMoreOlder={historyMeta[activeContact.number]?.hasMoreOlder ?? false}
                  isLoadingOlder={isLoadingOlder}
                  onLoadOlder={loadOlderMessages}
                  onCancelMediaSend={cancelMediaSend}
                  fileInputRef={fileInputRef}
                  handleFileUpload={handleFileUpload}
                  isRecording={recorder.isRecording}
                  recordingTime={recorder.recordingTime}
                  startRecording={recorder.start}
                  cancelRecording={recorder.cancel}
                  stopRecordingAndSend={recorder.stopAndSend}
                />
              ) : (
                <WhatsAppEmptyChat />
              )}
            </div>
          </>
        )}
      </main>

      <WhatsAppPageModals
        messagePendingDelete={msgActions.messagePendingDelete}
        onCloseDeleteMessage={msgActions.dismissDeleteModal}
        onConfirmDeleteMessage={() => void msgActions.confirmDeleteSingleMessage()}
        isInstanceModalOpen={isInstanceModalOpen}
        onCloseInstanceModal={() => setIsInstanceModalOpen(false)}
        instances={instances}
        selectedInstance={selectedInstance}
        setSelectedInstance={setSelectedInstance}
        handleSelectContact={handleSelectContact}
        isDeleteModalOpen={isDeleteModalOpen}
        onCloseDeleteChat={() => setIsDeleteModalOpen(false)}
        onConfirmDeleteChat={() => {
          setIsDeleteModalOpen(false);
          void confirmDeleteConversation();
        }}
        osModalOpen={osForm.isOpen}
        activeContact={activeContact}
        ticketCatalog={ticketCatalog}
        osFormClose={osForm.close}
        osFormNome={osForm.formNome}
        setOsFormNome={osForm.setFormNome}
        osFormEmail={osForm.formEmail}
        setOsFormEmail={osForm.setFormEmail}
        osFormCpf={osForm.formCpf}
        setOsFormCpf={osForm.setFormCpf}
        osFormMarca={osForm.formMarca}
        setOsFormMarca={osForm.setFormMarca}
        osFormModelo={osForm.formModelo}
        setOsFormModelo={osForm.setFormModelo}
        osFormCustomerType={osForm.formCustomerType}
        setOsFormCustomerType={osForm.setFormCustomerType}
        osFormTicketType={osForm.formTicketType}
        setOsFormTicketType={osForm.setFormTicketType}
        onSubmitOs={() => {
          if (activeContact) void osForm.submit(activeContact, stages);
        }}
        editMessage={msgActions.editMessage}
        onCloseEditModal={msgActions.closeEditModal}
        editDraft={msgActions.editDraft}
        setEditDraft={msgActions.setEditDraft}
        editSaving={msgActions.editSaving}
        onSaveEdit={() => void msgActions.handleSaveEditedMessage()}
        viewerMessage={viewerMessage}
        onCloseViewer={() => setViewerMessage(null)}
      />
    </div>
  );
}
