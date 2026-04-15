'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar'; 

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
}

export default function WhatsAppPage() {
  const router = useRouter();
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

  const handleSelectContact = (contact: Contact | null) => {
    setActiveContact(contact);
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
  }, [chatHistory, activeContact]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
        const res = await fetch(`${baseUrl}/whatsapp/contacts`);
        if (res.ok) {
          const data = await res.json();
          const formattedContacts = data.map((c: any) => ({
            ...c,
            lastMessageTime: new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setContacts(formattedContacts);

          const savedNumber = localStorage.getItem('lastActiveContact');
          if (savedNumber) {
            const foundContact = formattedContacts.find((c: Contact) => c.number === savedNumber);
            if (foundContact) {
              setActiveContact(foundContact);
            }
          }
        }
      } catch (err) { console.error("Erro ao carregar contatos:", err); }
    };
    fetchContacts();
  }, []);

  useEffect(() => {
    if (activeContact && !chatHistory[activeContact.number]) {
      const fetchHistory = async () => {
        try {
          const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
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
        } catch (err) { }
      };
      fetchHistory();
    }
  }, [activeContact]);

  useEffect(() => {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
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
          const incomingText = customMedia.text !== undefined 
            ? customMedia.text 
            : (msgData.message?.conversation || msgData.message?.extendedTextMessage?.text || (msgData.message?.imageMessage ? "📷 Imagem" : msgData.message?.documentMessage ? "📄 Documento" : "📷 Mídia recebida"));

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
  }, []);

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
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
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
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
        await fetch(`${baseUrl}/whatsapp/send`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number: targetNumber, text: textToSend })
        });
      } catch (error) { setErrorBanner("Erro ao enviar mensagem."); } finally { setIsSending(false); }
    }
  };

  const activeMessages = activeContact ? (chatHistory[activeContact.number] || []) : [];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa] font-sans">
      
      <Sidebar />

      <main className="flex-1 flex flex-col relative h-full pt-[60px] md:pt-0">
        
        {errorBanner && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-xl shadow-xl z-50 flex items-center gap-3">
            <i className="bi bi-exclamation-circle text-lg"></i>
            <span className="font-medium text-sm">{errorBanner}</span>
            <button onClick={() => setErrorBanner(null)} className="ml-2 font-bold opacity-80 hover:opacity-100">X</button>
          </div>
        )}

        {/* ESTRUTURA BLINDADA DO WHATSAPP (Tailwind 100%) */}
        <div className="flex w-full h-full bg-white overflow-hidden shadow-sm">
          
          {/* BARRA DE CONTATOS */}
          <div className={`w-full md:w-[350px] lg:w-[400px] flex-col border-r border-slate-200 shrink-0 bg-white z-20 ${activeContact ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-3 bg-white border-b border-slate-100">
              <div className="bg-[#f0f2f5] rounded-lg flex items-center px-4 h-10">
                <i className="bi bi-search text-slate-400"></i>
                <input type="text" placeholder="Procurar ou iniciar conversa" className="bg-transparent border-none outline-none w-full pl-3 text-sm" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {contacts.map((contact) => (
                <div 
                  key={contact.number} 
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-slate-50 ${activeContact?.number === contact.number ? 'bg-[#f0f2f5]' : 'hover:bg-slate-50'}`}
                  onClick={() => handleSelectContact(contact)}
                >
                  {contact.profilePictureUrl ? (
                    <img src={contact.profilePictureUrl} className="w-12 h-12 rounded-full object-cover shrink-0" alt="avatar" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 shrink-0">
                      {contact.name.substring(0, 2).toUpperCase()}
                    </div>
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

          {/* ÁREA DE CHAT (MENSAGENS) */}
          <div className={`flex-1 flex-col relative bg-[#efeae2] ${!activeContact ? 'hidden md:flex' : 'flex'}`}>
            
            {/* Background Image fixo do WhatsApp */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-multiply" 
                 style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundRepeat: 'repeat', backgroundSize: '400px' }}>
            </div>

            {activeContact ? (
              <>
                {/* Cabeçalho do Chat */}
                <div className="h-[60px] bg-[#f0f2f5] border-b border-slate-200 flex items-center px-4 shrink-0 z-10">
                  <button onClick={() => handleSelectContact(null)} className="md:hidden text-2xl text-slate-500 mr-3">
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  {activeContact.profilePictureUrl ? (
                    <img src={activeContact.profilePictureUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center font-bold text-white">
                      {activeContact.name.substring(0,2)}
                    </div>
                  )}
                  <div className="ml-3">
                    <h2 className="text-[15px] font-semibold text-slate-800 leading-tight">{activeContact.name}</h2>
                    <span className="text-[12px] text-slate-500 leading-tight">{activeContact.number}</span>
                  </div>
                </div>

                {/* Preview de Upload */}
                {previewFile && previewUrl && (
                  <div className="absolute inset-0 top-[60px] bg-slate-100 z-30 flex flex-col items-center justify-between">
                    <div className="w-full flex justify-between p-4">
                      <button onClick={cancelPreview} className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center text-slate-700 hover:bg-black/20 text-xl transition-colors">
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center w-full px-4 overflow-hidden">
                        <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center">
                          <i className="bi bi-file-earmark-fill text-6xl text-slate-300 mb-4"></i>
                          <h3 className="font-bold text-slate-800 text-lg break-all line-clamp-2">{previewFile.name}</h3>
                          <span className="text-sm font-medium text-slate-400 mt-2">{(previewFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                    </div>
                    <div className="w-full bg-[#f0f2f5] p-4 flex items-center justify-center shrink-0">
                       <div className="w-full max-w-2xl flex gap-2">
                          <input type="text" placeholder="Adicione uma legenda..." className="flex-1 bg-white border-none rounded-xl px-4 py-3 text-[15px] outline-none shadow-sm" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleSendMessage() }} autoFocus />
                          <button onClick={handleSendMessage} disabled={isSending} className="w-12 h-12 rounded-full bg-[#1FA84A] text-white flex items-center justify-center shadow-md shrink-0">
                            {isSending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <i className="bi bi-send-fill"></i>}
                          </button>
                       </div>
                    </div>
                  </div>
                )}

                {/* Lista de Mensagens */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-3 z-10">
                  {activeMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`max-w-[85%] md:max-w-[65%] w-fit relative px-3 py-2 rounded-xl shadow-sm flex flex-col
                        ${msg.fromMe ? 'self-end bg-[#d9fdd3] rounded-tr-none' : 'self-start bg-white rounded-tl-none'}`}
                    >
                      {msg.isMedia && msg.mediaData && (
                        <div className={`flex items-center gap-3 p-3 rounded-lg mb-2 mt-1 ${msg.fromMe ? 'bg-[#c6efc1]' : 'bg-black/5'}`}>
                            <div className="w-10 h-10 bg-white/60 rounded-lg flex items-center justify-center shrink-0">
                                <i className={`text-2xl ${msg.mimeType?.includes('pdf') ? 'bi bi-file-earmark-pdf-fill text-red-500' : 'bi bi-file-earmark-fill text-slate-500'}`}></i>
                            </div>
                            <div className="flex flex-col overflow-hidden w-full max-w-[200px]">
                              <span className="text-[14px] font-bold text-slate-800 truncate">{msg.fileName || 'Arquivo'}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] text-slate-500 font-bold uppercase">{msg.mimeType?.split('/')[1] || 'ARQUIVO'}</span>
                                <a onClick={() => setViewerMessage(msg)} className="text-[12px] text-[#1FA84A] font-bold hover:underline cursor-pointer">Abrir</a>
                              </div>
                            </div>
                        </div>
                      )}

                      {msg.text && (
                        <span className="text-[14.5px] text-[#111b21] leading-snug break-words">
                          {msg.text}
                        </span>
                      )}

                      <div className="text-[11px] text-slate-500 self-end mt-1 flex items-center gap-1 font-medium select-none float-right ml-4">
                        {msg.time}
                        {msg.fromMe && <i className="bi bi-check-all text-[#53bdeb] text-[15px] leading-none"></i>}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Área de Input (Bottom) */}
                <form className="bg-[#f0f2f5] p-3 flex items-center gap-3 shrink-0 z-10" onSubmit={handleSendMessage}>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf,video/*" />
                  
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors shrink-0">
                    <i className="bi bi-paperclip text-2xl"></i>
                  </button>
                  
                  <input 
                    type="text" 
                    placeholder="Escreva uma mensagem..." 
                    className="flex-1 bg-white border-none rounded-xl px-4 py-3 text-[15px] outline-none shadow-sm"
                    value={inputText} 
                    onChange={(e) => setInputText(e.target.value)} 
                    disabled={isSending} 
                  />
                  
                  <button type="submit" disabled={isSending || !inputText.trim()} className="w-11 h-11 rounded-full bg-[#1FA84A] text-white flex items-center justify-center disabled:opacity-50 hover:bg-green-600 transition-colors shrink-0">
                    {isSending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <i className="bi bi-send-fill text-lg"></i>}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] z-10">
                <div className="w-[320px] text-center">
                   <i className="bi bi-whatsapp text-[80px] text-slate-300 mb-6 block"></i>
                   <h2 className="text-[28px] font-light text-slate-600 mb-4">CRM Suporte Imagem</h2>
                   <p className="text-[14px] text-slate-500">Selecione um contacto na barra lateral para começar a enviar e receber mensagens, fotografias e documentos.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Pré-Visualização de Documentos */}
      {viewerMessage && viewerMessage.mediaData && (
        <div className="fixed inset-0 bg-slate-900/60 z-[999] flex items-center justify-center p-4 md:p-8 backdrop-blur-sm transition-opacity" onClick={() => setViewerMessage(null)}>
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white shrink-0">
              <span className="font-bold text-slate-800 text-[15px] truncate max-w-[80%]">{viewerMessage.fileName || 'Documento'}</span>
              <button onClick={() => setViewerMessage(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                <i className="bi bi-x-lg text-sm"></i>
              </button>
            </div>
            <div className="flex-1 bg-[#f8f9fa] flex items-center justify-center overflow-hidden">
              {viewerMessage.mimeType?.startsWith('image/') ? (
                <img src={viewerMessage.mediaData} alt={viewerMessage.fileName} className="max-w-full max-h-full object-contain p-4 shadow-sm" />
              ) : viewerMessage.mimeType?.startsWith('video/') ? (
                <video src={viewerMessage.mediaData} controls autoPlay className="max-w-full max-h-full shadow-sm outline-none p-4" />
              ) : viewerMessage.mimeType?.includes('pdf') ? (
                <iframe src={`${viewerMessage.mediaData}#toolbar=0`} className="w-full h-full border-none bg-white" title="PDF" />
              ) : (
                <div className="text-slate-400 flex flex-col items-center">
                  <i className="bi bi-file-earmark-fill text-6xl mb-4"></i>
                  <span className="text-[15px]">Pré-visualização indisponível</span>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-white shrink-0">
              <a href={viewerMessage.mediaData} download={viewerMessage.fileName || 'download'} target="_blank" rel="noopener noreferrer" className="bg-[#1FA84A] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-green-600 shadow-sm no-underline">
                Descarregar Original
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}