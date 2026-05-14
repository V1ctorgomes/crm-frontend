'use client';

import React, { useCallback, useRef, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Toast } from '@/components/ui/toast';
import type { Contact, Message, Stage } from '@/components/whatsapp/types';
import { NoInstancesView } from '@/components/whatsapp/NoInstancesView';
import { ContactsSidebar } from '@/components/whatsapp/ContactsSidebar';
import { ChatHeader } from '@/components/whatsapp/ChatHeader';
import { FilePreview } from '@/components/whatsapp/FilePreview';
import { MessageList } from '@/components/whatsapp/MessageList';
import { ChatInput } from '@/components/whatsapp/ChatInput';
import { WhatsAppEmptyChat } from '@/components/whatsapp/WhatsAppEmptyChat';
import {
  InstanceModal,
  DeleteChatModal,
  DeleteMessageModal,
  CreateTicketModal,
  MediaViewerModal,
  EditMessageModal,
} from '@/components/whatsapp/WhatsAppModals';
import { apiRequest } from '@/lib/api-client';
import type { TicketCatalogOptions } from '@/lib/ticket-catalog-types';
import { canDeleteMessageByTime, canEditMessageByTime } from '@/lib/whatsapp-message-windows';
import { saveUnreadAndBroadcast } from '@/lib/whatsapp-notifications';
import { normalizeContactKind, type ContactKind } from '@/lib/contact-kind';
import { scheduleMessageDeliveredUi } from './utils';
import { useUnreadSync } from './use-unread-sync';
import { useInitialWhatsappData } from './use-initial-data';
import { useNetworkResume } from './use-network-resume';
import { useChatHistory } from './use-chat-history';
import { useStreamIntegration } from './use-stream-integration';
import { useAudioRecorder } from './use-audio-recorder';
import { useCreateTicketForm } from './use-create-ticket-form';

