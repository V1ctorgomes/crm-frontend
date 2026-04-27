'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar'; 
import Link from 'next/link';

interface Message {
  id: string | number;
  text: string;
  type: 'sent' | 'received';
  time: string;
  fromMe: boolean;
  senderNumber: string;
  isMedia?: boolean;
  mediaData?: string; 
  mimeType?: string;
  fileName?: string;
}

interface Contact {
  number: string;
  name: string;
  profilePictureUrl?: string;
  lastMessage: string;
  lastMessageTime: string;
  email?: string;
  cnpj?: string;
  instanceName?: string;
}

interface Stage {
  id: string;
  name: string;
}

export default function WhatsAppPage() {
  const [hasInstances, setHasInstances] = useState<boolean | null>(null);
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('ALL');
  const [isInstanceModalOpen, setIsInstanceModalOpen] = useState(false);

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Feedback System (Toast)
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({});

  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewerMessage, setViewerMessage] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSearchChatOpen, setIsSearchChatOpen] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState('');

  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [formCustomerType, setFormCustomerType] = useState(''); // NOVO ESTADO AQUI

  const [crmCustomers, setCrmCustomers] = useState<any[]>([]);
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
    if (contact) {
      localStorage.setItem('lastActiveContact', contact.number);
    } else {
      localStorage.removeItem('lastActiveContact');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, activeContact, chatSearchTerm]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const resUsers = await fetch(`${baseUrl}/users`);
        if (resUsers.ok) {
          const users = await resUsers.json();
          if (users.length > 0) {
            const userId = users[0].id;
            const resInstances = await fetch(`${baseUrl}/instances/user/${userId}`);
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
          const formattedContacts = data.map((c: any) => ({
            ...c,
            lastMessageTime: c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
          }));
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
          
          let incomingText = customMedia.text !== undefined 
            ? customMedia.text 
            : (msgData.message?.conversation || msgData.message?.extendedTextMessage?.text || "");

          let fallbackSidebarText = msgData.message?.imageMessage ? "Imagem" : msgData.message?.documentMessage ? "Documento" : msgData.message?.audioMessage ? "Áudio" : msgData.message?.videoMessage ? "Vídeo" : "Mídia";

          const newMessage: Message = {
            id: waId, text: incomingText, type: isFromMe ? 'sent' : 'received', time: timeNow, fromMe: isFromMe,
            senderNumber: contactNumber, isMedia: customMedia.isMedia || false, mediaData: customMedia.mediaData, mimeType: customMedia.mimeType, fileName: customMedia.fileName
          };

          setChatHistory(prev => {
            const history = prev[contactNumber] || [];
            if (history.some(m => m.id === waId)) return prev;

            if (isFromMe) {
               const dupOptimistic = history.find(m => m.fromMe && m.text === incomingText && typeof m.id === 'number');
               if (dupOptimistic) {
                  return { ...prev, [contactNumber]: history.map(m => m === dupOptimistic ? { ...m, id: waId } : m) };
               }
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
                  setContacts(data.map((c: any) => ({
                    ...c, lastMessageTime: c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
                  })));
               });
            }
            return updated;
          });
        }
      } catch (err) { console.error("Erro no processamento da mensagem:", err); }
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
      } else {
        showFeedback('error', "Erro no servidor ao tentar apagar a conversa.");
      }
    } catch (err) { 
      showFeedback('error', "Falha de conexão ao apagar conversa."); 
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeContact) return;
    if (file.size > 15 * 1024 * 1024) { 
      showFeedback('error', "Arquivo muito grande (máx 15MB)."); 
      return; 
    }
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
      } else {
        showFeedback('error', "Falha ao enviar arquivo.");
      }
    } catch (error) { 
      showFeedback('error', "Erro de conexão ao enviar arquivo."); 
    } finally { 
      setIsSending(false); 
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isRecording) return;
    if (isSending || !activeContact) return;
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
        await fetch(`${baseUrl}/whatsapp/send`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ number: targetNumber, text: textToSend, instanceName: targetInstance }) 
        });
      } catch (error) { showFeedback('error', "Erro de conexão ao enviar mensagem."); } finally { setIsSending(false); }
    }
  };

  const formatRecordingTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      isCancelledRef.current = false;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

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
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      showFeedback('error', "Acesso ao microfone negado ou indisponível.");
    }
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
    setFormNome(activeContact.name || ''); 
    setFormEmail(activeContact.email || ''); 
    setFormCpf(activeContact.cnpj || ''); 
    setFormMarca(''); 
    setFormModelo('');
    setFormCustomerType(''); // RESETA O TIPO DE CLIENTE AQUI
    setIsNewTicketModalOpen(true);
  };

  const handleCreateTicket = async () => {
    if (!activeContact || stages.length === 0) return showFeedback('error', "Nenhuma fase de Kanban configurada no sistema.");
    
    // PAYLOAD ATUALIZADO COM O CUSTOMER TYPE
    const body = { 
      contactNumber: activeContact.number, 
      nome: formNome, 
      email: formEmail, 
      cpf: formCpf, 
      marca: formMarca, 
      modelo: formModelo, 
      customerType: formCustomerType, // ADICIONADO AQUI
      stageId: stages[0].id 
    };

    try {
      const res = await fetch(`${baseUrl}/tickets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        setIsNewTicketModalOpen(false);
        showFeedback('success', "Solicitação criada no Kanban!");
      }
    } catch (err) { showFeedback('error', "Erro ao criar a solicitação."); }
  };

  const startChatWithContact = (contact: any) => {
    const existing = contacts.find(c => c.number === contact.number);
    const targetInstance = selectedInstance !== 'ALL' ? selectedInstance : undefined;

    if (existing) {
      setContacts(prev => prev.map(c => c.number === contact.number ? { ...c, lastMessage: 'Nova Conversa', lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : c));
      setActiveContact({ ...existing, lastMessage: 'Nova Conversa' });
    } else {
      const newContact: Contact = {
        number: contact.number,
        name: contact.name,
        lastMessage: 'Nova Conversa',
        lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        email: contact.email,
        cnpj: contact.cnpj,
        instanceName: targetInstance
      };
      setContacts(prev => [newContact, ...prev]);
      setActiveContact(newContact);
    }
    
    setCustomerSearch(''); 
  };

  const activeMessages = activeContact ? (chatHistory[activeContact.number] || []) : [];
  const filteredMessages = chatSearchTerm
    ? activeMessages.filter(msg => (msg.text || '').toLowerCase().includes(chatSearchTerm.toLowerCase()) || (msg.fileName || '').toLowerCase().includes(chatSearchTerm.toLowerCase()))
    : activeMessages;

  const activeContactsList = contacts.filter(c => 
    c.lastMessage && c.lastMessage.trim() !== '' &&
    (selectedInstance === 'ALL' || c.instanceName === selectedInstance)
  );
  
  const filteredActiveContacts = activeContactsList.filter(c => 
    (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) || 
    (c.number || '').includes(customerSearch)
  );

  const inactiveContactsList = contacts.filter(c => 
    (!c.lastMessage || c.lastMessage.trim() === '') &&
    (selectedInstance === 'ALL' || !c.instanceName || c.instanceName === selectedInstance)
  );
  
  const availableToChat = [...inactiveContactsList];

  crmCustomers.forEach(cust => {
    let cleanPhone = cust.phone ? cust.phone.replace(/\D/g, '') : '';
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      cleanPhone = `55${cleanPhone}`;
    }
    if (cleanPhone && !availableToChat.some(c => c.number === cleanPhone) && !activeContactsList.some(c => c.number === cleanPhone)) {
      availableToChat.push({
        number: cleanPhone,
        name: cust.name,
        lastMessage: '',
        lastMessageTime: '',
        email: cust.email,
        cnpj: cust.company,
        instanceName: undefined
      });
    }
  });

  const filteredNewContacts = availableToChat.filter(c => {
    const matchesSearch = (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) || 
                          (c.number || '').includes(customerSearch);
    return matchesSearch;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] font-sans">
      <Sidebar />
      <main className="flex-1 flex pt-[60px] md:pt-0 h-full relative overflow-hidden">
        
        {/* TOAST NOTIFICATION */}
        {toast && (
          <div className="fixed top-4 right-4 md:top-8 md:right-8 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300">
            <div className="px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border bg-white border-slate-200">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {toast.type === 'success' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                )}
              </div>
              <span className="font-medium text-sm text-slate-800">{toast.message}</span>
            </div>
          </div>
        )}

        {hasInstances === null ? (
          <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : hasInstances === false ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc] p-6 text-center animate-in fade-in">
             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 border border-slate-200">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-400">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
               </svg>
             </div>
             <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Nenhuma Instância Conectada</h2>
             <p className="text-slate-500 mb-6 max-w-md text-sm">Para começar a enviar e receber mensagens com os seus clientes, você precisa primeiro criar e conectar uma instância do WhatsApp.</p>
             <Link href="/configuracoes" className="bg-slate-900 text-white px-6 py-2.5 rounded-md font-medium hover:bg-slate-800 transition-all flex items-center gap-2">
               Ir para Configurações
             </Link>
          </div>
        ) : (
          <>
            {/* BARRA LATERAL DE CONTATOS */}
            <div className={`w-full md:w-[320px] flex-col border-r border-slate-200 bg-white shrink-0 z-20 ${activeContact ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-slate-100 shrink-0 flex flex-col gap-3">
                <div className="flex items-center gap-2 w-full">
                  <div className="bg-white border border-slate-200 rounded-md flex items-center px-3 h-10 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all flex-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                    <input 
                      type="text" 
                      placeholder="Procurar conversa..." 
                      className="bg-transparent border-none outline-none w-full pl-2 text-sm font-medium text-slate-900 placeholder:text-slate-400" 
                      value={customerSearch} 
                      onChange={e => setCustomerSearch(e.target.value)} 
                    />
                  </div>
                  
                  {/* BOTÃO CAIXA DE ENTRADA (INSTÂNCIAS) */}
                  {instances.length > 0 && (
                    <button 
                      onClick={() => setIsInstanceModalOpen(true)}
                      className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all shrink-0 relative"
                      title="Caixas de Entrada"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" /></svg>
                      {selectedInstance !== 'ALL' && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white"></span>}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
                {/* CONVERSAS ATIVAS */}
                {filteredActiveContacts.map((contact) => (
                  <div key={contact.number} className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-slate-50 ${activeContact?.number === contact.number ? 'bg-blue-50/50 border-l-2 border-l-blue-600' : 'hover:bg-slate-50 border-l-2 border-l-transparent'}`} onClick={() => handleSelectContact(contact)}>
                    {contact.profilePictureUrl ? (
                      <img src={contact.profilePictureUrl} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200" alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0 border border-slate-200 text-xs">
                        {(contact.name || '?').substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-semibold text-slate-900 text-sm truncate">{contact.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">{contact.lastMessageTime}</span>
                      </div>
                      <div className="text-xs text-slate-500 truncate">{contact.lastMessage || 'Nova Conversa'}</div>
                    </div>
                  </div>
                ))}

                {/* RESULTADOS DE CLIENTES NOVOS DO CRM */}
                {customerSearch && filteredNewContacts.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-slate-50 border-y border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                      Base de Dados
                    </div>
                    {filteredNewContacts.map((customer) => (
                      <div key={customer.number} className="flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-slate-50 border-l-2 border-l-transparent hover:bg-slate-50" onClick={() => startChatWithContact(customer)}>
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-100 text-xs">
                          {(customer.name || '?').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col flex-1 overflow-hidden">
                          <span className="font-semibold text-slate-900 text-sm truncate">{customer.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{customer.number || 'Sem número'}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {customerSearch && filteredActiveContacts.length === 0 && filteredNewContacts.length === 0 && (
                  <div className="p-6 text-center text-sm font-medium text-slate-400">Nenhum contato encontrado.</div>
                )}
              </div>
            </div>

            {/* ÁREA PRINCIPAL DO CHAT */}
            <div className={`flex-1 flex-col relative bg-[#f8fafc] overflow-hidden ${!activeContact ? 'hidden md:flex' : 'flex'}`}>
              
              {activeContact ? (
                <>
                  {/* CABEÇALHO DO CHAT */}
                  <div className="h-[68px] bg-white border-b border-slate-200 flex items-center px-4 md:px-6 shrink-0 z-20">
                    <button onClick={() => handleSelectContact(null)} className="md:hidden text-slate-400 mr-3 hover:text-slate-700 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                    </button>
                    
                    {activeContact.profilePictureUrl ? (
                      <img src={activeContact.profilePictureUrl} referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200" alt="" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0 border border-slate-200 text-xs">
                        {activeContact.name.substring(0,2).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="ml-3 overflow-hidden flex-1">
                      <h2 className="text-sm font-bold text-slate-900 leading-tight truncate">{activeContact.name}</h2>
                      <span className="text-[11px] text-slate-500 font-mono leading-tight truncate block mt-0.5">
                        {activeContact.number}
                        {activeContact.instanceName && <span className="ml-2 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest">{activeContact.instanceName}</span>}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                      <button
                        onClick={openNewTicketModal}
                        className="h-9 px-3 rounded-md flex items-center justify-center bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors text-xs gap-1.5 whitespace-nowrap hidden sm:flex"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        Criar OS
                      </button>
                      <button onClick={openNewTicketModal} className="w-9 h-9 rounded-md flex items-center justify-center bg-slate-900 text-white hover:bg-slate-800 transition-colors sm:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      </button>

                      <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block"></div>

                      <button onClick={() => { setIsSearchChatOpen(!isSearchChatOpen); setChatSearchTerm(''); }} className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors ${isSearchChatOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`} title="Pesquisar">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                      </button>
                      
                      <button onClick={() => setIsDeleteModalOpen(true)} className="w-9 h-9 rounded-md flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Excluir Conversa">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  </div>

                  {isSearchChatOpen && (
                    <div className="bg-white px-4 py-2 border-b border-slate-200 flex items-center gap-2 shrink-0 z-10">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                      <input type="text" placeholder="Procurar na conversa..." className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400" value={chatSearchTerm} onChange={e => setChatSearchTerm(e.target.value)} autoFocus />
                      <button onClick={() => { setIsSearchChatOpen(false); setChatSearchTerm(''); }} className="text-slate-500 hover:text-slate-800 text-xs font-medium px-2 py-1 rounded transition-colors">Fechar</button>
                    </div>
                  )}

                  {/* PRÉ-VISUALIZAÇÃO DE ARQUIVO */}
                  {previewFile && previewUrl && (
                    <div className="absolute inset-0 top-[68px] bg-slate-50/95 backdrop-blur-sm z-30 flex flex-col items-center justify-between">
                      <div className="w-full flex justify-between p-4">
                        <button onClick={cancelPreview} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 shadow-sm transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center w-full px-6">
                          <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-slate-200 p-8 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                              {previewFile.type.startsWith('image/') ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>}
                            </div>
                            <h3 className="font-semibold text-slate-800 text-base break-all line-clamp-2">{previewFile.name}</h3>
                            <span className="text-xs text-slate-500 mt-1">{(previewFile.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                      </div>
                      <div className="w-full bg-white p-4 border-t border-slate-200 shrink-0">
                         <div className="w-full max-w-2xl mx-auto flex gap-2 items-center">
                            <input 
                              type="text" 
                              placeholder="Adicione uma legenda..." 
                              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                              value={inputText} 
                              onChange={(e) => setInputText(e.target.value)} 
                              onKeyDown={(e) => { if(e.key === 'Enter') handleSendMessage() }} 
                              autoFocus 
                            />
                            <button onClick={handleSendMessage} disabled={isSending} className="h-10 px-4 rounded-md bg-slate-900 text-white font-medium text-sm flex items-center justify-center hover:bg-slate-800 transition-all shrink-0 disabled:opacity-50">
                              {isSending ? 'A enviar...' : 'Enviar'}
                            </button>
                         </div>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-2 z-10 no-scrollbar bg-slate-50/50">
                    {filteredMessages.length === 0 && chatSearchTerm && <div className="text-center text-slate-500 text-sm mt-4">Nenhuma mensagem encontrada.</div>}
                    
                    {filteredMessages.map((msg) => (
                      <div key={msg.id} className={`max-w-[85%] md:max-w-[70%] w-fit relative px-3 py-2 rounded-xl flex flex-col break-words shadow-sm ${msg.fromMe ? 'self-end bg-blue-600 text-white rounded-tr-sm' : 'self-start bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}>
                        
                        {msg.isMedia && msg.mediaData && (
                          msg.mimeType?.startsWith('audio/') ? (
                            <div className="mt-1 mb-1"><audio controls src={msg.mediaData} className="w-[220px] md:w-[260px] h-[40px] outline-none" /></div>
                          ) : (
                            <div className={`flex items-center gap-3 p-2 rounded-lg mb-1.5 mt-0.5 border ${msg.fromMe ? 'bg-blue-500 border-blue-400 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                                <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${msg.fromMe ? 'bg-blue-400/50' : 'bg-white border border-slate-200'}`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                                </div>
                                <div className="flex flex-col overflow-hidden w-full min-w-[120px] max-w-[200px]">
                                  <span className="text-sm font-semibold truncate">{msg.fileName || 'Ficheiro'}</span>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className={`text-[10px] font-mono uppercase ${msg.fromMe ? 'text-blue-100' : 'text-slate-500'}`}>{msg.mimeType?.split('/')[1] || 'DOC'}</span>
                                    <button onClick={() => setViewerMessage(msg)} className={`text-[10px] font-medium px-2 py-0.5 rounded cursor-pointer ${msg.fromMe ? 'bg-blue-500 hover:bg-blue-400' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}>Abrir</button>
                                  </div>
                                </div>
                            </div>
                          )
                        )}

                        {msg.text && msg.text.trim() !== '' && (
                          <span className="text-[14px] leading-relaxed">
                            {chatSearchTerm ? msg.text.split(new RegExp(`(${chatSearchTerm})`, 'gi')).map((part, i) => part.toLowerCase() === chatSearchTerm.toLowerCase() ? <mark key={i} className="bg-yellow-300 text-black px-0.5 rounded">{part}</mark> : part) : msg.text}
                          </span>
                        )}

                        <div className={`text-[10px] self-end mt-1 flex items-center gap-1 float-right ml-4 ${msg.fromMe ? 'text-blue-200' : 'text-slate-400'}`}>
                          {msg.time}
                          {msg.fromMe && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10.414 4.086a.75.75 0 0 1 1.06 0l4 4a.75.75 0 1 1-1.06 1.06l-3.47-3.47-3.47 3.47a.75.75 0 0 1-1.06-1.06l4-4Zm-4.95 4.95a.75.75 0 0 1 1.06 0l4 4a.75.75 0 1 1-1.06 1.06l-3.47-3.47-3.47 3.47a.75.75 0 0 1-1.06-1.06l4-4Z" clipRule="evenodd" /></svg>}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* BARRA DE DIGITAÇÃO */}
                  <div className="bg-white p-3 md:px-4 flex items-center gap-2 shrink-0 z-10 border-t border-slate-200">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf,video/*,audio/*" />
                    
                    {!isRecording && (
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" /></svg>
                      </button>
                    )}

                    <div className="flex-1 relative flex items-center h-10">
                      {isRecording ? (
                        <div className="w-full h-full flex items-center justify-between bg-red-50 rounded-md px-4 border border-red-100 animate-in fade-in">
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-red-600 font-medium text-sm tabular-nums">{formatRecordingTime(recordingTime)}</span>
                          </div>
                          <button type="button" onClick={cancelRecording} className="text-red-600 hover:text-red-800 text-xs font-medium">Cancelar</button>
                        </div>
                      ) : (
                        <input 
                          type="text" 
                          placeholder="Escreva a sua mensagem..." 
                          className="w-full h-full bg-white border border-slate-300 rounded-md px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-slate-400" 
                          value={inputText} 
                          onChange={(e) => setInputText(e.target.value)} 
                          onKeyDown={(e) => { if(e.key === 'Enter') handleSendMessage() }}
                          disabled={isSending} 
                        />
                      )}
                    </div>

                    {!inputText.trim() && !previewFile && !isRecording ? (
                      <button type="button" onClick={startRecording} className="w-10 h-10 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg>
                      </button>
                    ) : isRecording ? (
                      <button type="button" onClick={stopRecordingAndSend} disabled={isSending} className="w-10 h-10 rounded-md bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shrink-0">
                         {isSending ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>}
                      </button>
                    ) : (
                      <button type="button" onClick={() => handleSendMessage()} disabled={isSending || !inputText.trim()} className="w-10 h-10 rounded-md bg-slate-900 text-white flex items-center justify-center disabled:opacity-50 hover:bg-slate-800 transition-colors shrink-0">
                        {isSending ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center z-10 bg-slate-50/50 p-6 text-center">
                   <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-4 shadow-sm text-blue-600">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
                   </div>
                   <h2 className="text-xl font-bold text-slate-800 mb-2">Central de Mensagens</h2>
                   <p className="text-sm text-slate-500 max-w-sm">Selecione um contacto na barra lateral ou inicie uma nova conversa para enviar mensagens, ficheiros e áudios.</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* MODAL DE CAIXAS DE ENTRADA */}
      {isInstanceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsInstanceModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <div className="flex flex-col">
                 <h3 className="font-semibold text-lg text-slate-800">Caixas de Entrada</h3>
                 <p className="text-xs text-slate-500">Filtrar conversas por instância</p>
              </div>
              <button onClick={() => setIsInstanceModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
              <button 
                onClick={() => { setSelectedInstance('ALL'); handleSelectContact(null); setIsInstanceModalOpen(false); }}
                className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-all text-left ${selectedInstance === 'ALL' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-slate-200 hover:border-slate-300'}`}
              >
                 <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${selectedInstance === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" /></svg>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-sm font-medium">Todas as Caixas</span>
                 </div>
              </button>

              {instances.map(inst => (
                <button 
                  key={inst.id}
                  onClick={() => { setSelectedInstance(inst.name); handleSelectContact(null); setIsInstanceModalOpen(false); }}
                  className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-all text-left ${selectedInstance === inst.name ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                >
                   <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${selectedInstance === inst.name ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {inst.name.substring(0, 2).toUpperCase()}
                   </div>
                   <div className="flex flex-col">
                     <span className="text-sm font-medium">{inst.name}</span>
                   </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO DE CONVERSA */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Excluir Conversa?</h3>
              <p className="text-sm text-slate-500">Tem a certeza que deseja apagar todas as mensagens desta conversa? Esta ação é irreversível.</p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 h-10 rounded-md font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 bg-white transition-colors text-sm">Cancelar</button>
              <button onClick={confirmDeleteConversation} className="bg-red-600 text-white px-4 h-10 rounded-md font-medium text-sm hover:bg-red-700 transition-colors">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRIAR OS */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsNewTicketModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-slate-900">Nova Solicitação (OS)</h3>
              <button onClick={() => setIsNewTicketModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nome do Cliente</label>
                <input type="text" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={formNome} onChange={e => setFormNome(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">E-mail</label>
                <input type="email" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">CPF / CNPJ</label>
                <input type="text" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={formCpf} onChange={e => setFormCpf(e.target.value)} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-slate-700">Marca</label>
                  <input type="text" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={formMarca} onChange={e => setFormMarca(e.target.value)} />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-slate-700">Modelo</label>
                  <input type="text" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={formModelo} onChange={e => setFormModelo(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tipo de Cliente (Opcional)</label>
                <input type="text" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={formCustomerType} onChange={e => setFormCustomerType(e.target.value)} placeholder="Ex: Revenda" />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button onClick={() => setIsNewTicketModalOpen(false)} className="px-4 h-10 rounded-md font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 bg-white transition-colors text-sm">Cancelar</button>
              <button onClick={handleCreateTicket} className="bg-slate-900 text-white px-4 h-10 rounded-md font-medium hover:bg-slate-800 transition-colors text-sm">Criar OS</button>
            </div>
          </div>
        </div>
      )}

      {viewerMessage && viewerMessage.mediaData && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 md:p-8 animate-in fade-in" onClick={() => setViewerMessage(null)}>
          <div className="bg-white rounded-xl shadow-lg flex flex-col w-full max-w-4xl h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <span className="font-semibold text-slate-800 text-sm truncate">{viewerMessage.fileName || 'Visualizador de Arquivo'}</span>
              <button onClick={() => setViewerMessage(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 bg-slate-50 flex items-center justify-center overflow-hidden p-4">
              {viewerMessage.mimeType?.startsWith('image/') ? <img src={viewerMessage.mediaData} alt="" className="max-w-full max-h-full object-contain rounded" /> : viewerMessage.mimeType?.startsWith('video/') ? <video src={viewerMessage.mediaData} controls autoPlay className="max-w-full max-h-full outline-none rounded" /> : viewerMessage.mimeType?.includes('pdf') ? <iframe src={`${viewerMessage.mediaData}#toolbar=0`} className="w-full h-full border border-slate-200 rounded bg-white" /> : <div className="text-slate-500 text-sm flex flex-col items-center">Pré-visualização não disponível para este formato.</div>}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end bg-white">
              <a href={viewerMessage.mediaData} download={viewerMessage.fileName || 'download'} target="_blank" rel="noopener noreferrer" className="bg-slate-900 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                Descarregar Arquivo
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}