'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../dashboard/dashboard.css';
import './whatsapp.css';

export default function WhatsAppPage() {
  const router = useRouter();
  
  // Estado para controlar o input e as mensagens na tela
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: 'Bom dia. Gostaria de verificar o status do meu pedido.', type: 'received', time: '09:30' }
  ]);

  // Número temporário para teste (coloque um número real seu com DDI, ex: 5511999999999)
  const currentContactNumber = "5511999999999"; 

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.replace('/login');
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const newMessageText = inputText;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Adiciona a mensagem imediatamente na tela (Optmistic UI)
    const newMsg = { id: Date.now(), text: newMessageText, type: 'sent', time: timeNow };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setIsSending(true);

    try {
      // Pega o token para provar pro backend que estamos logados
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      // 2. Manda para o NOSSO backend (que vai mandar pra Evolution)
      const response = await fetch(`${apiUrl}/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          number: currentContactNumber,
          text: newMessageText
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar mensagem');
      }

    } catch (error) {
      console.error(error);
      alert('Erro ao enviar mensagem. Verifique se o Backend e a Evolution estão rodando.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="dash-container">
      {/* Sidebar igual a anterior ... */}
      <aside className="dash-sidebar">
        <div className="logo-container flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#1FA84A] flex items-center justify-center">
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

      <main className="wa-page-main">
        <div className="wa-app-container">
          
          <div className="wa-sidebar">
            <div className="wa-search-container">
              <div className="wa-search-box">
                <i className="bi bi-search text-slate-400"></i>
                <input type="text" placeholder="Procurar contatos..." />
              </div>
            </div>
            
            <div className="wa-chat-list">
              <div className="wa-chat-item active">
                <div className="wa-avatar bg-green-100 text-green-700">JS</div>
                <div className="wa-chat-info">
                  <div className="wa-chat-header">
                    <span className="wa-chat-name">João Silva</span>
                    <span className="wa-chat-time text-green-600 font-medium">10:45</span>
                  </div>
                  <div className="wa-chat-preview">Chat ativo de testes</div>
                </div>
              </div>
            </div>
          </div>

          <div className="wa-main">
            <div className="wa-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">JS</div>
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-800">João Silva (Teste)</h2>
                  <p className="text-[11px] text-green-600 font-medium mt-0.5">Online</p>
                </div>
              </div>
            </div>

            <div className="wa-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`wa-msg ${msg.type}`}>
                  {msg.text}
                  <span className="wa-time">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* O form permite enviar apertando "Enter" no teclado */}
            <form className="wa-input-area" onSubmit={handleSendMessage}>
              <i className="bi bi-paperclip"></i>
              <input 
                type="text" 
                placeholder="Escreva uma mensagem..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isSending}
              />
              <button 
                type="submit"
                disabled={isSending || !inputText.trim()}
                className="w-11 h-11 rounded-full bg-[#1FA84A] text-white flex items-center justify-center hover:bg-green-600 transition-colors shadow-sm border-none cursor-pointer disabled:opacity-50"
              >
                <i className="bi bi-send-fill !text-white !text-sm"></i>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}