export default function WhatsAppPage() {
  // ─────────────────────────── Estado de UI ───────────────────────────
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  }, []);

  // ─────────────────────────── Dados base ─────────────────────────────
  const [hasInstances, setHasInstances] = useState<boolean | null>(null);
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('ALL');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [ticketCatalog, setTicketCatalog] = useState<TicketCatalogOptions | null>(null);
  const [crmCustomers, setCrmCustomers] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({});

  // ─────────────────────────── Composição/envio ───────────────────────
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewerMessage, setViewerMessage] = useState<Message | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListScrollRef = useRef<HTMLDivElement>(null);
  const pendingMediaAbortRef = useRef<AbortController | null>(null);
  const pendingMediaTempIdRef = useRef<number | null>(null);

  // ─────────────────────────── Filtros/menus ──────────────────────────
  const [isSearchChatOpen, setIsSearchChatOpen] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [contactKindFilter, setContactKindFilter] = useState<'ALL' | ContactKind>('ALL');
  const [contactKindSaving, setContactKindSaving] = useState(false);
  const [isInstanceModalOpen, setIsInstanceModalOpen] = useState(false);

  // ─────────────────────────── Modais de mensagem ─────────────────────
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editMessage, setEditMessage] = useState<Message | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [messagePendingDelete, setMessagePendingDelete] = useState<Message | null>(null);

  // ─────────────────────────── Hooks de domínio ───────────────────────
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

  const osForm = useCreateTicketForm({ showFeedback });

  const cancelMediaSend = useCallback((messageId: string | number) => {
    if (pendingMediaTempIdRef.current !== null && pendingMediaTempIdRef.current === messageId) {
      pendingMediaAbortRef.current?.abort();
    }
  }, []);

  // ─────────────────────────── Handlers ───────────────────────────────
  const handleSelectContact = (contact: Contact | null) => {
    setActiveContact(contact);
    setIsSearchChatOpen(false);
    setChatSearchTerm('');
    setCustomerSearch('');
    if (contact) localStorage.setItem('lastActiveContact', contact.number);
    else localStorage.removeItem('lastActiveContact');
  };

  const updateActiveContactKind = async (kind: ContactKind) => {
    if (!activeContact) return;
    setContactKindSaving(true);
    try {
      await apiRequest(`/whatsapp/contacts/${encodeURIComponent(activeContact.number)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactKind: kind }),
      });
      const num = activeContact.number;
      setActiveContact((prev) => (prev && prev.number === num ? { ...prev, contactKind: kind } : prev));
      setContacts((prev) => prev.map((c) => (c.number === num ? { ...c, contactKind: kind } : c)));
      showFeedback('success', 'Classificação guardada.');
    } catch (e: unknown) {
      showFeedback('error', e instanceof Error ? e.message : 'Erro ao guardar.');
    } finally {
      setContactKindSaving(false);
    }
  };

  const instanceForActiveContact = () =>
    activeContact?.instanceName || (selectedInstance !== 'ALL' ? selectedInstance : undefined);

  const handleRequestDeleteMessage = (msg: Message) => {
    if (!activeContact || typeof msg.id === 'number') {
      showFeedback('error', 'Aguarde a confirmação do envio antes de apagar.');
      return;
    }
    if (!canDeleteMessageByTime(msg.sentAt)) {
      showFeedback('error', 'Só é possível apagar até 50 horas após o envio.');
      return;
    }
    setMessagePendingDelete(msg);
  };

  const confirmDeleteSingleMessage = async () => {
    const msg = messagePendingDelete;
    setMessagePendingDelete(null);
    if (!msg || !activeContact || typeof msg.id === 'number') return;
    if (!canDeleteMessageByTime(msg.sentAt)) {
      showFeedback('error', 'Só é possível apagar até 50 horas após o envio.');
      return;
    }
    const inst = instanceForActiveContact();
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
  };

  const handleEditMessageRequest = (msg: Message) => {
    if (typeof msg.id === 'number') return;
    setEditMessage(msg);
    setEditDraft(msg.text || '');
  };

  const handleSaveEditedMessage = async () => {
    if (!activeContact || !editMessage || typeof editMessage.id === 'number') return;
    const text = editDraft.trim();
    if (!text) return;
    if (!canEditMessageByTime(editMessage.sentAt)) {
      showFeedback('error', 'Só é possível editar até 14 minutos após o envio.');
      return;
    }
    setEditSaving(true);
    const inst = instanceForActiveContact();
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
  };

  const confirmDeleteConversation = async () => {
    if (!activeContact) return;
    setIsDeleteModalOpen(false);
    try {
      await apiRequest(`/whatsapp/history/${encodeURIComponent(activeContact.number)}`, { method: 'DELETE' });
      setChatHistory((prev) => ({ ...prev, [activeContact.number]: [] }));
      setHistoryMeta((prev) => ({ ...prev, [activeContact.number]: { hasMoreOlder: false } }));
      const deletedNumber = activeContact.number;
      setUnreadByContact((prev) => {
        const next = { ...prev };
        delete next[deletedNumber];
        saveUnreadAndBroadcast(next);
        return next;
      });
      setContacts((prev) =>
        prev.map((c) => (c.number === activeContact.number ? { ...c, lastMessage: '', lastMessageTime: '' } : c)),
      );
      setActiveContact(null);
      localStorage.removeItem('lastActiveContact');
      showFeedback('success', 'Conversa excluída com sucesso.');
    } catch {
      showFeedback('error', 'Falha de conexão ao apagar conversa.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeContact) return;
    if (file.size > 15 * 1024 * 1024) {
      showFeedback('error', 'Arquivo muito grande (máx 15MB).');
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    setPreviewFile(file);
  };

  const cancelPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl(null);
    setInputText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendDirectMedia = async (file: File, caption: string) => {
    if (!activeContact) return;
    const targetNumber = activeContact.number;
    const targetInstance = activeContact.instanceName || (selectedInstance !== 'ALL' ? selectedInstance : undefined);
    const now = new Date();
    const timeNow = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sentAtIso = now.toISOString();
    setIsSending(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('number', targetNumber);
    formData.append('caption', caption);
    if (targetInstance) formData.append('instanceName', targetInstance);

    const tempId = Date.now();
    const tempUrl = URL.createObjectURL(file);
    const optimisticMsg: Message = {
      id: tempId,
      text: caption || '',
      type: 'sent',
      time: timeNow,
      sentAt: sentAtIso,
      fromMe: true,
      senderNumber: targetNumber,
      isMedia: true,
      mediaData: tempUrl,
      mimeType: file.type,
      fileName: file.name,
      sendStatus: 'sending',
    };

    setChatHistory((prev) => ({ ...prev, [targetNumber]: [...(prev[targetNumber] || []), optimisticMsg] }));

    setContacts((prev) => {
      const idx = prev.findIndex((c) => c.number === targetNumber);
      const updated = [...prev];
      if (idx !== -1) {
        let fallbackText = 'Documento';
        if (file.type.startsWith('image/')) fallbackText = 'Imagem';
        else if (file.type.startsWith('video/')) fallbackText = 'Vídeo';
        else if (file.type.startsWith('audio/')) fallbackText = 'Áudio';
        updated[idx].lastMessage = caption || fallbackText;
        updated[idx].lastMessageTime = timeNow;
        if (targetInstance) updated[idx].instanceName = targetInstance;
        const item = updated.splice(idx, 1)[0];
        updated.unshift(item);
      }
      return updated;
    });

    const ac = new AbortController();
    pendingMediaAbortRef.current = ac;
    pendingMediaTempIdRef.current = tempId;

    try {
      const savedData = await apiRequest<{
        messageId?: string;
        id?: string;
        mediaData?: string;
      }>('/whatsapp/send-media', { method: 'POST', body: formData, signal: ac.signal });
      if (!savedData?.mediaData) throw new Error('Resposta inválida do servidor.');
      const newId = savedData.messageId || savedData.id || tempId;
      setChatHistory((prev) => ({
        ...prev,
        [targetNumber]: (prev[targetNumber] || []).map((msg) => {
          if (msg.id !== tempId) return msg;
          if (typeof msg.mediaData === 'string' && msg.mediaData.startsWith('blob:')) {
            URL.revokeObjectURL(msg.mediaData);
          }
          return { ...msg, id: newId, mediaData: savedData.mediaData, sendStatus: 'sent' };
        }),
      }));
      scheduleMessageDeliveredUi(setChatHistory, targetNumber, newId);
    } catch (error) {
      const aborted =
        (typeof error === 'object' &&
          error !== null &&
          ((error as { name?: string }).name === 'AbortError' ||
            String((error as Error).message || '').includes('aborted'))) ||
        (error instanceof DOMException && error.name === 'AbortError');
      if (!aborted) {
        showFeedback('error', error instanceof Error ? error.message : 'Erro ao enviar arquivo.');
      }
      setChatHistory((prev) => {
        const list = prev[targetNumber] || [];
        const doomed = list.find((m) => m.id === tempId);
        if (doomed && typeof doomed.mediaData === 'string' && doomed.mediaData.startsWith('blob:')) {
          URL.revokeObjectURL(doomed.mediaData);
        }
        return { ...prev, [targetNumber]: list.filter((m) => m.id !== tempId) };
      });
    } finally {
      if (pendingMediaTempIdRef.current === tempId) pendingMediaTempIdRef.current = null;
      if (pendingMediaAbortRef.current === ac) pendingMediaAbortRef.current = null;
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (recorder.isRecording || isSending || !activeContact) return;
    if (!inputText.trim() && !previewFile) return;

    const targetNumber = activeContact.number;
    const targetInstance = activeContact.instanceName || (selectedInstance !== 'ALL' ? selectedInstance : undefined);
    const textToSend = inputText;

    if (previewFile) {
      const fileToSend = previewFile;
      setInputText('');
      setPreviewFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await sendDirectMedia(fileToSend, textToSend);
      return;
    }

    const now = new Date();
    const timeNow = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sentAtIso = now.toISOString();
    setIsSending(true);
    const tempId = Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      text: textToSend,
      type: 'sent',
      time: timeNow,
      sentAt: sentAtIso,
      fromMe: true,
      senderNumber: targetNumber,
      sendStatus: 'sending',
    };

    setChatHistory((prev) => ({ ...prev, [targetNumber]: [...(prev[targetNumber] || []), optimisticMsg] }));

    setContacts((prev) => {
      const idx = prev.findIndex((c) => c.number === targetNumber);
      const updated = [...prev];
      if (idx !== -1) {
        updated[idx].lastMessage = textToSend;
        updated[idx].lastMessageTime = timeNow;
        if (targetInstance) updated[idx].instanceName = targetInstance;
        const item = updated.splice(idx, 1)[0];
        updated.unshift(item);
      }
      return updated;
    });

    setInputText('');

    try {
      const res = await apiRequest<{ messageId?: string }>('/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({ number: targetNumber, text: textToSend, instanceName: targetInstance }),
      });
      const newId = res?.messageId ?? tempId;
      setChatHistory((prev) => ({
        ...prev,
        [targetNumber]: (prev[targetNumber] || []).map((m) =>
          m.id === tempId
            ? { ...m, ...(res?.messageId ? { id: res.messageId } : {}), sendStatus: 'sent' as const }
            : m,
        ),
      }));
      scheduleMessageDeliveredUi(setChatHistory, targetNumber, newId);
    } catch {
      showFeedback('error', 'Erro de conexão.');
      setChatHistory((prev) => ({
        ...prev,
        [targetNumber]: (prev[targetNumber] || []).filter((m) => m.id !== tempId),
      }));
    } finally {
      setIsSending(false);
    }
  };

  const recorder = useAudioRecorder({
    onRecorded: (file) => sendDirectMedia(file, ''),
    onTooShort: () => showFeedback('error', 'Gravação vazia ou demasiado curta. Tente falar mais perto do microfone.'),
    onPermissionDenied: () => showFeedback('error', 'Acesso ao microfone negado.'),
  });

  const startChatWithContact = (contact: any) => {
    const existing = contacts.find((c) => c.number === contact.number);
    const targetInstance = selectedInstance !== 'ALL' ? selectedInstance : undefined;

    if (existing) {
      setContacts((prev) =>
        prev.map((c) =>
          c.number === contact.number
            ? {
                ...c,
                lastMessage: 'Nova Conversa',
                lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }
            : c,
        ),
      );
      setActiveContact({ ...existing, lastMessage: 'Nova Conversa' });
    } else {
      const newContact: Contact = {
        number: contact.number,
        name: contact.name,
        lastMessage: 'Nova Conversa',
        lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        email: contact.email,
        cnpj: contact.cnpj,
        instanceName: targetInstance,
        contactKind: 'UNKNOWN',
      };
      setContacts((prev) => [newContact, ...prev]);
      setActiveContact(newContact);
    }
    setCustomerSearch('');
  };

  // ─────────────────────────── Filtros derivados ──────────────────────
  const activeMessages = activeContact ? chatHistory[activeContact.number] || [] : [];
  const filteredMessages = chatSearchTerm
    ? activeMessages.filter(
        (msg) =>
          (msg.text || '').toLowerCase().includes(chatSearchTerm.toLowerCase()) ||
          (msg.fileName || '').toLowerCase().includes(chatSearchTerm.toLowerCase()),
      )
    : activeMessages;

  const activeContactsList = contacts.filter(
    (c) => c.lastMessage && c.lastMessage.trim() !== '' && (selectedInstance === 'ALL' || c.instanceName === selectedInstance),
  );
  const filteredActiveContacts = activeContactsList
    .filter(
      (c) => (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) || (c.number || '').includes(customerSearch),
    )
    .filter((c) => (contactKindFilter === 'ALL' ? true : normalizeContactKind(c.contactKind) === contactKindFilter));
  const inactiveContactsList = contacts.filter(
    (c) =>
      (!c.lastMessage || c.lastMessage.trim() === '') &&
      (selectedInstance === 'ALL' || !c.instanceName || c.instanceName === selectedInstance),
  );

  const availableToChat = [...inactiveContactsList];
  crmCustomers.forEach((cust) => {
    let cleanPhone = cust.phone ? cust.phone.replace(/\D/g, '') : '';
    if (cleanPhone.length === 10 || cleanPhone.length === 11) cleanPhone = `55${cleanPhone}`;
    if (
      cleanPhone &&
      !availableToChat.some((c) => c.number === cleanPhone) &&
      !activeContactsList.some((c) => c.number === cleanPhone)
    ) {
      availableToChat.push({
        number: cleanPhone,
        name: cust.name,
        lastMessage: '',
        lastMessageTime: '',
        email: cust.email,
        cnpj: cust.company,
        instanceName: undefined,
      });
    }
  });

  const filteredNewContacts = availableToChat.filter(
    (c) => (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) || (c.number || '').includes(customerSearch),
  );

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
                <>
                  <ChatHeader
                    activeContact={activeContact}
                    handleSelectContact={handleSelectContact}
                    openNewTicketModal={() => osForm.openFor(activeContact)}
                    isSearchChatOpen={isSearchChatOpen}
                    setIsSearchChatOpen={setIsSearchChatOpen}
                    chatSearchTerm={chatSearchTerm}
                    setChatSearchTerm={setChatSearchTerm}
                    onOpenDeleteModal={() => setIsDeleteModalOpen(true)}
                    contactKind={normalizeContactKind(activeContact.contactKind)}
                    onContactKindChange={(k) => void updateActiveContactKind(k)}
                    kindSaving={contactKindSaving}
                  />

                  {previewFile && previewUrl && (
                    <FilePreview
                      previewFile={previewFile}
                      previewUrl={previewUrl}
                      cancelPreview={cancelPreview}
                      inputText={inputText}
                      setInputText={setInputText}
                      handleSendMessage={handleSendMessage}
                      isSending={isSending}
                    />
                  )}

                  <MessageList
                    key={activeContact.number}
                    conversationKey={activeContact.number}
                    filteredMessages={filteredMessages}
                    chatSearchTerm={chatSearchTerm}
                    setViewerMessage={setViewerMessage}
                    listScrollRef={messageListScrollRef}
                    messagesEndRef={messagesEndRef}
                    onMessageDelete={handleRequestDeleteMessage}
                    onMessageEditRequest={handleEditMessageRequest}
                    hasMoreOlder={historyMeta[activeContact.number]?.hasMoreOlder ?? false}
                    isLoadingOlder={isLoadingOlder}
                    onLoadOlder={loadOlderMessages}
                    onCancelMediaSend={cancelMediaSend}
                  />

                  <ChatInput
                    fileInputRef={fileInputRef}
                    handleFileUpload={handleFileUpload}
                    isRecording={recorder.isRecording}
                    recordingTime={recorder.recordingTime}
                    inputText={inputText}
                    setInputText={setInputText}
                    isSending={isSending}
                    previewFile={previewFile}
                    startRecording={recorder.start}
                    cancelRecording={recorder.cancel}
                    stopRecordingAndSend={recorder.stopAndSend}
                    handleSendMessage={handleSendMessage}
                  />
                </>
              ) : (
                <WhatsAppEmptyChat />
              )}
            </div>
          </>
        )}
      </main>

      {messagePendingDelete && (
        <DeleteMessageModal
          message={messagePendingDelete}
          onClose={() => setMessagePendingDelete(null)}
          onConfirm={confirmDeleteSingleMessage}
        />
      )}
      {isInstanceModalOpen && (
        <InstanceModal
          onClose={() => setIsInstanceModalOpen(false)}
          instances={instances}
          selectedInstance={selectedInstance}
          setSelectedInstance={setSelectedInstance}
          handleSelectContact={handleSelectContact}
        />
      )}
      {isDeleteModalOpen && (
        <DeleteChatModal onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDeleteConversation} />
      )}
      {osForm.isOpen && activeContact && (
        <CreateTicketModal
          onClose={osForm.close}
          formNome={osForm.formNome}
          setFormNome={osForm.setFormNome}
          formEmail={osForm.formEmail}
          setFormEmail={osForm.setFormEmail}
          formCpf={osForm.formCpf}
          setFormCpf={osForm.setFormCpf}
          formMarca={osForm.formMarca}
          setFormMarca={osForm.setFormMarca}
          formModelo={osForm.formModelo}
          setFormModelo={osForm.setFormModelo}
          formCustomerType={osForm.formCustomerType}
          setFormCustomerType={osForm.setFormCustomerType}
          formTicketType={osForm.formTicketType}
          setFormTicketType={osForm.setFormTicketType}
          handleCreateTicket={() => void osForm.submit(activeContact, stages)}
          ticketCatalog={ticketCatalog}
        />
      )}
      {editMessage && (
        <EditMessageModal
          onClose={() => {
            if (!editSaving) {
              setEditMessage(null);
              setEditDraft('');
            }
          }}
          draft={editDraft}
          setDraft={setEditDraft}
          isSaving={editSaving}
          onSave={() => void handleSaveEditedMessage()}
        />
      )}
      {viewerMessage && viewerMessage.mediaData && (
        <MediaViewerModal viewerMessage={viewerMessage} onClose={() => setViewerMessage(null)} />
      )}
    </div>
  );
}
