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
import { InstanceModal, DeleteChatModal, CreateTicketModal, MediaViewerModal } from '@/components/whatsapp/WhatsAppModals';

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

  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewerMessage, setViewerMessage] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States: Pesquisas e Modais
  const [isSearchChatOpen, setIsSearchChatOpen] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [crmCustomers, setCrmCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isInstanceModalOpen, setIsInstanceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);

  // States: Formulário de OS
  const [stages, setStages] = useState<Stage[]>([]);
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [formCustomerType, setFormCustomerType] = useState(''); 
  const [formTicketType, setFormTicketType] = useState('');

  // States: Gravação de Áudio
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSelectContact = (contact: Contact | null) => {
    setActiveContact(contact);
    setIsSearchChatOpen(false);
    setChatSearchTerm('');
    setCustomerSearch(''); 
    if (contact) localStorage.setItem('lastActiveContact', contact.number);
    else localStorage.removeItem('lastActiveContact');
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "auto" }); }, [chatHistory, activeContact, chatSearchTerm]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const resUsers = await fetch(`${baseUrl}/users`);
        if (resUsers.ok) {
          const users = await resUsers.json();
          if (users.length > 0) {
            const resInstances = await fetch(`${baseUrl}/instances/user/${users[0].id}`);
            if (resInstances.ok) {
              const fetchedInstances = await resInstances.json();
              const connected = fetchedInstances.filter((i: any) => i.status === 'connected');
              setInstances(connected);
              setHasInstances(connected.length > 0); 
            } else setHasInstances(false);
          } else setHasInstances(false);
        }

        const resContacts = await fetch(`${baseUrl}/whatsapp/contacts`);
        if (resContacts.ok) {
          const data = await resContacts.json();
          const formattedContacts = data.map((c: any) => ({ ...c, lastMessageTime: c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '' }));
          setContacts(formattedContacts);

          const savedNumber = localStorage.getItem('lastActiveContact');
          if (savedNumber) {
            const foundContact = formattedContacts.find((c: Contact) => c.number === savedNumber);
            if (foundContact) setActiveContact(foundContact);
          }
        }

        const resStages = await fetch(`${baseUrl}/tickets/stages`);
        if (resStages.ok) setStages(await resStages.json());

        const resCustomers = await fetch(`${baseUrl}/customers`);
        if (resCustomers.ok) setCrmCustomers(await resCustomers.json());

      } catch (err) { setHasInstances(false); }
    };
    fetchInitialData();
  }, [baseUrl]);

  useEffect(() => {
    if (activeContact && !chatHistory[activeContact.number]) {
      const fetchHistory = async () => {
        try {
          const res = await fetch(`${baseUrl}/whatsapp/history/${encodeURIComponent(activeContact.number)}`);
          if (res.ok) {
            const data = await res.json();
            const formattedMessages = data.map((m: any) => ({
              id: m.id, text: m.text, type: m.type, time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              fromMe: m.type === 'sent', senderNumber: m.contactNumber, isMedia: m.isMedia, mediaData: m.mediaData, mimeType: m.mimeType, fileName: m.fileName
            }));
            setChatHistory(prev => ({ ...prev, [activeContact.number]: formattedMessages }));
          }
        } catch (err) {}
      };
      fetchHistory();
    }
  }, [activeContact, baseUrl, chatHistory]);

  useEffect(() => {
    if (hasInstances === false) return; 
    const eventSource = new EventSource(`${baseUrl}/whatsapp/stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if ((payload?.event === 'messages.upsert' || payload?.event === 'send.message') && payload?.data) {
          const msgData = payload.data;
          const remoteJid = msgData.key?.remoteJid;
          if (!remoteJid || remoteJid.includes('@g.us') || remoteJid === 'status@broadcast') return;
          
          const contactNumber = remoteJid.split('@')[0];
          const isFromMe = msgData.key?.fromMe || false;
          const waId = msgData.key?.id || Date.now().toString(); 
          const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          const customMedia = msgData.customMedia || {};
          let incomingText = customMedia.text !== undefined ? customMedia.text : (msgData.message?.conversation || msgData.message?.extendedTextMessage?.text || "");
          let fallbackSidebarText = msgData.message?.imageMessage ? "Imagem" : msgData.message?.documentMessage ? "Documento" : msgData.message?.audioMessage ? "Áudio" : msgData.message?.videoMessage ? "Vídeo" : "Mídia";

          const newMessage: Message = { id: waId, text: incomingText, type: isFromMe ? 'sent' : 'received', time: timeNow, fromMe: isFromMe, senderNumber: contactNumber, isMedia: customMedia.isMedia || false, mediaData: customMedia.mediaData, mimeType: customMedia.mimeType, fileName: customMedia.fileName };

          setChatHistory(prev => {
            const history = prev[contactNumber] || [];
            if (history.some(m => m.id === waId)) return prev;
            if (isFromMe) {
               const dupOptimistic = history.find(m => m.fromMe && m.text === incomingText && typeof m.id === 'number');
               if (dupOptimistic) return { ...prev, [contactNumber]: history.map(m => m === dupOptimistic ? { ...m, id: waId } : m) };
            }
            return { ...prev, [contactNumber]: [...history, newMessage] };
          });

          setContacts(prev => {
            const idx = prev.findIndex(c => c.number === contactNumber);
            const updated = [...prev];
            if (idx !== -1) {
              updated[idx].lastMessage = incomingText || fallbackSidebarText;
              updated[idx].lastMessageTime = timeNow;
              updated[idx].instanceName = payload.instance;
              if (msgData.profilePictureUrl) updated[idx].profilePictureUrl = msgData.profilePictureUrl;
              const item = updated.splice(idx, 1)[0];
              updated.unshift(item);
            } else {
               fetch(`${baseUrl}/whatsapp/contacts`).then(res => res.json()).then(data => {
                  setContacts(data.map((c: any) => ({ ...c, lastMessageTime: c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '' })));
               });
            }
            return updated;
          });
        }
      } catch (err) { }
    };
    eventSource.onerror = () => { eventSource.close(); };
    return () => eventSource.close();
  }, [baseUrl, hasInstances]);

  const confirmDeleteConversation = async () => {
    if (!activeContact) return;
    setIsDeleteModalOpen(false); 
    try {
      const res = await fetch(`${baseUrl}/whatsapp/history/${encodeURIComponent(activeContact.number)}`, { method: 'DELETE' });
      if (res.ok) {
        setChatHistory(prev => ({ ...prev, [activeContact.number]: [] }));
        setContacts(prev => prev.map(c => c.number === activeContact.number ? { ...c, lastMessage: '', lastMessageTime: '' } : c));
        setActiveContact(null);
        localStorage.removeItem('lastActiveContact');
        showFeedback('success', "Conversa excluída com sucesso.");
      } else showFeedback('error', "Erro no servidor ao tentar apagar a conversa.");
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
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setIsSending(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('number', targetNumber);
    formData.append('caption', caption);
    if (targetInstance) formData.append('instanceName', targetInstance);

    const tempId = Date.now();
    const tempUrl = URL.createObjectURL(file);
    const optimisticMsg: Message = { id: tempId, text: caption || "", type: 'sent', time: timeNow, fromMe: true, senderNumber: targetNumber, isMedia: true, mediaData: tempUrl, mimeType: file.type, fileName: file.name };

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
      const res = await fetch(`${baseUrl}/whatsapp/send-media`, { method: 'POST', body: formData });
      if (res.ok) {
         const savedData = await res.json();
         setChatHistory(prev => ({ ...prev, [targetNumber]: prev[targetNumber].map(msg => msg.id === tempId ? { ...msg, id: savedData.id, mediaData: savedData.mediaData } : msg) }));
      } else showFeedback('error', "Falha ao enviar arquivo.");
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
      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setIsSending(true);
      const optimisticMsg: Message = { id: Date.now(), text: textToSend, type: 'sent', time: timeNow, fromMe: true, senderNumber: targetNumber };
      
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
        await fetch(`${baseUrl}/whatsapp/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ number: targetNumber, text: textToSend, instanceName: targetInstance }) });
      } catch (error) { showFeedback('error', "Erro de conexão."); } finally { setIsSending(false); }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      isCancelledRef.current = false;

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        if (isCancelledRef.current) return;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
        await sendDirectMedia(audioFile, '');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) { showFeedback('error', "Acesso ao microfone negado."); }
  };

  const stopRecordingAndSend = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      isCancelledRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const openNewTicketModal = () => {
    if (!activeContact) return;
    setFormNome(activeContact.name || ''); setFormEmail(activeContact.email || ''); setFormCpf(activeContact.cnpj || ''); 
    setFormMarca(''); setFormModelo(''); setFormCustomerType(''); setFormTicketType(''); 
    setIsNewTicketModalOpen(true);
  };

  const handleCreateTicket = async () => {
    if (!activeContact || stages.length === 0) return showFeedback('error', "Nenhuma fase de Kanban configurada.");
    const body = { contactNumber: activeContact.number, nome: formNome, email: formEmail, cpf: formCpf, marca: formMarca, modelo: formModelo, customerType: formCustomerType, ticketType: formTicketType, stageId: stages[0].id };
    try {
      const res = await fetch(`${baseUrl}/tickets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { setIsNewTicketModalOpen(false); showFeedback('success', "OS criada no Kanban!"); }
    } catch (err) { showFeedback('error', "Erro ao criar a solicitação."); }
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
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] font-sans">
      <Sidebar />
      <main className="flex-1 flex pt-[60px] md:pt-0 h-full relative overflow-hidden">
        
        {toast && <Toast type={toast.type} message={toast.message} />}

        {hasInstances === null ? (
          <div className="flex-1 flex items-center justify-center bg-[#f8fafc]"><div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div></div>
        ) : hasInstances === false ? (
          <NoInstancesView />
        ) : (
          <>
            <ContactsSidebar 
              activeContact={activeContact} customerSearch={customerSearch} setCustomerSearch={setCustomerSearch}
              instances={instances} selectedInstance={selectedInstance} onOpenInstanceModal={() => setIsInstanceModalOpen(true)}
              filteredActiveContacts={filteredActiveContacts} filteredNewContacts={filteredNewContacts}
              handleSelectContact={handleSelectContact} startChatWithContact={startChatWithContact}
            />

            <div className={`flex-1 flex-col relative bg-[#f8fafc] overflow-hidden ${!activeContact ? 'hidden md:flex' : 'flex'}`}>
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

                  <MessageList filteredMessages={filteredMessages} chatSearchTerm={chatSearchTerm} setViewerMessage={setViewerMessage} messagesEndRef={messagesEndRef} />

                  <ChatInput 
                    fileInputRef={fileInputRef} handleFileUpload={handleFileUpload} isRecording={isRecording} recordingTime={recordingTime} 
                    inputText={inputText} setInputText={setInputText} isSending={isSending} previewFile={previewFile} startRecording={startRecording} 
                    cancelRecording={cancelRecording} stopRecordingAndSend={stopRecordingAndSend} handleSendMessage={handleSendMessage}
                  />
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center z-10 bg-slate-50/50 p-6 text-center">
                   <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-4 shadow-sm text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg></div>
                   <h2 className="text-xl font-bold text-slate-800 mb-2">Central de Mensagens</h2>
                   <p className="text-sm text-slate-500 max-w-sm">Selecione um contacto na barra lateral ou inicie uma nova conversa para enviar mensagens, ficheiros e áudios.</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {isInstanceModalOpen && <InstanceModal onClose={() => setIsInstanceModalOpen(false)} instances={instances} selectedInstance={selectedInstance} setSelectedInstance={setSelectedInstance} handleSelectContact={handleSelectContact} />}
      {isDeleteModalOpen && <DeleteChatModal onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDeleteConversation} />}
      {isNewTicketModalOpen && <CreateTicketModal onClose={() => setIsNewTicketModalOpen(false)} formNome={formNome} setFormNome={setFormNome} formEmail={formEmail} setFormEmail={setFormEmail} formCpf={formCpf} setFormCpf={setFormCpf} formMarca={formMarca} setFormMarca={setFormMarca} formModelo={formModelo} setFormModelo={setFormModelo} formCustomerType={formCustomerType} setFormCustomerType={setFormCustomerType} formTicketType={formTicketType} setFormTicketType={setFormTicketType} handleCreateTicket={handleCreateTicket} />}
      {viewerMessage && viewerMessage.mediaData && <MediaViewerModal viewerMessage={viewerMessage} onClose={() => setViewerMessage(null)} />}
    </div>
  );
}