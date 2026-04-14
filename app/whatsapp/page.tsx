'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../dashboard/dashboard.css';
import './whatsapp.css';

// Interface para estruturar como uma mensagem é guardada no estado
interface Message {
  id: string | number;
  text: string;
  type: 'sent' | 'received';
  time: string;
  fromMe: boolean;
  senderNumber: string;
}

// Interface para estruturar os contatos na barra lateral
interface Contact {
  number: string;
  name: string;
  profilePictureUrl?: string;
  lastMessage: string;
  lastMessageTime: string;
}

export default function WhatsAppPage() {
  const router = useRouter();
  
  // ==========================================
  // ESTADOS (STATE) DO CHAT
  // ==========================================
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({});

  // Ref para rolar o chat para o fim automaticamente
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, activeContact]);

  // ==========================================
  // LISTENER: ESCUTAR MENSAGENS AO VIVO (SSE)
  // ==========================================
  useEffect(() => {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
    const eventSource = new EventSource(`${baseUrl}/whatsapp/stream`);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log("🚨 CHEGOU NO FRONTEND:", payload);
        
        // Verifica se o evento é de nova mensagem (Suporta a nova estrutura da Evolution v2)
        if (payload?.event === 'messages.upsert') {
          
          const msgData = payload.data?.message || payload.data?.messages?.[0];

          if (!msgData) return;

          const incomingText = msgData.message?.conversation || msgData.message?.extendedTextMessage?.text || "📷 Imagem/Áudio/Documento";
          const senderJid = msgData.key?.remoteJid;
          
          if (!senderJid) return;
          
          const senderNumber = senderJid.split('@')[0]; // Extrai só o número (ex: 5511999999999)
          const isFromMe = msgData.key?.fromMe;
          const pushName = msgData.pushName || senderNumber; // Pega o nome do contato ou o número
          const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          // Ignora atualizações de status ou grupos
          if (senderJid.includes('@g.us') || senderJid === 'status@broadcast') return;

          // 1. Guarda a mensagem no histórico do contato
          const newMessage: Message = {
            id: msgData.key?.id || Date.now(),
            text: incomingText,
            type: isFromMe ? 'sent' : 'received',
            time: timeNow,
            fromMe: isFromMe,
            senderNumber: senderNumber
          };

          setChatHistory(prev => ({
            ...prev,
            [senderNumber]: [...(prev[senderNumber] || []), newMessage]
          }));

          // 2. Atualiza a lista lateral de contatos
          setContacts(prev => {
            const existingContactIndex = prev.findIndex(c => c.number === senderNumber);
            const picUrl = payload.data?.profilePictureUrl || undefined;

            const updatedContact: Contact = {
              number: senderNumber,
              name: pushName,
              profilePictureUrl: picUrl,
              lastMessage: incomingText,
              lastMessageTime: timeNow
            };

            if (existingContactIndex >= 0) {
              const newContacts = [...prev];
              newContacts.splice(existingContactIndex, 1);
              return [updatedContact, ...newContacts]; // Move para o topo
            } else {
              return [updatedContact, ...prev]; // Adiciona novo contato no topo
            }
          });

          // 3. Se for a primeira mensagem e não houver conversa aberta, abre automaticamente
          if (!isFromMe) {
             setActiveContact(prev => {
                if (!prev) {
                  return {
                    number: senderNumber,
                    name: pushName,
                    lastMessage: incomingText,
                    lastMessageTime: timeNow
                  };
                }
                return prev;
             });
          }
        }
      } catch (err) {
        console.error("Erro ao processar a mensagem recebida:", err);
      }
    };

    return () => eventSource.close();
  }, []);

  // ==========================================
  // FUNÇÃO: ENVIAR MENSAGEM
  // ==========================================
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending || !activeContact) return;

    setErrorBanner(null);
    const newMessageText = inputText;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const targetNumber = activeContact.number;

    // Atualiza a tela imediatamente (Optimistic UI) para parecer super rápido
    const optimisticMsg: Message = { 
      id: Date.now(), 
      text: newMessageText, 
      type: 'sent', 
      time: timeNow,
      fromMe: true,
      senderNumber: targetNumber
    };

    setChatHistory(prev => ({
      ...prev,
      [targetNumber]: [...(prev[targetNumber] || []), optimisticMsg]
    }));
    
    setInputText('');
    setIsSending(true);

    // Atualiza o resumo do Contato na barra lateral
    setContacts(prev => {
      const idx = prev.findIndex(c => c.number === targetNumber);
      if (idx >= 0) {
        const newArray = [...prev];
        newArray[idx].lastMessage = newMessageText;
        newArray[idx].lastMessageTime = timeNow;
        const [moved] = newArray.splice(idx, 1);
        return [moved, ...newArray]; // Move para o topo
      }
      return prev;
    });

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

      const response = await fetch(`${baseUrl}/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          number: targetNumber,
          text: newMessageText
        })
      });

      if (!response.ok) {
        throw new Error('Falha no envio (Erro da API). O número pode estar inválido.');
      }

    } catch (error: any) {
      setErrorBanner(`Erro ao enviar: ${error.message}`);
      // Remove a mensagem da tela se falhar o envio real
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

  // Carrega as mensagens apenas da pessoa que está selecionada
  const activeMessages = activeContact ? (chatHistory[activeContact.number] || []) : [];

  return (
    <div className="dash-container">
      <aside className="dash-sidebar">
        <div className="logo-container flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#1FA84A] flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">SI</span>
          </div>
          <span className="font-bold text-lg text-slate-800 tracking-tight">Suporte Imagem</span>
        </div>
        
        <nav className="dash-nav">
          <Link href="/dashboard" className="dash-nav-item">
            <i className="bi bi-grid"></i>
            <span>Visão Geral</span>
          </Link>
          <Link href="/whatsapp" className="dash-nav-item active">
            <i className="bi bi-chat-left-text"></i>
            <span>WhatsApp</span>
          </Link>
        </nav>
        
        <div className="mt-auto mb-2 px-2">
          <button onClick={handleLogout} className="logout-btn w-full">
            <i className="bi bi-box-arrow-right"></i>
            <span>Terminar Sessão</span>
          </button>
        </div>
      </aside>

      <main className="wa-page-main relative">
        {errorBanner && (
          <div className="absolute top-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span className="text-sm font-medium">{errorBanner}</span>
            <button onClick={() => setErrorBanner(null)} className="ml-2 text-red-400 hover:text-red-700">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        )}

        <div className="wa-app-container">
          
          {/* ======================================= */}
          {/* BARRA LATERAL: LISTA DE CONTATOS        */}
          {/* ======================================= */}
          <div className="wa-sidebar">
            <div className="wa-search-container">
              <div className="wa-search-box">
                <i className="bi bi-search text-slate-400"></i>
                <input type="text" placeholder="Procurar contatos..." />
              </div>
            </div>
            
            <div className="wa-chat-list">
              {contacts.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">
                  Nenhuma conversa ativa. <br/><br/>Envie uma mensagem do seu telemóvel para a API para iniciar um chat.
                </div>
              ) : (
                contacts.map((contact) => (
                  <div 
                    key={contact.number}
                    className={`wa-chat-item ${activeContact?.number === contact.number ? 'active' : ''}`}
                    onClick={() => setActiveContact(contact)}
                  >
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
                        <span className="wa-chat-time text-slate-500 font-medium">{contact.lastMessageTime}</span>
                      </div>
                      <div className="wa-chat-preview">{contact.lastMessage}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ======================================= */}
          {/* JANELA DE CHAT PRINCIPAL                */}
          {/* ======================================= */}
          <div className="wa-main">
            {activeContact ? (
              <>
                <div className="wa-header">
                  <div className="flex items-center gap-3">
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
                  <input 
                    type="text" 
                    placeholder="Escreva uma mensagem..." 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isSending}
                    autoFocus
                  />
                  <button 
                    type="submit"
                    disabled={isSending || !inputText.trim()}
                    className="w-11 h-11 rounded-full bg-[#1FA84A] text-white flex items-center justify-center hover:bg-green-600 transition-colors shadow-sm border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <i className="bi bi-send-fill !text-white !text-sm"></i>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <i className="bi bi-whatsapp text-4xl text-[#1FA84A] opacity-60"></i>
                </div>
                <h2 className="text-xl font-bold text-slate-700">Bem-vindo ao Atendimento</h2>
                <p className="text-slate-500 text-sm mt-2 text-center max-w-sm">
                  O sistema está conectado e pronto. <br/>As mensagens recebidas aparecerão no menu lateral esquerdo.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}