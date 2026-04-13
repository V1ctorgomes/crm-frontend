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
      {/* Sidebar SaaS */}
      <aside className="dash-sidebar">
        <div className="logo-container flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#22c55e] flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.4)]">
            <span className="text-white font-bold text-sm">SI</span>
          </div>
          <span className="font-bold text-lg tracking-tight">Suporte Imagem</span>
        </div>
        
        <nav className="dash-nav">
          <Link href="/dashboard" className="dash-nav-item">
            <i className="bi bi-grid-fill"></i>
            <span>Overview</span>
          </Link>
          <Link href="/whatsapp" className="dash-nav-item active">
            <i className="bi bi-chat-left-text-fill"></i>
            <span>WhatsApp</span>
          </Link>
        </nav>
        
        <div className="mt-auto mb-4 px-2">
          <button onClick={handleLogout} className="logout-btn w-full">
            <i className="bi bi-box-arrow-right"></i>
            <span>Terminar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="dash-main">
        <header className="mb-8">
          <h1 className="page-title">Painel de Comunicação</h1>
          <p className="text-[#a1a1aa] text-sm">Gestor de atendimento encriptado ponta-a-ponta.</p>
        </header>

        <div className="wa-app-container">
          {/* Coluna Esquerda: Pesquisa e Lista */}
          <div className="wa-sidebar">
            <div className="wa-search-container">
              <div className="wa-search-box">
                <i className="bi bi-search text-[#a1a1aa]"></i>
                <input type="text" placeholder="Procurar ID, Nome ou Ticket..." />
              </div>
            </div>
            
            <div className="wa-chat-list">
              <div className="wa-chat-item active">
                <div className="wa-avatar !bg-[#22c55e] !text-black">JS</div>
                <div className="wa-chat-info">
                  <div className="wa-chat-header">
                    <span className="wa-chat-name">João Silva</span>
                    <span className="wa-chat-time text-[#22c55e]">10:45</span>
                  </div>
                  <div className="wa-chat-preview">A imagem de sistema está finalizada?</div>
                </div>
              </div>

              <div className="wa-chat-item">
                <div className="wa-avatar">MA</div>
                <div className="wa-chat-info">
                  <div className="wa-chat-header">
                    <span className="wa-chat-name text-[#a1a1aa]">Maria Almeida</span>
                    <span className="wa-chat-time">Ontem</span>
                  </div>
                  <div className="wa-chat-preview">Obrigada pelo suporte de excelência.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: O Chat */}
          <div className="wa-main">
            <div className="wa-header">
              <div className="flex items-center gap-3">
                <div className="wa-avatar !w-8 !h-8 !text-xs !bg-[#22c55e] !text-black">JS</div>
                <div>
                  <h2 className="text-sm font-semibold text-[#fafafa]">João Silva</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]"></div>
                    <span className="text-[10px] text-[#a1a1aa] uppercase tracking-wider font-mono">Sessão Ativa</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <i className="bi bi-three-dots text-[#a1a1aa] cursor-pointer hover:text-[#fafafa]"></i>
              </div>
            </div>

            <div className="wa-messages">
              <div className="wa-msg received">
                Bom dia. Gostaria de verificar o status do ticket #4092.
                <span className="wa-time">09:30</span>
              </div>
              <div className="wa-msg sent">
                Olá João. O processo está em compilação final. Estará pronto em 10 minutos.
                <span className="wa-time">09:35</span>
              </div>
              <div className="wa-msg received">
                Excelente. Fico a aguardar a aprovação do ficheiro.
                <span className="wa-time">10:45</span>
              </div>
            </div>

            <div className="wa-input-area">
              <i className="bi bi-paperclip"></i>
              <input type="text" placeholder="Escreva um comando ou mensagem..." />
              <button className="w-10 h-10 rounded bg-[#22c55e] text-black flex items-center justify-center hover:bg-[#16a34a] transition-colors">
                <i className="bi bi-send-fill !text-black"></i>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}