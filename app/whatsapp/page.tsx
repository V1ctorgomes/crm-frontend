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
}

interface Stage {
  id: string;
  name: string;
}

export default function WhatsAppPage() {
  // NOVO: Verificação de Instâncias
  const [hasInstances, setHasInstances] = useState<boolean | null>(null);

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  
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
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);

  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formModelo, setFormModelo] = useState('');

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  const handleSelectContact = (contact: Contact | null) => {
    setActiveContact(contact);
    setIsSearchChatOpen(false);
    setChatSearchTerm('');
    setIsChatMenuOpen(false);
    if (contact) {
      localStorage.setItem('lastActiveContact', contact.number);
    } else {
      localStorage.removeItem('lastActiveContact');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, activeContact, chatSearchTerm]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // 1. Verifica se existem Instâncias conectadas para o Utilizador
        const resUsers = await fetch(`${baseUrl}/users`);
        if (resUsers.ok) {
          const users = await resUsers.json();
          if (users.length > 0) {
            const userId = users[0].id;
            const resInstances = await fetch(`${baseUrl}/instances/user/${userId}`);
            if (resInstances.ok) {
              const instances = await resInstances.json();
              setHasInstances(instances.length > 0); // Se for > 0, tem instância
            } else {
              setHasInstances(false);
            }
          } else {
            setHasInstances(false);
          }
        }

        // 2. Carrega Contatos
        const resContacts = await fetch(`${baseUrl}/whatsapp/contacts`);
        if (resContacts.ok) {
          const data = await resContacts.json();
          const formattedContacts = data.map((c: any) => ({
            ...c,
            lastMessageTime: new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setContacts(formattedContacts);

          const savedNumber = localStorage.getItem('lastActiveContact');
          if (savedNumber) {
            const foundContact = formattedContacts.find((c: Contact) => c.number === savedNumber);
            if (foundContact) setActiveContact(foundContact);
          }
        }

        // 3. Carrega Fases do Kanban
        const resStages = await fetch(`${baseUrl}/tickets/stages`);
        if (resStages.ok) setStages(await resStages.json());

      } catch (err) { 
        console.error("Erro ao carregar dados:", err);
        setHasInstances(false);
      }
    };
    fetchInitialData();
  }, [baseUrl]);

  useEffect(() => {
    if (activeContact && !chatHistory[activeContact.number]) {
      const fetchHistory = async () => {
        try {
          const res = await fetch(`${baseUrl}/whatsapp/history/${activeContact.number}`);
          if (res.ok) {
            const data = await res.json();
            const formattedMessages = data.map((m: any) => ({
              id: m.id,
              text: m.text,
              type: m.type,
              time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              fromMe: m.type === 'sent',
              senderNumber: m.contactNumber,
              isMedia: m.isMedia,
              mediaData: m.mediaData, 
              mimeType: m.mimeType,
              fileName: m.fileName
            }));
            setChatHistory(prev => ({ ...prev, [activeContact.number]: formattedMessages }));
          }
        } catch (err) { console.error("Erro ao carregar histórico:", err); }
      };
      fetchHistory();
    }
  }, [activeContact, baseUrl, chatHistory]);

  useEffect(() => {
    if (hasInstances === false) return; // Se não tem instância, não liga o streaming para poupar recursos

    const eventSource = new EventSource(`${baseUrl}/whatsapp/stream`);
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.event === 'messages.upsert' && payload?.data) {
          const msgData = payload.data;
          const remoteJid = msgData.key?.remoteJid;
          if (!remoteJid || remoteJid.includes('@g.us') || remoteJid === 'status@broadcast') return;
          
          const contactNumber = remoteJid.split('@')[0];
          const isFromMe = msgData.key?.fromMe || false;
          const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          const customMedia = msgData.customMedia || {};
          let incomingText = customMedia.text !== undefined 
            ? customMedia.text 
            : (msgData.message?.conversation || msgData.message?.extendedTextMessage?.text || (msgData.message?.imageMessage ? "📷 Imagem" : msgData.message?.documentMessage ? "📄 Documento" : msgData.message?.audioMessage ? "🎵 Áudio" : "Mídia recebida"));

          const newMessage: Message = {
            id: msgData.key?.id || Date.now(),
            text: incomingText,
            type: isFromMe ? 'sent' : 'received',
            time: timeNow,
            fromMe: isFromMe,
            senderNumber: contactNumber,
            isMedia: customMedia.isMedia || false,
            mediaData: customMedia.mediaData,
            mimeType: customMedia.mimeType,
            fileName: customMedia.fileName
          };

          setChatHistory(prev => ({ ...prev, [contactNumber]: [...(prev[contactNumber] || []), newMessage] }));
        }
      } catch (err) {}
    };
    return () => eventSource.close();
  }, [baseUrl, hasInstances]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeContact) return;
    if (file.size > 15 * 1024 * 1024) {
      setErrorBanner("O arquivo é muito grande (máximo 15MB).");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setPreviewFile(file);
  };

  const cancelPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl(null);
    setInputText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSending || !activeContact) return;
    if (!inputText.trim() && !previewFile) return;

    const targetNumber = activeContact.number;
    const textToSend = inputText;

    setIsSending(true);

    if (previewFile) {
      const formData = new FormData();
      formData.append('file', previewFile);
      formData.append('number', targetNumber);
      formData.append('caption', textToSend);

      const tempId = Date.now();
      const optimisticMsg: Message = { 
        id: tempId, text: textToSend, type: 'sent', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
        fromMe: true, senderNumber: targetNumber, isMedia: true, mediaData: previewUrl || '', mimeType: previewFile.type, fileName: previewFile.name
      };

      setChatHistory(prev => ({ ...prev, [targetNumber]: [...(prev[targetNumber] || []), optimisticMsg] }));
      
      setInputText('');
      setPreviewFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      try {
        const res = await fetch(`${baseUrl}/whatsapp/send-media`, { method: 'POST', body: formData });
        if (res.ok) {
           const savedData = await res.json();
           setChatHistory(prev => ({
             ...prev,
             [targetNumber]: prev[targetNumber].map(msg => 
               msg.id === tempId ? { ...msg, id: savedData.id, mediaData: savedData.mediaData } : msg
             )
           }));
        }
      } catch (error) { setErrorBanner("Erro ao enviar arquivo."); } finally { setIsSending(false); }
    } else {
      const optimisticMsg: Message = { 
        id: Date.now(), text: textToSend, type: 'sent', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), fromMe: true, senderNumber: targetNumber
      };

      setChatHistory(prev => ({ ...prev, [targetNumber]: [...(prev[targetNumber] || []), optimisticMsg] }));
      setInputText('');

      try {
        await fetch(`${baseUrl}/whatsapp/send`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number: targetNumber, text: textToSend })
        });
      } catch (error) { setErrorBanner("Erro ao enviar mensagem."); } finally { setIsSending(false); }
    }
  };

  const openNewTicketModal = () => {
    setIsChatMenuOpen(false);
    if (!activeContact) return;
    setFormNome(activeContact.name || '');
    setFormEmail(activeContact.email || '');
    setFormCpf(activeContact.cnpj || '');
    setFormMarca('');
    setFormModelo('');
    setIsNewTicketModalOpen(true);
  };

  const handleCreateTicket = async () => {
    if (!activeContact || stages.length === 0) return alert("Nenhuma fase de Kanban encontrada no sistema.");
    
    const body = { contactNumber: activeContact.number, nome: formNome, email: formEmail, cpf: formCpf, marca: formMarca, modelo: formModelo, stageId: stages[0].id };

    try {
      const res = await fetch(`${baseUrl}/tickets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        setIsNewTicketModalOpen(false);
        const ticketAlert = document.createElement("div");
        ticketAlert.className = "fixed bottom-10 right-10 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-50 font-bold transition-all";
        ticketAlert.innerText = "Solicitação criada no Kanban!";
        document.body.appendChild(ticketAlert);
        setTimeout(() => ticketAlert.remove(), 3000);
      }
    } catch (err) { setErrorBanner("Erro ao criar a solicitação."); }
  };

  const activeMessages = activeContact ? (chatHistory[activeContact.number] || []) : [];
  const filteredMessages = chatSearchTerm
    ? activeMessages.filter(msg => 
        (msg.text || '').toLowerCase().includes(chatSearchTerm.toLowerCase()) ||
        (msg.fileName || '').toLowerCase().includes(chatSearchTerm.toLowerCase())
      )
    : activeMessages;

  return (
    <div className="flex h-screen overflow-hidden bg-white font-sans">
      
      <Sidebar />

      <main className="flex-1 flex pt-[60px] md:pt-0 h-full relative overflow-hidden">
        
        {/* Trava: Mostra Loading se ainda estiver verificando */}
        {hasInstances === null ? (
          <div className="flex-1 flex items-center justify-center bg-[#f0f2f5]">
            <div className="w-10 h-10 border-4 border-[#1FA84A] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : hasInstances === false ? (
          // Trava: Tela de Bloqueio caso não tenha Instâncias conectadas
          <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] p-6 text-center animate-in fade-in">
             <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
             </div>
             <h2 className="text-2xl font-bold text-slate-800 mb-3">Nenhuma Instância Conectada</h2>
             <p className="text-slate-500 mb-8 max-w-md text-sm leading-relaxed">
               Para começar a enviar e receber mensagens com os seus clientes, você precisa primeiro criar e conectar uma instância do WhatsApp.
             </p>
             <Link href="/configuracoes" className="bg-[#1FA84A] text-white px-8 py-3 rounded-xl font-bold hover:bg-green-600 transition-colors shadow-sm flex items-center gap-2">
                Ir para Configurações
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
             </Link>
          </div>
        ) : (
          /* ========================================================= */
          /* O SEU WHATSAPP NORMAL AQUI (SÓ APARECE SE TIVER INSTÂNCIA) */
          /* ========================================================= */
          <>
            {errorBanner && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-xl shadow-xl z-50 flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <span className="font-medium text-sm">{errorBanner}</span>
                <button onClick={() => setErrorBanner(null)} className="ml-2 font-bold opacity-80 hover:opacity-100">X</button>
              </div>
            )}

            <div className={`w-full md:w-[320px] lg:w-[350px] flex-col border-r border-slate-200 bg-white shrink-0 z-20 ${activeContact ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-3 bg-white border-b border-slate-100 shrink-0">
                <div className="bg-[#f0f2f5] rounded-lg flex items-center px-4 h-10">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                  <input type="text" placeholder="Procurar ou iniciar conversa" className="bg-transparent border-none outline-none w-full pl-3 text-sm" />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {contacts.map((contact) => (
                  <div key={contact.number} className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-slate-50 ${activeContact?.number === contact.number ? 'bg-[#f0f2f5]' : 'hover:bg-slate-50'}`} onClick={() => handleSelectContact(contact)}>
                    {contact.profilePictureUrl ? (
                      <img src={contact.profilePictureUrl} className="w-12 h-12 rounded-full object-cover shrink-0" alt="avatar" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 shrink-0">{contact.name.substring(0, 2).toUpperCase()}</div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-semibold text-slate-800 text-[15px] truncate">{contact.name}</span>
                        <span className="text-[11px] text-slate-500 shrink-0">{contact.lastMessageTime}</span>
                      </div>
                      <div className="text-[13px] text-slate-500 truncate">{contact.lastMessage}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`flex-1 flex-col relative bg-[#efeae2] overflow-hidden ${!activeContact ? 'hidden md:flex' : 'flex'}`}>
              <div className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-multiply" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundRepeat: 'repeat', backgroundSize: '400px' }}></div>

              {activeContact ? (
                <>
                  <div className="h-[60px] bg-[#f0f2f5] border-b border-slate-200 flex items-center px-4 shrink-0 z-10">
                    <button onClick={() => handleSelectContact(null)} className="md:hidden text-2xl text-slate-500 mr-3"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg></button>
                    {activeContact.profilePictureUrl ? (
                      <img src={activeContact.profilePictureUrl} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center font-bold text-white shrink-0">{activeContact.name.substring(0,2)}</div>
                    )}
                    <div className="ml-3 overflow-hidden flex-1">
                      <h2 className="text-[15px] font-semibold text-slate-800 leading-tight truncate">{activeContact.name}</h2>
                      <span className="text-[12px] text-slate-500 leading-tight truncate block">{activeContact.number}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-auto relative">
                      <button onClick={() => { setIsSearchChatOpen(!isSearchChatOpen); setChatSearchTerm(''); }} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isSearchChatOpen ? 'bg-[#d9fdd3] text-[#1FA84A]' : 'text-slate-500 hover:bg-slate-200'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                      </button>

                      <div className="relative">
                        <button onClick={() => setIsChatMenuOpen(!isChatMenuOpen)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isChatMenuOpen ? 'bg-slate-200 text-slate-700' : 'text-slate-500 hover:bg-slate-200'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" /></svg>
                        </button>
                        {isChatMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsChatMenuOpen(false)}></div>
                            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden">
                              <button onClick={openNewTicketModal} className="w-full text-left px-4 py-3 text-[14.5px] font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#1FA84A]"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> Nova Solicitação
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSearchChatOpen && (
                    <div className="bg-white px-4 py-2 border-b border-slate-200 flex items-center gap-3 shrink-0 z-10 shadow-sm animate-in fade-in slide-in-from-top-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                      <input type="text" placeholder="Pesquisar nesta conversa..." className="flex-1 bg-transparent border-none outline-none text-[14.5px] text-slate-700" value={chatSearchTerm} onChange={e => setChatSearchTerm(e.target.value)} autoFocus />
                      <button onClick={() => { setIsSearchChatOpen(false); setChatSearchTerm(''); }} className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1 bg-slate-100 rounded text-xs uppercase tracking-wider">Fechar</button>
                    </div>
                  )}

                  {previewFile && previewUrl && (
                    <div className="absolute inset-0 top-[60px] bg-slate-100 z-30 flex flex-col items-center justify-between">
                      <div className="w-full flex justify-between p-4"><button onClick={cancelPreview} className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center text-slate-700 hover:bg-black/20 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button></div>
                      <div className="flex-1 flex flex-col items-center justify-center w-full px-4 overflow-hidden">
                          <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center">
                            <h3 className="font-bold text-slate-800 text-lg break-all line-clamp-2">{previewFile.name}</h3>
                            <span className="text-sm font-medium text-slate-400 mt-2">{(previewFile.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                      </div>
                      <div className="w-full bg-[#f0f2f5] p-4 flex items-center justify-center shrink-0">
                         <div className="w-full max-w-2xl flex gap-2">
                            <input type="text" placeholder="Adicione uma legenda..." className="flex-1 bg-white border-none rounded-xl px-4 py-3 text-[15px] outline-none shadow-sm" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleSendMessage() }} autoFocus />
                            <button onClick={handleSendMessage} disabled={isSending} className="w-12 h-12 rounded-full bg-[#1FA84A] text-white flex items-center justify-center shadow-md shrink-0">
                              {isSending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-1"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>}
                            </button>
                         </div>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-3 z-10">
                    {filteredMessages.length === 0 && chatSearchTerm && <div className="text-center text-slate-500 mt-10 p-4 bg-black/5 rounded-xl self-center">Nenhuma mensagem encontrada para <b>"{chatSearchTerm}"</b>.</div>}
                    {filteredMessages.map((msg) => (
                      <div key={msg.id} className={`max-w-[90%] md:max-w-[65%] w-fit relative px-3 py-2 rounded-xl shadow-sm flex flex-col break-words ${msg.fromMe ? 'self-end bg-[#d9fdd3] rounded-tr-none' : 'self-start bg-white rounded-tl-none'}`}>
                        {msg.isMedia && msg.mediaData && (
                          msg.mimeType?.startsWith('audio/') ? (
                            <div className="mt-1 mb-1"><audio controls src={msg.mediaData} className="w-[240px] md:w-[280px] h-[40px] outline-none rounded-md" /></div>
                          ) : (
                            <div className={`flex items-center gap-3 p-3 rounded-lg mb-2 mt-1 ${msg.fromMe ? 'bg-[#c6efc1]' : 'bg-black/5'}`}>
                                <div className="w-10 h-10 bg-white/60 rounded-lg flex items-center justify-center shrink-0">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-slate-500"><path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" /><path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" /></svg>
                                </div>
                                <div className="flex flex-col overflow-hidden w-full min-w-[150px] max-w-[200px]">
                                  <span className="text-[14px] font-bold text-slate-800 truncate">{msg.fileName || 'Arquivo'}</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[11px] text-slate-500 font-bold uppercase">{msg.mimeType?.split('/')[1] || 'ARQUIVO'}</span>
                                    <button onClick={() => setViewerMessage(msg)} className="text-[12px] text-[#1FA84A] font-bold hover:underline cursor-pointer bg-transparent border-none p-0">Abrir</button>
                                  </div>
                                </div>
                            </div>
                          )
                        )}

                        {msg.text && !(msg.mimeType?.startsWith('audio/') && msg.text === "🎵 Áudio") && (
                          <span className="text-[14.5px] text-[#111b21] leading-snug">
                            {chatSearchTerm ? msg.text.split(new RegExp(`(${chatSearchTerm})`, 'gi')).map((part, i) => part.toLowerCase() === chatSearchTerm.toLowerCase() ? <mark key={i} className="bg-yellow-300 text-black px-0.5 rounded">{part}</mark> : part) : msg.text}
                          </span>
                        )}

                        <div className="text-[11px] text-slate-500 self-end mt-1 flex items-center gap-1 font-medium select-none float-right ml-4">
                          {msg.time}
                          {msg.fromMe && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#53bdeb]"><path fillRule="evenodd" d="M12.528 5.47a.75.75 0 0 1 1.06 0l4 4a.75.75 0 1 1-1.06 1.06l-3.47-3.47-3.47 3.47a.75.75 0 0 1-1.06-1.06l4-4ZM7.528 11.47a.75.75 0 0 1 1.06 0l4 4a.75.75 0 1 1-1.06 1.06l-3.47-3.47-3.47 3.47a.75.75 0 0 1-1.06-1.06l4-4Z" clipRule="evenodd" /></svg>}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <form className="bg-[#f0f2f5] p-3 flex items-center gap-3 shrink-0 z-10" onSubmit={handleSendMessage}>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf,video/*,audio/*" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors shrink-0"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 transform -rotate-45"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" /></svg></button>
                    <input type="text" placeholder="Escreva uma mensagem..." className="flex-1 bg-white border-none rounded-xl px-4 py-3 text-[15px] outline-none shadow-sm" value={inputText} onChange={(e) => setInputText(e.target.value)} disabled={isSending} />
                    <button type="submit" disabled={isSending || !inputText.trim()} className="w-11 h-11 rounded-full bg-[#1FA84A] text-white flex items-center justify-center disabled:opacity-50 hover:bg-green-600 transition-colors shrink-0">{isSending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-1"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>}</button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center z-10 bg-[#f0f2f5]">
                  <div className="w-[320px] text-center text-slate-300 flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-24 h-24 mb-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.436 3 12c0 1.566.47 3.033 1.284 4.288l-1.127 3.125 3.328-1.087a9.123 9.123 0 0 0 5.515 1.924Z" /></svg>
                    <h2 className="text-[28px] font-light text-slate-600 mb-4">CRM Suporte Imagem</h2>
                    <p className="text-[14px] text-slate-500">Selecione um contacto na barra lateral para começar a enviar e receber mensagens.</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* MODAL NOVA SOLICITAÇÃO (CABEÇALHO WHATSAPP) */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4" onClick={() => setIsNewTicketModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-[#1FA84A]"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>Nova Solicitação</h3>
              <button onClick={() => setIsNewTicketModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
              <div className="bg-[#e8f6ea] border border-[#1FA84A]/30 p-4 rounded-xl flex items-center gap-4">
                 {activeContact?.profilePictureUrl ? (
                    <img src={activeContact.profilePictureUrl} className="w-12 h-12 rounded-full object-cover shadow-sm" alt="" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white text-[#1FA84A] font-bold flex items-center justify-center shadow-sm">{(activeContact?.name || '?').substring(0, 2).toUpperCase()}</div>
                 )}
                 <div>
                   <h4 className="font-bold text-slate-800 text-[15px]">{activeContact?.name || 'Cliente'}</h4>
                   <span className="text-[12px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded-md mt-1 inline-block border border-slate-200">{activeContact?.number}</span>
                 </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dados do Cliente</h4>
                <div><label className="text-[11px] font-bold text-slate-500 block mb-1">Nome</label><input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1FA84A]" value={formNome} onChange={e => setFormNome(e.target.value)} /></div>
                <div><label className="text-[11px] font-bold text-slate-500 block mb-1">E-mail</label><input type="email" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1FA84A]" value={formEmail} onChange={e => setFormEmail(e.target.value)} /></div>
                <div><label className="text-[11px] font-bold text-slate-500 block mb-1">CPF / CNPJ</label><input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none font-mono focus:border-[#1FA84A]" value={formCpf} onChange={e => setFormCpf(e.target.value)} /></div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Marca do Aparelho</label><input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1FA84A] shadow-sm" value={formMarca} onChange={e => setFormMarca(e.target.value)} /></div>
                <div className="flex-1"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Modelo</label><input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1FA84A] shadow-sm" value={formModelo} onChange={e => setFormModelo(e.target.value)} /></div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsNewTicketModalOpen(false)} className="px-4 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancelar</button>
              <button onClick={handleCreateTicket} className="bg-[#1FA84A] text-white px-6 py-2 rounded-lg font-bold hover:bg-green-600 shadow-sm transition-colors">Confirmar e Criar</button>
            </div>
          </div>
        </div>
      )}

      {viewerMessage && viewerMessage.mediaData && (
        <div className="fixed inset-0 bg-black/70 z-[999] flex items-center justify-center p-4 md:p-8" onClick={() => setViewerMessage(null)}>
          <div className="bg-white rounded-2xl shadow-xl flex flex-col w-full max-w-5xl h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white shrink-0">
              <span className="font-bold text-slate-800 text-[15px] truncate max-w-[80%]">{viewerMessage.fileName || 'Documento'}</span>
              <button onClick={() => setViewerMessage(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 6 18M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 bg-[#f8f9fa] flex items-center justify-center overflow-hidden relative">
              {viewerMessage.mimeType?.startsWith('image/') ? <img src={viewerMessage.mediaData} alt="" className="max-w-full max-h-full object-contain p-4 shadow-sm" /> : viewerMessage.mimeType?.startsWith('video/') ? <video src={viewerMessage.mediaData} controls autoPlay className="max-w-full max-h-full shadow-sm outline-none p-4" /> : viewerMessage.mimeType?.includes('pdf') ? <iframe src={`${viewerMessage.mediaData}#toolbar=0`} className="w-full h-full border-none bg-white" /> : <div className="text-slate-400 flex flex-col items-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 mb-4"><path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" /></svg><span className="text-[15px]">Pré-visualização indisponível</span></div>}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-white shrink-0"><a href={viewerMessage.mediaData} download={viewerMessage.fileName || 'download'} target="_blank" rel="noopener noreferrer" className="bg-[#1FA84A] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-green-600 shadow-sm no-underline transition-colors">Descarregar Original</a></div>
          </div>
        </div>
      )}
    </div>
  );
  
}