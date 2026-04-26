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
          
          // Removemos todos os emojis automáticos
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
    setIsNewTicketModalOpen(true);
  };

  const handleCreateTicket = async () => {
    if (!activeContact || stages.length === 0) return showFeedback('error', "Nenhuma fase de Kanban configurada no sistema.");
    const body = { contactNumber: activeContact.number, nome: formNome, email: formEmail, cpf: formCpf, marca: formMarca, modelo: formModelo, stageId: stages[0].id };
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
    <div className="flex h-screen overflow-hidden bg-[#f4f7f6] font-sans">
      <Sidebar />
      <main className="flex-1 flex pt-[60px] md:pt-0 h-full relative overflow-hidden">
        
        {/* TOAST NOTIFICATION - CANTO SUPERIOR DIREITO */}
        {toast && (
          <div className={`fixed top-10 right-10 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300`}>
            <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-white border-green-100 text-green-700' : 'bg-white border-red-100 text-red-700'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                {toast.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                )}
              </div>
              <span className="font-bold text-sm">{toast.message}</span>
            </div>
          </div>
        )}

        {hasInstances === null ? (
          <div className="flex-1 flex items-center justify-center bg-[#f4f7f6]">
            <div className="w-12 h-12 border-4 border-[#1FA84A] border-t-transparent rounded-full animate-spin shadow-sm"></div>
          </div>
        ) : hasInstances === false ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#f4f7f6] p-6 text-center animate-in fade-in">
             <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-md border border-slate-100">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[#1FA84A]">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
               </svg>
             </div>
             <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Nenhuma Instância Conectada</h2>
             <p className="text-slate-500 mb-8 max-w-md text-sm font-medium leading-relaxed">Para começar a enviar e receber mensagens com os seus clientes, você precisa primeiro criar e conectar uma instância do WhatsApp.</p>
             <Link href="/configuracoes" className="bg-[#1FA84A] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-green-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
               Ir para Configurações
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
             </Link>
          </div>
        ) : (
          <>
            {/* BARRA LATERAL DE CONTATOS */}
            <div className={`w-full md:w-[340px] flex-col border-r border-slate-200 bg-white shrink-0 z-20 ${activeContact ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 pb-3 bg-white border-b border-slate-100 shrink-0 flex flex-col gap-3">
                
                {/* SELETOR DE INSTÂNCIAS */}
                {instances.length > 0 && (
                  <select 
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 h-11 text-[13px] font-bold text-slate-700 outline-none focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all cursor-pointer appearance-none"
                    value={selectedInstance}
                    onChange={(e) => { setSelectedInstance(e.target.value); handleSelectContact(null); }}
                    style={{ backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                  >
                    <option value="ALL">Todas as Caixas de Entrada</option>
                    {instances.map(inst => (
                      <option key={inst.id} value={inst.name}>{inst.name} (Instância)</option>
                    ))}
                  </select>
                )}

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl flex items-center px-4 h-11 shadow-sm focus-within:bg-white focus-within:border-[#1FA84A] focus-within:ring-4 focus-within:ring-[#1FA84A]/10 transition-all w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-400 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                  <input 
                    type="text" 
                    placeholder="Procurar ou iniciar conversa..." 
                    className="bg-transparent border-none outline-none w-full pl-3 text-[14px] font-medium text-slate-700 placeholder:text-slate-400" 
                    value={customerSearch} 
                    onChange={e => setCustomerSearch(e.target.value)} 
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
                {/* CONVERSAS ATIVAS */}
                {filteredActiveContacts.map((contact) => (
                  <div key={contact.number} className={`flex items-center gap-3 p-3.5 cursor-pointer transition-all border-b border-slate-50/50 ${activeContact?.number === contact.number ? 'bg-green-50/50 border-l-4 border-l-[#1FA84A]' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`} onClick={() => handleSelectContact(contact)}>
                    {contact.profilePictureUrl ? (
                      <img src={contact.profilePictureUrl} referrerPolicy="no-referrer" className="w-12 h-12 rounded-full object-cover shrink-0 shadow-sm border border-slate-100" alt="avatar" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold text-slate-500 shrink-0 shadow-sm border border-slate-200">
                        {(contact.name || '?').substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-extrabold text-slate-800 text-[15px] truncate">{contact.name}</span>
                        <span className="text-[11px] font-bold text-slate-400 shrink-0">{contact.lastMessageTime}</span>
                      </div>
                      <div className="text-[13px] font-medium text-slate-500 truncate">{contact.lastMessage || 'Nova Conversa'}</div>
                    </div>
                  </div>
                ))}

                {/* RESULTADOS DE CLIENTES NOVOS DO CRM */}
                {customerSearch && filteredNewContacts.length > 0 && (
                  <>
                    <div className="px-5 py-2.5 bg-slate-50 border-y border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                      Resultados da Base de Dados
                    </div>
                    {filteredNewContacts.map((customer) => (
                      <div key={customer.number} className="flex items-center gap-3 p-3.5 cursor-pointer transition-all border-b border-slate-50 border-l-4 border-l-transparent hover:bg-slate-50" onClick={() => startChatWithContact(customer)}>
                        <div className="w-12 h-12 rounded-full bg-[#e8f6ea] text-[#1FA84A] flex items-center justify-center font-bold shrink-0 shadow-sm border border-[#1FA84A]/20">
                          {(customer.name || '?').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col flex-1 overflow-hidden">
                          <span className="font-extrabold text-slate-800 text-[15px] truncate">{customer.name}</span>
                          <span className="text-[12px] font-medium text-slate-500 font-mono mt-0.5 truncate">{customer.number || 'Sem número'}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {customerSearch && filteredActiveContacts.length === 0 && filteredNewContacts.length === 0 && (
                  <div className="p-8 text-center text-sm font-bold text-slate-400">Nenhum contato encontrado.</div>
                )}
              </div>
            </div>

            {/* ÁREA PRINCIPAL DO CHAT */}
            <div className={`flex-1 flex-col relative bg-[#efeae2] overflow-hidden ${!activeContact ? 'hidden md:flex' : 'flex'}`}>
              
              {/* Background Pattern */}
              <div className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-multiply" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundRepeat: 'repeat', backgroundSize: '400px' }}></div>

              {activeContact ? (
                <>
                  {/* CABEÇALHO DO CHAT */}
                  <div className="h-[76px] bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center px-4 md:px-6 shrink-0 z-20 shadow-sm">
                    <button onClick={() => handleSelectContact(null)} className="md:hidden text-2xl text-slate-500 mr-4 hover:text-slate-800 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                    </button>
                    
                    {activeContact.profilePictureUrl ? (
                      <img src={activeContact.profilePictureUrl} referrerPolicy="no-referrer" className="w-11 h-11 rounded-full object-cover shrink-0 shadow-sm border border-slate-100" alt="" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-bold text-slate-600 shrink-0 shadow-sm border border-slate-200">
                        {activeContact.name.substring(0,2).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="ml-4 overflow-hidden flex-1">
                      <h2 className="text-[16px] font-extrabold text-slate-800 leading-tight truncate">{activeContact.name}</h2>
                      <span className="text-[12px] font-medium text-slate-500 font-mono leading-tight truncate block mt-0.5">
                        {activeContact.number}
                        {activeContact.instanceName && <span className="ml-2 text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest">{activeContact.instanceName}</span>}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-2 ml-auto relative">
                      <button
                        onClick={openNewTicketModal}
                        className="h-10 px-4 rounded-xl flex items-center justify-center bg-[#1FA84A] text-white font-bold hover:bg-green-600 hover:shadow-md transition-all text-sm gap-2 whitespace-nowrap hidden sm:flex"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        Criar OS
                      </button>

                      {/* Botão simplificado para mobile */}
                      <button
                        onClick={openNewTicketModal}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1FA84A] text-white hover:bg-green-600 transition-colors sm:hidden shadow-sm"
                        title="Criar Nova Solicitação"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      </button>

                      <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>

                      <button onClick={() => { setIsSearchChatOpen(!isSearchChatOpen); setChatSearchTerm(''); }} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isSearchChatOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`} title="Pesquisar">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                      </button>
                      
                      <button 
                        onClick={() => setIsDeleteModalOpen(true)} 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Excluir Conversa"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  </div>

                  {isSearchChatOpen && (
                    <div className="bg-white/95 backdrop-blur-md px-6 py-3 border-b border-slate-200 flex items-center gap-3 shrink-0 z-10 shadow-sm animate-in fade-in slide-in-from-top-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                      <input type="text" placeholder="Pesquisar nesta conversa..." className="flex-1 bg-transparent border-none outline-none text-[15px] font-medium text-slate-800 placeholder:text-slate-400" value={chatSearchTerm} onChange={e => setChatSearchTerm(e.target.value)} autoFocus />
                      <button onClick={() => { setIsSearchChatOpen(false); setChatSearchTerm(''); }} className="text-slate-500 hover:text-slate-800 font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs uppercase tracking-widest transition-colors">Fechar</button>
                    </div>
                  )}

                  {/* PRÉ-VISUALIZAÇÃO DE ARQUIVO */}
                  {previewFile && previewUrl && (
                    <div className="absolute inset-0 top-[76px] bg-slate-100/95 backdrop-blur-md z-30 flex flex-col items-center justify-between animate-in fade-in duration-200">
                      <div className="w-full flex justify-between p-6">
                        <button onClick={cancelPreview} className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-600 hover:text-red-500 hover:bg-red-50 shadow-sm transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center w-full px-6 overflow-hidden">
                          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                              {previewFile.type.startsWith('image/') ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10"><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10"><path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" /></svg>}
                            </div>
                            <h3 className="font-extrabold text-slate-800 text-xl break-all line-clamp-2">{previewFile.name}</h3>
                            <span className="text-sm font-bold text-slate-400 mt-2 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">{(previewFile.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                      </div>
                      <div className="w-full bg-white/90 backdrop-blur-md p-6 border-t border-slate-200/80 shrink-0">
                         <div className="w-full max-w-3xl mx-auto flex gap-3 items-center">
                            <input 
                              type="text" 
                              placeholder="Adicione uma legenda opcional..." 
                              className="flex-1 bg-slate-50 border border-slate-200/80 rounded-2xl px-5 py-4 text-[15px] outline-none shadow-sm focus:border-[#1FA84A] focus:bg-white transition-colors" 
                              value={inputText} 
                              onChange={(e) => setInputText(e.target.value)} 
                              onKeyDown={(e) => { if(e.key === 'Enter') handleSendMessage() }} 
                              autoFocus 
                            />
                            <button onClick={handleSendMessage} disabled={isSending} className="w-14 h-14 rounded-full bg-[#1FA84A] text-white flex items-center justify-center shadow-lg hover:bg-green-600 hover:shadow-xl hover:-translate-y-0.5 transition-all shrink-0">
                              {isSending ? <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-1"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>}
                            </button>
                         </div>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-3 z-10 no-scrollbar">
                    {filteredMessages.length === 0 && chatSearchTerm && <div className="text-center text-slate-600 font-medium mt-10 p-4 bg-white/80 rounded-2xl shadow-sm self-center max-w-sm">Nenhuma mensagem encontrada para <b>"{chatSearchTerm}"</b>.</div>}
                    
                    {filteredMessages.map((msg) => (
                      <div key={msg.id} className={`max-w-[90%] md:max-w-[65%] w-fit relative px-4 py-2.5 rounded-2xl shadow-sm flex flex-col break-words ${msg.fromMe ? 'self-end bg-[#d9fdd3] rounded-tr-none' : 'self-start bg-white rounded-tl-none border border-slate-100'}`}>
                        
                        {msg.isMedia && msg.mediaData && (
                          msg.mimeType?.startsWith('audio/') ? (
                            <div className="mt-1 mb-1"><audio controls src={msg.mediaData} className="w-[240px] md:w-[280px] h-[44px] outline-none rounded-xl" /></div>
                          ) : (
                            <div className={`flex items-center gap-4 p-3 rounded-xl mb-2 mt-1 border ${msg.fromMe ? 'bg-[#c6efc1] border-[#aee8a6]' : 'bg-slate-50 border-slate-100'}`}>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.fromMe ? 'bg-white/60 text-[#1FA84A]' : 'bg-white text-slate-500'}`}>
                                  {msg.mimeType?.includes('pdf') ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" /></svg>}
                                </div>
                                <div className="flex flex-col overflow-hidden w-full min-w-[150px] max-w-[220px]">
                                  <span className="text-[14px] font-extrabold text-slate-800 truncate tracking-tight">{msg.fileName || 'Documento'}</span>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">{msg.mimeType?.split('/')[1] || 'ARQUIVO'}</span>
                                    <button onClick={() => setViewerMessage(msg)} className="text-[11px] bg-white px-2.5 py-0.5 rounded shadow-sm border border-slate-200 text-slate-700 font-bold hover:text-[#1FA84A] transition-colors cursor-pointer">Abrir</button>
                                  </div>
                                </div>
                            </div>
                          )
                        )}

                        {msg.text && msg.text.trim() !== '' && (
                          <span className="text-[15px] text-[#111b21] leading-relaxed font-medium">
                            {chatSearchTerm ? msg.text.split(new RegExp(`(${chatSearchTerm})`, 'gi')).map((part, i) => part.toLowerCase() === chatSearchTerm.toLowerCase() ? <mark key={i} className="bg-yellow-300/80 text-black px-1 rounded">{part}</mark> : part) : msg.text}
                          </span>
                        )}

                        <div className="text-[11px] text-slate-500/80 self-end mt-1.5 flex items-center gap-1 font-bold select-none float-right ml-4">
                          {msg.time}
                          {msg.fromMe && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#53bdeb]"><path fillRule="evenodd" d="M12.528 5.47a.75.75 0 0 1 1.06 0l4 4a.75.75 0 1 1-1.06 1.06l-3.47-3.47-3.47 3.47a.75.75 0 0 1-1.06-1.06l4-4ZM7.528 11.47a.75.75 0 0 1 1.06 0l4 4a.75.75 0 1 1-1.06 1.06l-3.47-3.47-3.47 3.47a.75.75 0 0 1-1.06-1.06l4-4Z" clipRule="evenodd" /></svg>}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* BARRA DE DIGITAÇÃO E AÇÕES */}
                  <div className="bg-white/80 backdrop-blur-md p-4 md:px-6 flex items-center gap-3 shrink-0 z-10 border-t border-slate-200/80 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf,video/*,audio/*" />
                    
                    {!isRecording && (
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors shrink-0 shadow-sm border border-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 transform -rotate-45"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" /></svg>
                      </button>
                    )}

                    <div className="flex-1 relative flex items-center h-14">
                      {isRecording ? (
                        <div className="w-full h-full flex items-center justify-between bg-red-50 rounded-2xl px-6 border border-red-100 shadow-inner animate-in fade-in zoom-in-95">
                          <div className="flex items-center gap-4">
                            <div className="w-3.5 h-3.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]"></div>
                            <span className="text-red-600 font-extrabold text-[16px] tabular-nums tracking-widest">{formatRecordingTime(recordingTime)}</span>
                          </div>
                          <button type="button" onClick={cancelRecording} className="text-slate-500 hover:text-red-600 font-bold text-xs transition-colors uppercase tracking-widest bg-white/50 px-3 py-1.5 rounded-lg">Cancelar</button>
                        </div>
                      ) : (
                        <input 
                          type="text" 
                          placeholder="Escreva uma mensagem..." 
                          className="w-full h-full bg-white border border-slate-200/80 rounded-2xl px-5 text-[15px] font-medium outline-none shadow-sm focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all text-slate-800 placeholder:text-slate-400" 
                          value={inputText} 
                          onChange={(e) => setInputText(e.target.value)} 
                          onKeyDown={(e) => { if(e.key === 'Enter') handleSendMessage() }}
                          disabled={isSending} 
                        />
                      )}
                    </div>

                    {!inputText.trim() && !previewFile && !isRecording ? (
                      <button type="button" onClick={startRecording} className="w-14 h-14 rounded-full bg-[#1FA84A] text-white flex items-center justify-center hover:bg-green-600 hover:shadow-lg hover:-translate-y-0.5 transition-all shrink-0 shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" /><path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" /></svg>
                      </button>
                    ) : isRecording ? (
                      <button type="button" onClick={stopRecordingAndSend} disabled={isSending} className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 hover:shadow-lg hover:-translate-y-0.5 transition-all shrink-0 shadow-md animate-in zoom-in">
                         {isSending ? <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-1"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>}
                      </button>
                    ) : (
                      <button type="button" onClick={() => handleSendMessage()} disabled={isSending || !inputText.trim()} className="w-14 h-14 rounded-full bg-[#1FA84A] text-white flex items-center justify-center disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md hover:bg-green-600 hover:shadow-lg hover:-translate-y-0.5 transition-all shrink-0 shadow-md">
                        {isSending ? <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-1"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center z-10 bg-[#f4f7f6]">
                  <div className="w-[400px] text-center flex flex-col items-center bg-white/70 p-12 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/60 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-50 to-[#e8f6ea] rounded-full flex items-center justify-center shadow-inner mb-6 border border-[#1FA84A]/10">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[#1FA84A]"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.436 3 12c0 1.566.47 3.033 1.284 4.288l-1.127 3.125 3.328-1.087a9.123 9.123 0 0 0 5.515 1.924Z" /></svg>
                    </div>
                    <h2 className="text-[26px] font-black text-slate-800 mb-3 tracking-tight">Central de WhatsApp</h2>
                    <p className="text-[14.5px] font-medium text-slate-500 leading-relaxed">Selecione um contacto na barra lateral ou procure um cliente na base de dados para começar a interagir.</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* MODAL DE EXCLUSÃO DE CONVERSA */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="p-8 text-center bg-gradient-to-b from-white to-slate-50">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Excluir Conversa?</h3>
              <p className="text-[15px] font-medium text-slate-500 leading-relaxed px-2">Tem a certeza que deseja apagar todas as mensagens desta conversa? Esta ação não pode ser desfeita.</p>
            </div>
            <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-5 py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm">Cancelar</button>
              <button onClick={confirmDeleteConversation} className="flex-1 bg-red-500 text-white px-5 py-3.5 rounded-xl font-bold text-sm hover:bg-red-600 hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md">Sim, Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRIAR OS */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsNewTicketModalOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-b from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e8f6ea] text-[#1FA84A] rounded-xl flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </div>
                <h3 className="font-extrabold text-xl text-slate-800">Nova Solicitação (OS)</h3>
              </div>
              <button onClick={() => setIsNewTicketModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 flex flex-col gap-5 bg-white">
              <div className="bg-slate-50/80 border border-slate-100 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                 {activeContact?.profilePictureUrl ? (
                    <img src={activeContact.profilePictureUrl} referrerPolicy="no-referrer" className="w-14 h-14 rounded-full object-cover shadow-sm border border-slate-200" alt="" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-white border border-slate-200 text-[#1FA84A] font-bold flex items-center justify-center shadow-sm">{(activeContact?.name || '?').substring(0, 2).toUpperCase()}</div>
                 )}
                 <div>
                   <h4 className="font-extrabold text-slate-800 text-[16px]">{activeContact?.name || 'Cliente'}</h4>
                   <span className="text-[12px] font-bold font-mono text-slate-500 bg-white px-2.5 py-1 rounded-md mt-1.5 inline-block border border-slate-200 shadow-sm">{activeContact?.number}</span>
                 </div>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detalhes do Registo</h4>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">Nome do Cliente</label>
                  <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 outline-none focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all shadow-sm" value={formNome} onChange={e => setFormNome(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">E-mail</label>
                  <input type="email" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 outline-none focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all shadow-sm" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">CPF / CNPJ</label>
                  <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-mono text-slate-800 outline-none focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all shadow-sm" value={formCpf} onChange={e => setFormCpf(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Marca do Aparelho</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:bg-white focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all shadow-sm" value={formMarca} onChange={e => setFormMarca(e.target.value)} /></div>
                <div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Modelo</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:bg-white focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all shadow-sm" value={formModelo} onChange={e => setFormModelo(e.target.value)} /></div>
              </div>
            </div>
            <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button onClick={() => setIsNewTicketModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200/50 transition-colors text-sm">Cancelar</button>
              <button onClick={handleCreateTicket} className="bg-[#1FA84A] text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:bg-green-600 transition-all text-sm">Criar Solicitação</button>
            </div>
          </div>
        </div>
      )}

      {viewerMessage && viewerMessage.mediaData && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 md:p-8 animate-in fade-in" onClick={() => setViewerMessage(null)}>
          <div className="bg-white rounded-3xl shadow-2xl flex flex-col w-full max-w-5xl h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 bg-white shrink-0">
              <span className="font-extrabold text-slate-800 text-[16px] truncate max-w-[80%]">{viewerMessage.fileName || 'Visualizador de Arquivo'}</span>
              <button onClick={() => setViewerMessage(null)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 6 18M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 bg-[#f4f7f6] flex items-center justify-center overflow-hidden relative">
              {viewerMessage.mimeType?.startsWith('image/') ? <img src={viewerMessage.mediaData} alt="" className="max-w-full max-h-full object-contain shadow-sm" /> : viewerMessage.mimeType?.startsWith('video/') ? <video src={viewerMessage.mediaData} controls autoPlay className="max-w-full max-h-full shadow-sm outline-none" /> : viewerMessage.mimeType?.includes('pdf') ? <iframe src={`${viewerMessage.mediaData}#toolbar=0`} className="w-full h-full border-none bg-white" /> : <div className="text-slate-400 flex flex-col items-center bg-white p-12 rounded-3xl shadow-sm border border-slate-200"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-20 h-20 mb-4 text-slate-300"><path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" /></svg><span className="font-bold text-slate-700 text-lg">Pré-visualização indisponível</span><p className="text-sm text-slate-500 mt-1">Este tipo de ficheiro precisa de ser descarregado para abrir.</p></div>}
            </div>
            <div className="px-8 py-5 border-t border-slate-100 flex justify-end bg-white shrink-0"><a href={viewerMessage.mediaData} download={viewerMessage.fileName || 'download'} target="_blank" rel="noopener noreferrer" className="bg-[#1FA84A] text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-green-600 shadow-md hover:shadow-lg transition-all flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>Descarregar Arquivo</a></div>
          </div>
        </div>
      )}
    </div>
  );
}