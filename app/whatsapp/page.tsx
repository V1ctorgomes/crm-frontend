'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../dashboard/dashboard.css';
import './whatsapp.css';

export default function WhatsAppPage() {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.replace('/login');
  };

  return (
    <div className="dash-container">
      {/* Sidebar Clear SaaS */}
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

      {/* Conteúdo Principal Focado no Chat */}
      <main className="wa-page-main">
        <div className="wa-app-container">
          
          {/* Coluna Esquerda: Pesquisa e Lista */}
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
                  <div className="wa-chat-preview">O processo já foi finalizado?</div>
                </div>
              </div>

              <div className="wa-chat-item">
                <div className="wa-avatar bg-slate-100">MA</div>
                <div className="wa-chat-info">
                  <div className="wa-chat-header">
                    <span className="wa-chat-name">Maria Almeida</span>
                    <span className="wa-chat-time">Ontem</span>
                  </div>
                  <div className="wa-chat-preview">Muito obrigada pela agilidade!</div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: O Chat */}
          <div className="wa-main">
            <div className="wa-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">JS</div>
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-800">João Silva</h2>
                  <p className="text-[11px] text-green-600 font-medium mt-0.5">Online agora</p>
                </div>
              </div>
              <div className="flex gap-4">
                <i className="bi bi-three-dots text-slate-400 cursor-pointer hover:text-slate-700 text-xl"></i>
              </div>
            </div>

            <div className="wa-messages">
              <div className="wa-msg received">
                Bom dia. Gostaria de verificar o status do meu pedido.
                <span className="wa-time">09:30</span>
              </div>
              <div className="wa-msg sent">
                Olá João! Estamos finalizando a compilação. Ficará pronto em 10 minutos.
                <span className="wa-time">09:35</span>
              </div>
              <div className="wa-msg received">
                Excelente, fico no aguardo. O processo já foi finalizado?
                <span className="wa-time">10:45</span>
              </div>
            </div>

            <div className="wa-input-area">
              <i className="bi bi-paperclip"></i>
              <input type="text" placeholder="Escreva uma mensagem..." />
              <button className="w-11 h-11 rounded-full bg-[#1FA84A] text-white flex items-center justify-center hover:bg-green-600 transition-colors shadow-sm border-none cursor-pointer">
                <i className="bi bi-send-fill !text-white !text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}