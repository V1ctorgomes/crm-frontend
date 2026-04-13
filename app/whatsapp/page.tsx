'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../dashboard/dashboard.css';
import './whatsapp.css';

export default function WhatsAppPage() {
  const router = useRouter();
  
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  
  const [messages, setMessages] = useState([
    { id: 1, text: 'Sessão de atendimento segura iniciada.', type: 'received', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);

  // ⚠️ ATENÇÃO: COLOQUE AQUI O SEU NÚMERO DE TESTE COM DDI E DDD (Ex: 5511999999999)
  const DESTINATION_NUMBER = "5511999999999"; 

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax";
    router.replace('/login');
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setErrorBanner(null);
    const newMessageText = inputText;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Atualiza a UI imediatamente (Optimistic Update - Padrão de Produção)
    const newMsg = { id: Date.now(), text: newMessageText, type: 'sent', time: timeNow };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setIsSending(true);

    try {
      // Garante que a URL da API não tem barra no final para evitar erros 404 (ex: http://site.com//whatsapp)
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

      const response = await fetch(`${baseUrl}/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }) // Envia o token se existir
        },
        body: JSON.stringify({
          number: DESTINATION_NUMBER,
          text: newMessageText
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro do Servidor (${response.status})`);
      }

    } catch (error: any) {
      console.error('Erro de Envio:', error);
      setErrorBanner(`Falha no envio: ${error.message}`);
      // Remove a mensagem da tela se falhar
      setMessages((prev) => prev.filter(msg => msg.id !== newMsg.id));
    } finally {
      setIsSending(false);
    }
  };

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
        {/* Banner de Erro Flutuante Profissional */}
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
          <div className="wa-sidebar">
            <div className="wa-search-container">
              <div className="wa-search-box">
                <i className="bi bi-search text-slate-400"></i>
                <input type="text" placeholder="Procurar contatos..." disabled />
              </div>
            </div>
            
            <div className="wa-chat-list">
              <div className="wa-chat-item active">
                <div className="wa-avatar bg-green-100 text-green-700">SI</div>
                <div className="wa-chat-info">
                  <div className="wa-chat-header">
                    <span className="wa-chat-name">Canal de Teste API</span>
                    <span className="wa-chat-time text-green-600 font-medium">Agora</span>
                  </div>
                  <div className="wa-chat-preview">Ambiente de Produção</div>
                </div>
              </div>
            </div>
          </div>

          <div className="wa-main">
            <div className="wa-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">SI</div>
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-800">Conexão Evolution API</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1FA84A] animate-pulse"></div>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Online</span>
                  </div>
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
          </div>
        </div>
      </main>
    </div>
  );
}