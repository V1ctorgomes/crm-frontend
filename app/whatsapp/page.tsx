'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../dashboard/dashboard.css';
import './whatsapp.css';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({});

  // ==========================================
  // ESTADOS PARA PRÉ-VISUALIZAÇÃO DE MÍDIA
  // ==========================================
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        } catch (err) { console.error("Erro ao carregar histórico:", err); }
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
          const incomingText = msgData.message?.conversation || msgData.message?.extendedTextMessage?.text || "📷 Mídia recebida";
          const isFromMe = msgData.key?.fromMe || false;
          const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          const newMessage: Message = {
            id: msgData.key?.id || Date.now(), text: incomingText, type: isFromMe ? 'sent' : 'received',
            time: timeNow, fromMe: isFromMe, senderNumber: contactNumber
          };

          setChatHistory(prev => ({ ...prev, [contactNumber]: [...(prev[contactNumber] || []), newMessage] }));
        }
      } catch (err) {}
    };
    return () => eventSource.close();
  }, []);

  // Ao selecionar um arquivo, não envia de imediato. Apenas abre o painel de Preview.
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeContact) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorBanner("O arquivo é muito grande (máximo 15MB).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewBase64(reader.result as string);
      setPreviewFile(file);
    };
    reader.readAsDataURL(file);
  };

  const cancelPreview = () => {
    setPreviewFile(null);
    setPreviewBase64(null);
    setInputText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Função Unificada de Envio (Lida com Texto Normal E Arquivo com Legenda)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSending || !activeContact) return;
    if (!inputText.trim() && !previewFile) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const targetNumber = activeContact.number;
    const textToSend = inputText;

    setIsSending(true);

    if (previewFile && previewBase64) {
      // ENVIANDO MÍDIA COM LEGENDA
      const fileToSend = previewFile;
      const base64ToSend = previewBase64;

      const optimisticMsg: Message = { 
        id: Date.now(), text: textToSend, type: 'sent', time: timeNow, fromMe: true, senderNumber: targetNumber,
        isMedia: true, mediaData: base64ToSend, mimeType: fileToSend.type, fileName: fileToSend.name
      };

      setChatHistory(prev => ({ ...prev, [targetNumber]: [...(prev[targetNumber] || []), optimisticMsg] }));
      
      // Limpa os estados de preview imediatamente para voltar ao chat
      setInputText('');
      setPreviewFile(null);
      setPreviewBase64(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
        await fetch(`${baseUrl}/whatsapp/send-media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            number: targetNumber, 
            base64Data: base64ToSend, 
            fileName: fileToSend.name, 
            mimeType: fileToSend.type,
            caption: textToSend // Aqui enviamos a legenda para o backend
          })
        });
      } catch (error) {
        setErrorBanner("Erro ao enviar arquivo.");
      } finally {
        setIsSending(false);
      }
    } else {
      // ENVIANDO APENAS TEXTO
      const optimisticMsg: Message = { 
        id: Date.now(), text: textToSend, type: 'sent', time: timeNow, fromMe: true, senderNumber: targetNumber
      };

      setChatHistory(prev => ({ ...prev, [targetNumber]: [...(prev[targetNumber] || []), optimisticMsg] }));
      setInputText('');

      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
        await fetch(`${baseUrl}/whatsapp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number: targetNumber, text: textToSend })
        });
      } catch (error) {
        setErrorBanner("Erro ao enviar mensagem.");
      } finally { setIsSending(false); }
    }
  };

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.replace('/login');
  };

  const activeMessages = activeContact ? (chatHistory[activeContact.number] || []) : [];

  return (
    <div className="dash-container relative flex flex-col md:flex-row">
      <div className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40">
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-2xl text-slate-600"><i className="bi bi-list"></i></button>
        <span className="font-bold text-[#1FA84A]">Suporte Imagem</span>
      </div>

      <aside className={`dash-sidebar ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300`}>
        <div className="flex justify-between items-center mb-10">
          <div className="logo-container mb-0 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#1FA84A] flex items-center justify-center text-white font-bold text-sm">SI</div>
            <span className="font-bold text-lg text-slate-800">Suporte Imagem</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-2xl text-slate-500"><i className="bi bi-x-lg"></i></button>
        </div>
        <nav className="dash-nav">
          <Link href="/dashboard" className="dash-nav-item"><i className="bi bi-grid"></i><span>Visão Geral</span></Link>
          <Link href="/whatsapp" className="dash-nav-item active"><i className="bi bi-chat-left-text"></i><span>WhatsApp</span></Link>
        </nav>
        <button onClick={handleLogout} className="logout-btn mt-auto"><i className="bi bi-box-arrow-right"></i><span>Sair</span></button>
      </aside>

      <main className="wa-page-main w-full relative">
        {errorBanner && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-xl z-[60] flex gap-2">
            <i className="bi bi-exclamation-circle"></i> {errorBanner}
            <button onClick={() => setErrorBanner(null)} className="ml-2 font-bold">X</button>
          </div>
        )}

        <div className={`wa-app-container relative ${activeContact ? 'chat-active' : ''}`}>
          
          <div className="wa-sidebar">
            <div className="wa-search-container">
              <div className="wa-search-box">
                <i className="bi bi-search text-slate-400"></i>
                <input type="text" placeholder="Procurar ou iniciar conversa" />
              </div>
            </div>
            <div className="wa-chat-list">
              {contacts.map((contact) => (
                <div key={contact.number} className={`wa-chat-item ${activeContact?.number === contact.number ? 'active' : ''}`} onClick={() => setActiveContact(contact)}>
                  {contact.profilePictureUrl ? (
                    <img src={contact.profilePictureUrl} className="wa-avatar" alt="avatar" />
                  ) : (
                    <div className="wa-avatar bg-slate-200 flex items-center justify-center font-bold">{contact.name.substring(0, 2).toUpperCase()}</div>
                  )}
                  <div className="wa-chat-info">
                    <div className="wa-chat-header">
                      <span className="wa-chat-name">{contact.name}</span>
                      <span className="wa-chat-time">{contact.lastMessageTime}</span>
                    </div>
                    <div className="wa-chat-preview">{contact.lastMessage}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="wa-main relative">
            {activeContact ? (
              <>
                <div className="wa-header z-10">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setActiveContact(null)} className="md:hidden text-2xl text-slate-500 mr-2"><i className="bi bi-arrow-left"></i></button>
                    {activeContact.profilePictureUrl ? (
                      <img src={activeContact.profilePictureUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold">{activeContact.name.substring(0,2)}</div>
                    )}
                    <div>
                      <h2 className="text-[15px] font-semibold">{activeContact.name}</h2>
                      <span className="text-[11px] text-slate-500">{activeContact.number}</span>
                    </div>
                  </div>
                </div>

                {/* OVERLAY DE PRÉ-VISUALIZAÇÃO (SÓ APARECE SE TIVER ARQUIVO SELECIONADO) */}
                {previewFile && previewBase64 && (
                  <div className="absolute inset-0 top-[70px] bg-slate-100 z-30 flex flex-col items-center justify-between">
                    {/* Botão de Fechar/Cancelar */}
                    <div className="w-full flex justify-between p-4">
                      <button onClick={cancelPreview} className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center text-slate-700 hover:bg-black/20 text-xl transition-colors">
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>

                    {/* Exibição do Arquivo a Enviar */}
                    <div className="flex-1 flex flex-col items-center justify-center w-full px-4 overflow-hidden">
                      {previewFile.type.startsWith('image/') ? (
                        <img src={previewBase64} alt="Preview" className="max-h-80 md:max-h-96 rounded-lg shadow-md object-contain" />
                      ) : (
                        <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col items-center">
                          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                             <i className="bi bi-file-earmark-pdf-fill text-5xl text-red-500"></i>
                          </div>
                          <h3 className="font-bold text-slate-800 text-lg text-center break-all">{previewFile.name}</h3>
                          <span className="text-sm font-medium text-slate-400 mt-2">
                            {previewFile.type.includes('pdf') ? 'Documento PDF' : 'Documento'} • {(previewFile.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Barra de Digitar Legenda (Baseada na interface nativa do app) */}
                    <div className="w-full bg-[#f0f2f5] p-4 flex items-center justify-center shrink-0">
                       <div className="w-full max-w-2xl flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Adicione uma legenda..." 
                            className="flex-1 bg-white border-none rounded-xl px-4 py-3 text-[15px] outline-none shadow-sm"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter') handleSendMessage() }}
                            autoFocus
                          />
                          <button 
                            onClick={handleSendMessage} 
                            disabled={isSending}
                            className="w-12 h-12 rounded-full bg-[#1FA84A] text-white flex items-center justify-center shadow-md shrink-0"
                          >
                            {isSending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <i className="bi bi-send-fill"></i>}
                          </button>
                       </div>
                    </div>
                  </div>
                )}

                <div className="wa-messages">
                  {activeMessages.map((msg) => (
                    <div key={msg.id} className={`wa-msg relative ${msg.type}`}>
                      
                      {/* LÓGICA DE RENDERIZAÇÃO DE MÍDIA ATUALIZADA (IGUAL À FOTO) */}
                      {msg.isMedia && msg.mediaData && (
                        <div className="mb-1 flex flex-col w-full">
                          {msg.mimeType?.startsWith('image/') ? (
                            <img src={msg.mediaData} className="max-w-full rounded-md max-h-64 object-contain mb-1" alt="media" />
                          ) : msg.mimeType?.startsWith('video/') ? (
                            <video src={msg.mediaData} controls className="max-w-full rounded-md max-h-64 mb-1" />
                          ) : (
                            /* CAIXA DO DOCUMENTO EXATAMENTE COMO NA FOTO */
                            <>
                              <div className={`flex items-center gap-3 p-3 rounded-lg ${msg.type === 'sent' ? 'bg-[#c6efc1]' : 'bg-black/5'} mb-2`}>
                                <div className="w-11 h-11 bg-[#fce4e4] rounded-lg flex items-center justify-center shrink-0">
                                  <i className="bi bi-file-earmark-pdf-fill text-red-500 text-2xl"></i>
                                </div>
                                <div className="flex flex-col overflow-hidden w-full">
                                  <span className="text-[15px] font-bold text-slate-800 truncate leading-tight">{msg.fileName || 'Documento'}</span>
                                  <span className="text-[13px] text-slate-500 font-medium mt-0.5">
                                    {msg.mimeType?.includes('pdf') ? 'PDF' : 'DOCUMENTO'}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* TEXTO / LEGENDA (A legenda aparece logo abaixo do quadro gris do doc) */}
                      {msg.text && (
                        <p className={`text-[14.5px] text-slate-800 leading-snug break-words ${msg.isMedia && !msg.mimeType?.startsWith('image/') && !msg.mimeType?.startsWith('video/') ? 'mb-2' : ''}`}>
                          {msg.text}
                        </p>
                      )}

                      {/* BOTÕES ABRIR / BAIXAR E HORA (Aparecem no final do documento) */}
                      {msg.isMedia && !msg.mimeType?.startsWith('image/') && !msg.mimeType?.startsWith('video/') && (
                        <div className={`flex items-center justify-between pt-2 mt-1 border-t ${msg.type === 'sent' ? 'border-[#b2dcb0]' : 'border-black/5'}`}>
                           <div className="flex gap-2 text-[13.5px] font-bold text-[#14833b]">
                             <a href={msg.mediaData} target="_blank" rel="noreferrer" className="hover:underline cursor-pointer">Abrir</a>
                             <span className="text-slate-400 font-normal">/</span>
                             <a href={msg.mediaData} download={msg.fileName} className="hover:underline cursor-pointer">baixar</a>
                           </div>
                           <span className="wa-time !mt-0">{msg.time} <i className="bi bi-check-all text-[#34B7F1] ml-0.5"></i></span>
                        </div>
                      )}
                      
                      {/* HORA NORMAL (Para textos e imagens simples) */}
                      {!(msg.isMedia && !msg.mimeType?.startsWith('image/') && !msg.mimeType?.startsWith('video/')) && (
                        <span className="wa-time">
                          {msg.time}
                          {msg.fromMe && <i className="bi bi-check-all text-[#34B7F1] ml-1 text-[13px]"></i>}
                        </span>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <form className="wa-input-area" onSubmit={handleSendMessage}>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf,video/*" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                    <i className="bi bi-paperclip text-2xl"></i>
                  </button>
                  <input type="text" placeholder="Escreva uma mensagem..." value={inputText} onChange={(e) => setInputText(e.target.value)} disabled={isSending} />
                  <button type="submit" disabled={isSending || !inputText.trim()} className="w-11 h-11 rounded-full bg-[#1FA84A] text-white flex items-center justify-center disabled:opacity-50">
                    {isSending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <i className="bi bi-send-fill"></i>}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-slate-50">
                <i className="bi bi-whatsapp text-6xl text-slate-200 mb-4"></i>
                <h2 className="text-xl font-bold text-slate-400">Selecione uma conversa</h2>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );

  
}