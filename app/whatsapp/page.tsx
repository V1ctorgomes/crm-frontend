'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar'; 
import { Toast } from '@/components/ui/toast';
import { Message, Contact, Stage } from '@/components/whatsapp/types';
import { NoInstancesView } from '@/components/whatsapp/NoInstancesView';
import { ContactsSidebar } from '@/components/whatsapp/ContactsSidebar';
import { ChatHeader } from '@/components/whatsapp/ChatHeader';
import { FilePreview } from '@/components/whatsapp/FilePreview';
import { MessageList } from '@/components/whatsapp/MessageList';
import { ChatInput } from '@/components/whatsapp/ChatInput';
import {
  InstanceModal,
  DeleteChatModal,
  DeleteMessageModal,
  CreateTicketModal,
  MediaViewerModal,
  EditMessageModal,
} from '@/components/whatsapp/WhatsAppModals';
import { apiRequest } from '@/lib/api-client';
import { formatCpfCnpjInput, validateCreateTicketForm } from '@/lib/ticket-form-validation';
import type { TicketCatalogOptions } from '@/lib/ticket-catalog-types';
import {
  loadUnreadByContact,
  saveUnreadAndBroadcast,
  WHATSAPP_UNREAD_STORAGE_KEY,
} from '@/lib/whatsapp-notifications';
import { mergeWhatsappIngressDetail } from '@/lib/whatsapp-merge-ingress';
import { whatsappIngressMergerRef } from '@/lib/whatsapp-stream-merge';
import { whatsappActiveContactRef } from '@/lib/whatsapp-presence';
import { canDeleteMessageByTime, canEditMessageByTime } from '@/lib/whatsapp-message-windows';

/**
 * Preferir AAC em MP4 quando existir: reproduz no Safari/iOS e no CRM; WebM costuma ficar «mudo» no Safari.
 * Depois WebM/Opus (Chrome, Firefox, Edge).
 */
function pickAudioRecordingMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = [
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
  ];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return undefined;
}

function audioFileExtensionFromMime(blobType: string): string {
  const t = blobType.toLowerCase();
  if (t.includes('mp4')) return 'm4a';
  if (t.includes('ogg')) return 'ogg';
  return 'webm';
}

