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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, activeContact]);

  // Carrega contatos
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
      } catch (err) {
        console.error("Erro ao carregar contatos:", err);
      }
    };
    fetchContacts();
  }, []);

  // Carrega histórico
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
              senderNumber: m.contactNumber
            }));
            
            setChatHistory(prev => ({
              ...prev,
              [activeContact.number]: formattedMessages
            }));
          }
        } catch (err) {
          console.error("Erro ao carregar histórico:", err);
        }
      };
      fetchHistory();
    }
  }, [activeContact]);

  // SSE (Mensagens ao vivo)
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
          const incomingText = msgData.message?.conversation || msgData.message?.extendedTextMessage?.text || "📷 Mídia/Documento";
          const isFromMe = msgData.key?.fromMe || false;
          const pushName = msgData.pushName || contactNumber;
          const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          const newMessage: Message = {
            id: msgData.key?.id || Date.now(),
            text: incomingText,
            type: isFromMe ? 'sent' : 'received',
            time: timeNow,
            fromMe: isFromMe,
            senderNumber: contactNumber
          };

          setChatHistory(prev => ({
            ...prev,
            [contactNumber]: [...(prev[contactNumber] || []), newMessage]
          }));

          setContacts(prev => {
            const existingIdx = prev.findIndex(c => c.number === contactNumber);
            const updatedContact: Contact = {
              number: contactNumber,
              name: pushName,
              profilePictureUrl: msgData.profilePictureUrl || (existingIdx >= 0 ? prev[existingIdx].profilePictureUrl : undefined),
              lastMessage: incomingText,
              lastMessageTime: timeNow
            };

            if (existingIdx >= 0) {
              const newContacts = [...prev];
              newContacts.splice(existingIdx, 1);
              return [updatedContact, ...newContacts];
            } else {
              return [updatedContact, ...prev];
            }
          });
        }
      } catch (err) {
        console.error("Erro no SSE:", err);
      }
    };
    return () => eventSource.close();
  }, []);

  // Enviar Mensagem
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending || !activeContact) return;

    const newMessageText = inputText;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const targetNumber = activeContact.number;

    const optimisticMsg: Message = { 
      id: Date.now(), text: newMessageText, type: 'sent', time: timeNow, fromMe: true, senderNumber: targetNumber
    };

    setChatHistory(prev => ({ ...prev, [targetNumber]: [...(prev[targetNumber] || []), optimisticMsg] }));
    setInputText('');
    setIsSending(true);

    setContacts(prev => {
      const idx = prev.findIndex(c => c.number === targetNumber);
      if (idx >= 0) {
        const newArray = [...prev];
        newArray[idx].lastMessage = newMessageText;
        newArray[idx].lastMessageTime = timeNow;
        const [moved] = newArray.splice(idx, 1);
        return [moved, ...newArray]; 
      }
      return prev;
    });

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: targetNumber, text: newMessageText })
      });

      if (!response.ok) throw new Error('Falha no envio.');

    } catch (error: any) {
      setErrorBanner(`Erro ao enviar: ${error.message}`);
      setChatHistory(prev => ({
        ...prev,
        [targetNumber]: prev[targetNumber].filter(msg => msg.id !== optimisticMsg.id)
      }));
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax";
    router.replace('/login');
  };

  const activeMessages = activeContact ? (chatHistory[activeContact.number] || []) : [];

  return (
    <div className="dash-container relative flex flex-col md:flex-row">
      
      {/* CABEÇALHO MOBILE */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-2xl text-slate-600">
            <i className="bi bi-list"></i>
          </button>
          <div className="w-8 h-8 rounded bg-[#1FA84A] flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">SI</span>
          </div>
        </div>
      </div>

      {/* OVERLAY ESCURO DO MENU MOBILE */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* MENU LATERAL */}
      <aside className={`dash-sidebar ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex justify-between items-center mb-10">
          <div className="logo-container mb-0 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#1FA84A] flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">SI</span>
            </div>
            <span className="font-bold text-lg text-slate-800">Suporte Imagem</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-2xl text-slate-500">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        
        <nav className="dash-nav">
          <Link href="/dashboard" className="dash-nav-item"><i className="bi bi-grid"></i><span>Visão Geral</span></Link>
          <Link href="/whatsapp" className="dash-nav-item active"><i className="bi bi-chat-left-text"></i><span>WhatsApp</span></Link>
        </nav>
        <div className="mt-auto mb-2 px-2">
          <button onClick={handleLogout} className="logout-btn"><i className="bi bi-box-arrow-right"></i><span>Terminar Sessão</span></button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL (WHATSAPP) */}
      <main className="wa-page-main relative w-full">
        {errorBanner && (
          <div className="absolute top-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3">
            <i className="bi bi-exclamation-triangle-fill text-xl"></i>
            <span className="text-sm font-bold">{errorBanner}</span>
            <button onClick={() => setErrorBanner(null)} className="ml-2"><i className="bi bi-x-lg"></i></button>
          </div>
        )}

        <div className={`wa-app-container ${activeContact ? 'chat-active' : ''}`}>
          
          {/* LISTA DE CONTATOS */}
          <div className="wa-sidebar">
            <div className="wa-search-container">
              <div className="wa-search-box">
                <i className="bi bi-search text-slate-400"></i>
                <input type="text" placeholder="Procurar contatos..." />
              </div>
            </div>
            <div className="wa-chat-list">
              {contacts.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">Nenhuma conversa ativa.</div>
              ) : (
                contacts.map((contact) => (
                  <div key={contact.number} className={`wa-chat-item ${activeContact?.number === contact.number ? 'active' : ''}`} onClick={() => setActiveContact(contact)}>
                    {contact.profilePictureUrl ? (
                      <img src={contact.profilePictureUrl} alt={contact.name} className="wa-avatar object-cover" />
                    ) : (
                      <div className="wa-avatar bg-slate-200 text-slate-600 font-bold text-sm">
                        {contact.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="wa-chat-info">
                      <div className="wa-chat-header">
                        <span className="wa-chat-name">{contact.name}</span>
                        <span className="wa-chat-time">{contact.lastMessageTime}</span>
                      </div>
                      <div className="wa-chat-preview">{contact.lastMessage}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TELA DE CONVERSA */}
          <div className="wa-main">
            {activeContact ? (
              <>
                <div className="wa-header">
                  <div className="flex items-center gap-3">
                    {/* Botão de Voltar para a lista (Só aparece no mobile) */}
                    <button onClick={() => setActiveContact(null)} className="md:hidden mr-2 text-2xl text-slate-500 hover:text-slate-800">
                      <i className="bi bi-arrow-left"></i>
                    </button>
                    {activeContact.profilePictureUrl ? (
                      <img src={activeContact.profilePictureUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">
                        {activeContact.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h2 className="text-[15px] font-semibold text-slate-800">{activeContact.name}</h2>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-slate-500 font-medium">{activeContact.number}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="wa-messages">
                  {activeMessages.map((msg) => (
                    <div key={msg.id} className={`wa-msg ${msg.type}`}>
                      {msg.text}
                      <span className="wa-time">{msg.time}</span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <form className="wa-input-area" onSubmit={handleSendMessage}>
                  <i className="bi bi-paperclip cursor-not-allowed opacity-50"></i>
                  <input type="text" placeholder="Escreva uma mensagem..." value={inputText} onChange={(e) => setInputText(e.target.value)} disabled={isSending} />
                  <button type="submit" disabled={isSending || !inputText.trim()} className="w-11 h-11 rounded-full bg-[#1FA84A] text-white flex items-center justify-center hover:bg-green-600 border-none cursor-pointer disabled:opacity-50">
                    {isSending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <i className="bi bi-send-fill !text-white !text-sm"></i>}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex-col items-center justify-center bg-slate-50 hidden md:flex">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <i className="bi bi-whatsapp text-4xl text-[#1FA84A] opacity-60"></i>
                </div>
                <h2 className="text-xl font-bold text-slate-700">Aguardando Mensagens...</h2>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}