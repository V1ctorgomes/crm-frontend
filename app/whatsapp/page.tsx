'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../dashboard/dashboard.css'; // Estilo da Sidebar e Layout Base
import './whatsapp.css';             // Estilo específico do WhatsApp

export default function WhatsAppPage() {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax";
    router.replace('/login');
    router.refresh();
  };

  return (
    <div className="dash-container">
      {/* Sidebar Retrátil */}
      <aside className="dash-sidebar">
        <div className="logo-container">
          <Image src="/logo.png" alt="Logo" width={40} height={40} className="object-contain" />
        </div>
        
        <nav className="dash-nav">
          <Link href="/dashboard" className="dash-nav-item">
            <i className="bi bi-grid-1x2-fill"></i>
            <span>Dashboard</span>
          </Link>
          <Link href="/whatsapp" className="dash-nav-item active">
            <i className="bi bi-whatsapp"></i>
            <span>WhatsApp</span>
          </Link>
        </nav>

        <button onClick={handleLogout} className="logout-btn">
          <i className="bi bi-box-arrow-right"></i>
          <span>Sair</span>
        </button>
      </aside>

      {/* Conteúdo Principal */}
      <main className="dash-main">
        <header className="mb-8">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Mensagens</h1>
          <p className="text-slate-400 mt-2 font-medium">Suporte Imagem Atendimento</p>
        </header>

        <div className="whatsapp-window">
          {/* Lista de Contatos */}
          <div className="sidebar-list">
            <div className="search-box">
              <i className="bi bi-search text-slate-400"></i>
              <input type="text" placeholder="Procurar conversa..." />
            </div>
            
            <div className="overflow-y-auto">
              <div className="chat-item active">
                <div className="avatar-circle">JS</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">João Silva</span>
                    <span className="text-[10px] text-slate-400">10:45</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">O orçamento ficou pronto?</p>
                </div>
              </div>
              
              <div className="chat-item">
                <div className="avatar-circle" style={{background: '#cbd5e1'}}>MA</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">Maria Almeida</span>
                    <span className="text-[10px] text-slate-400">Ontem</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">Obrigada pelo retorno!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Área de Chat */}
          <div className="chat-area">
            <div className="chat-header">
              <div className="flex items-center gap-3">
                <div className="avatar-circle" style={{width: '38px', height: '38px', fontSize: '14px'}}>JS</div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">João Silva</h4>
                  <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Online</p>
                </div>
              </div>
              <div className="flex gap-5 text-slate-400">
                <i className="bi bi-search cursor-pointer"></i>
                <i className="bi bi-three-dots-vertical cursor-pointer"></i>
              </div>
            </div>

            <div className="chat-content">
              <div className="msg received">
                Bom dia! Gostaria de saber sobre o status do meu pedido.
                <span className="time">09:30</span>
              </div>
              <div className="msg sent">
                Olá João! Já estamos processando. Envio em breve.
                <span className="time">09:35</span>
              </div>
              <div className="msg received">
                Perfeito, fico no aguardo. O orçamento ficou pronto?
                <span className="time">10:45</span>
              </div>
            </div>

            <div className="chat-input">
              <i className="bi bi-plus-lg"></i>
              <i className="bi bi-emoji-smile"></i>
              <input type="text" placeholder="Digite uma mensagem..." />
              <i className="bi bi-mic-fill"></i>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}