export default function WhatsAppPage() {
  const [hasInstances, setHasInstances] = useState<boolean | null>(null);
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('ALL');
  
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({});
  const [unreadByContact, setUnreadByContact] = useState<Record<string, number>>(() => loadUnreadByContact());

  const chatHistoryRef = useRef<Record<string, Message[]>>({});
  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  useEffect(() => {
    whatsappActiveContactRef.current = activeContact?.number ?? null;
    return () => {
      whatsappActiveContactRef.current = null;
    };
  }, [activeContact]);

  /** Inclui conversa restaurada de `lastActiveContact` sem passar por `handleSelectContact`. */
  useEffect(() => {
    const n = activeContact?.number;
    if (!n) return;
    setUnreadByContact((prev) => {
      if (!(prev[n] > 0)) return prev;
      const next = { ...prev, [n]: 0 };
      saveUnreadAndBroadcast(next);
      return next;
    });
  }, [activeContact?.number]);

  useEffect(() => {
    whatsappIngressMergerRef.current = (detail) =>
      mergeWhatsappIngressDetail(detail, setChatHistory, setContacts, chatHistoryRef);
    return () => {
      whatsappIngressMergerRef.current = null;
    };
  }, [setChatHistory, setContacts]);

  useEffect(() => {
    const sync = () => setUnreadByContact(loadUnreadByContact());
    const onStorage = (e: StorageEvent) => {
      if (e.key === WHATSAPP_UNREAD_STORAGE_KEY) sync();
    };
    window.addEventListener('crm-whatsapp-unread', sync as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('crm-whatsapp-unread', sync as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewerMessage, setViewerMessage] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States: Pesquisas e Modais
  const [isSearchChatOpen, setIsSearchChatOpen] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [crmCustomers, setCrmCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isInstanceModalOpen, setIsInstanceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [editMessage, setEditMessage] = useState<Message | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [messagePendingDelete, setMessagePendingDelete] = useState<Message | null>(null);

  // States: Formulário de OS
  const [stages, setStages] = useState<Stage[]>([]);
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [formCustomerType, setFormCustomerType] = useState(''); 
  const [formTicketType, setFormTicketType] = useState('');
  const [ticketCatalog, setTicketCatalog] = useState<TicketCatalogOptions | null>(null);

  // States: Gravação de Áudio
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingMimeRef = useRef<string>('audio/webm');
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  const handleSelectContact = (contact: Contact | null) => {
    setActiveContact(contact);
    setIsSearchChatOpen(false);
    setChatSearchTerm('');
    setCustomerSearch('');
    if (contact) localStorage.setItem('lastActiveContact', contact.number);
    else localStorage.removeItem('lastActiveContact');
  };

  useEffect(() => {
    const n = activeContact?.number;
    const el = messageListScrollRef.current;
    if (!n || !el) return;

    const scrollToBottom = () => {
      el.scrollTop = el.scrollHeight;
    };

    scrollToBottom();
    const raf1 = requestAnimationFrame(scrollToBottom);
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(scrollToBottom));
    const t = window.setTimeout(scrollToBottom, 80);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(t);
    };
  }, [activeContact?.number, chatHistory, chatSearchTerm]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [me, contactsData, stagesData, catData, customersData] = await Promise.all([
          apiRequest('/users/me').catch(() => null),
          apiRequest('/whatsapp/contacts').catch(() => []),
          apiRequest('/tickets/stages').catch(() => []),
          apiRequest('/ticket-catalog').catch(() => null),
          apiRequest('/customers').catch(() => []),
        ]);

        const formattedContacts = contactsData.map((c: any) => ({ ...c, lastMessageTime: c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '' }));
        setContacts(formattedContacts);

        const savedNumber = localStorage.getItem('lastActiveContact');
        if (savedNumber) {
          const foundContact = formattedContacts.find((c: Contact) => c.number === savedNumber);
          if (foundContact) setActiveContact(foundContact);
        }

        setStages(stagesData);
        setTicketCatalog(catData as TicketCatalogOptions | null);
        setCrmCustomers(customersData);

        if (me?.id) {
          const fetchedInstances = await apiRequest(`/instances/user/${me.id}`).catch(() => []);
          const connected = fetchedInstances.filter((i: any) => i.status === 'connected');
          setInstances(connected);
          setHasInstances(connected.length > 0);
        } else {
          setHasInstances(false);
        }
      } catch (err) { setHasInstances(false); }
    };
    fetchInitialData();
  }, [baseUrl]);

  useEffect(() => {
    if (activeContact && !chatHistory[activeContact.number]) {
      const fetchHistory = async () => {
        try {
          const data = await apiRequest(`/whatsapp/history/${encodeURIComponent(activeContact.number)}`).catch(() => []);
          const formattedMessages = data.map((m: any) => {
            const ts = m.timestamp ? new Date(m.timestamp) : new Date();
            return {
              id: m.id,
              text: m.text,
              type: m.type,
              time: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sentAt: ts.toISOString(),
              fromMe: m.type === 'sent',
              senderNumber: m.contactNumber,
              isMedia: m.isMedia,
              mediaData: m.mediaData,
              mimeType: m.mimeType,
              fileName: m.fileName,
            };
          });
          setChatHistory(prev => ({ ...prev, [activeContact.number]: formattedMessages }));
        } catch (err) {}
      };
      fetchHistory();
    }
  }, [activeContact, baseUrl, chatHistory]);

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
        setContacts((prev) =>
          prev.map((c) => (c.number === num ? { ...c, lastMessage: text } : c)),
        );
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
      setChatHistory(prev => ({ ...prev, [activeContact.number]: [] }));
      const deletedNumber = activeContact.number;
      setUnreadByContact((prev) => {
        const next = { ...prev };
        delete next[deletedNumber];
        saveUnreadAndBroadcast(next);
        return next;
      });
      setContacts(prev => prev.map(c => c.number === activeContact.number ? { ...c, lastMessage: '', lastMessageTime: '' } : c));
      setActiveContact(null);
      localStorage.removeItem('lastActiveContact');
      showFeedback('success', "Conversa excluída com sucesso.");
    } catch (err) { showFeedback('error', "Falha de conexão ao apagar conversa."); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeContact) return;
    if (file.size > 15 * 1024 * 1024) { showFeedback('error', "Arquivo muito grande (máx 15MB)."); return; }
    setPreviewUrl(URL.createObjectURL(file));
    setPreviewFile(file);
  };

  const cancelPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null); setPreviewUrl(null); setInputText('');
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
    };

    setChatHistory(prev => ({ ...prev, [targetNumber]: [...(prev[targetNumber] || []), optimisticMsg] }));

    setContacts(prev => {
      const idx = prev.findIndex(c => c.number === targetNumber);
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

    try {
      const savedData = await apiRequest('/whatsapp/send-media', { method: 'POST', body: formData });
      setChatHistory((prev) => ({
        ...prev,
        [targetNumber]: prev[targetNumber].map((msg) => {
          if (msg.id !== tempId) return msg;
          if (typeof msg.mediaData === 'string' && msg.mediaData.startsWith('blob:')) {
            URL.revokeObjectURL(msg.mediaData);
          }
          return {
            ...msg,
            id: (savedData as { messageId?: string; id?: string }).messageId || savedData.id,
            mediaData: savedData.mediaData,
          };
        }),
      }));
    } catch (error) { showFeedback('error', "Erro de conexão ao enviar arquivo."); } 
    finally { setIsSending(false); }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isRecording || isSending || !activeContact) return;
    if (!inputText.trim() && !previewFile) return;

    const targetNumber = activeContact.number;
    const targetInstance = activeContact.instanceName || (selectedInstance !== 'ALL' ? selectedInstance : undefined);
    const textToSend = inputText;
    
    if (previewFile) {
      const fileToSend = previewFile;
      setInputText(''); setPreviewFile(null); if (fileInputRef.current) fileInputRef.current.value = '';
      await sendDirectMedia(fileToSend, textToSend);
    } else {
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
      };
      
      setChatHistory(prev => ({ ...prev, [targetNumber]: [...(prev[targetNumber] || []), optimisticMsg] }));
      
      setContacts(prev => {
        const idx = prev.findIndex(c => c.number === targetNumber);
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
        if (res?.messageId) {
          setChatHistory((prev) => ({
            ...prev,
            [targetNumber]: (prev[targetNumber] || []).map((m) =>
              m.id === tempId ? { ...m, id: res.messageId! } : m,
            ),
          }));
        }
      } catch (error) { showFeedback('error', "Erro de conexão."); } finally { setIsSending(false); }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeChoice = pickAudioRecordingMimeType();
      const mediaRecorder = mimeChoice
        ? new MediaRecorder(stream, { mimeType: mimeChoice })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      isCancelledRef.current = false;
      recordingMimeRef.current = mediaRecorder.mimeType || 'audio/webm';

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (isCancelledRef.current) return;
        const chunks = audioChunksRef.current;
        const totalBytes = chunks.reduce((n, b) => n + b.size, 0);
        if (totalBytes < 256) {
          showFeedback('error', 'Gravação vazia ou demasiado curta. Tente falar mais perto do microfone.');
          return;
        }
        const blobType = recordingMimeRef.current || 'audio/webm';
        const audioBlob = new Blob(chunks, { type: blobType });
        const ext = audioFileExtensionFromMime(blobType);
        const audioFile = new File([audioBlob], `audio_${Date.now()}.${ext}`, { type: blobType });
        await sendDirectMedia(audioFile, '');
      };

      // Timeslice garante chunks antes do stop (sem isto, alguns browsers gravam silêncio / ficheiro vazio).
      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) { showFeedback('error', "Acesso ao microfone negado."); }
  };

  const stopRecordingAndSend = () => {
    const mr = mediaRecorderRef.current;
    if (!mr || !isRecording) return;
    try {
      if (mr.state === 'recording') mr.requestData();
    } catch {
      /* ignore */
    }
    mr.stop();
    setIsRecording(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const cancelRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr || !isRecording) return;
    isCancelledRef.current = true;
    try {
      if (mr.state === 'recording') mr.requestData();
    } catch {
      /* ignore */
    }
    mr.stop();
    setIsRecording(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const openNewTicketModal = () => {
    if (!activeContact) return;
    setFormNome(activeContact.name || '');
    setFormEmail((activeContact.email || '').trim().toLowerCase());
    setFormCpf(formatCpfCnpjInput(activeContact.cnpj || ''));
    setFormMarca('');
    setFormModelo('');
    setFormCustomerType('');
    setFormTicketType('');
    setIsNewTicketModalOpen(true);
  };

  const handleCreateTicket = async () => {
    if (!activeContact || stages.length === 0) {
      return showFeedback('error', 'Nenhuma fase de Kanban configurada.');
    }
    const stageId = stages[0]?.id || '';
    const validated = validateCreateTicketForm({
      contactNumber: activeContact.number,
      nome: formNome,
      email: formEmail,
      cpf: formCpf,
      marca: formMarca,
      modelo: formModelo,
      customerType: formCustomerType,
      ticketType: formTicketType,
      stageId,
    });
    if (!validated.ok) return showFeedback('error', validated.message);
    try {
      await apiRequest('/tickets', { method: 'POST', body: JSON.stringify(validated.body) });
      setIsNewTicketModalOpen(false);
      showFeedback('success', 'OS criada no Kanban!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar a solicitação.';
      showFeedback('error', msg);
    }
  };

  const startChatWithContact = (contact: any) => {
    const existing = contacts.find(c => c.number === contact.number);
    const targetInstance = selectedInstance !== 'ALL' ? selectedInstance : undefined;

    if (existing) {
      setContacts(prev => prev.map(c => c.number === contact.number ? { ...c, lastMessage: 'Nova Conversa', lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : c));
      setActiveContact({ ...existing, lastMessage: 'Nova Conversa' });
    } else {
      const newContact: Contact = { number: contact.number, name: contact.name, lastMessage: 'Nova Conversa', lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), email: contact.email, cnpj: contact.cnpj, instanceName: targetInstance };
      setContacts(prev => [newContact, ...prev]);
      setActiveContact(newContact);
    }
    setCustomerSearch(''); 
  };

  // Filtros de contatos e mensagens
  const activeMessages = activeContact ? (chatHistory[activeContact.number] || []) : [];
  const filteredMessages = chatSearchTerm ? activeMessages.filter(msg => (msg.text || '').toLowerCase().includes(chatSearchTerm.toLowerCase()) || (msg.fileName || '').toLowerCase().includes(chatSearchTerm.toLowerCase())) : activeMessages;
  const activeContactsList = contacts.filter(c => c.lastMessage && c.lastMessage.trim() !== '' && (selectedInstance === 'ALL' || c.instanceName === selectedInstance));
  const filteredActiveContacts = activeContactsList.filter(c => (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) || (c.number || '').includes(customerSearch));
  const inactiveContactsList = contacts.filter(c => (!c.lastMessage || c.lastMessage.trim() === '') && (selectedInstance === 'ALL' || !c.instanceName || c.instanceName === selectedInstance));
  
  const availableToChat = [...inactiveContactsList];
  crmCustomers.forEach(cust => {
    let cleanPhone = cust.phone ? cust.phone.replace(/\D/g, '') : '';
    if (cleanPhone.length === 10 || cleanPhone.length === 11) cleanPhone = `55${cleanPhone}`;
    if (cleanPhone && !availableToChat.some(c => c.number === cleanPhone) && !activeContactsList.some(c => c.number === cleanPhone)) {
      availableToChat.push({ number: cleanPhone, name: cust.name, lastMessage: '', lastMessageTime: '', email: cust.email, cnpj: cust.company, instanceName: undefined });
    }
  });

  const filteredNewContacts = availableToChat.filter(c => (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) || (c.number || '').includes(customerSearch));

  return (
    <div className="flex h-screen overflow-hidden bg-brand-canvas font-sans">
      <Sidebar />
      <main className="flex-1 flex pt-[60px] md:pt-0 h-full relative overflow-hidden">
        
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onDismiss={() => setToast(null)}
          />
        )}

        {hasInstances === null ? (
          <div className="flex-1 flex items-center justify-center bg-brand-canvas"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : hasInstances === false ? (
          <NoInstancesView />
        ) : (
          <>
            <ContactsSidebar 
              activeContact={activeContact} customerSearch={customerSearch} setCustomerSearch={setCustomerSearch}
              instances={instances} selectedInstance={selectedInstance} onOpenInstanceModal={() => setIsInstanceModalOpen(true)}
              filteredActiveContacts={filteredActiveContacts} filteredNewContacts={filteredNewContacts}
              handleSelectContact={handleSelectContact} startChatWithContact={startChatWithContact}
              unreadByContact={unreadByContact}
              onPushToast={(message, type) => setToast({ type, message })}
            />

            <div className={`flex-1 flex-col relative bg-brand-canvas overflow-hidden ${!activeContact ? 'hidden md:flex' : 'flex'}`}>
              {activeContact ? (
                <>
                  <ChatHeader 
                    activeContact={activeContact} handleSelectContact={handleSelectContact} openNewTicketModal={openNewTicketModal}
                    isSearchChatOpen={isSearchChatOpen} setIsSearchChatOpen={setIsSearchChatOpen} chatSearchTerm={chatSearchTerm} 
                    setChatSearchTerm={setChatSearchTerm} onOpenDeleteModal={() => setIsDeleteModalOpen(true)}
                  />

                  {previewFile && previewUrl && (
                    <FilePreview previewFile={previewFile} previewUrl={previewUrl} cancelPreview={cancelPreview} inputText={inputText} setInputText={setInputText} handleSendMessage={handleSendMessage} isSending={isSending} />
                  )}

                  <MessageList
                    filteredMessages={filteredMessages}
                    chatSearchTerm={chatSearchTerm}
                    setViewerMessage={setViewerMessage}
                    listScrollRef={messageListScrollRef}
                    messagesEndRef={messagesEndRef}
                    onMessageDelete={handleRequestDeleteMessage}
                    onMessageEditRequest={handleEditMessageRequest}
                  />

                  <ChatInput 
                    fileInputRef={fileInputRef} handleFileUpload={handleFileUpload} isRecording={isRecording} recordingTime={recordingTime} 
                    inputText={inputText} setInputText={setInputText} isSending={isSending} previewFile={previewFile} startRecording={startRecording} 
                    cancelRecording={cancelRecording} stopRecordingAndSend={stopRecordingAndSend} handleSendMessage={handleSendMessage}
                  />
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center z-10 bg-slate-50/50 p-6 text-center">
                   <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-4 shadow-sm text-brand-600"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg></div>
                   <h2 className="text-xl font-bold text-slate-800 mb-2">Central de Mensagens</h2>
                   <p className="text-sm text-slate-500 max-w-sm">Selecione um contacto na barra lateral ou inicie uma nova conversa para enviar mensagens, ficheiros e áudios.</p>
                </div>
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
      {isInstanceModalOpen && <InstanceModal onClose={() => setIsInstanceModalOpen(false)} instances={instances} selectedInstance={selectedInstance} setSelectedInstance={setSelectedInstance} handleSelectContact={handleSelectContact} />}
      {isDeleteModalOpen && <DeleteChatModal onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDeleteConversation} />}
      {isNewTicketModalOpen && (
        <CreateTicketModal
          onClose={() => setIsNewTicketModalOpen(false)}
          formNome={formNome}
          setFormNome={setFormNome}
          formEmail={formEmail}
          setFormEmail={setFormEmail}
          formCpf={formCpf}
          setFormCpf={setFormCpf}
          formMarca={formMarca}
          setFormMarca={setFormMarca}
          formModelo={formModelo}
          setFormModelo={setFormModelo}
          formCustomerType={formCustomerType}
          setFormCustomerType={setFormCustomerType}
          formTicketType={formTicketType}
          setFormTicketType={setFormTicketType}
          handleCreateTicket={handleCreateTicket}
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
      {viewerMessage && viewerMessage.mediaData && <MediaViewerModal viewerMessage={viewerMessage} onClose={() => setViewerMessage(null)} />}
    </div>
  );
}