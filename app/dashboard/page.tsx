'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './dashboard.css';

export default function DashboardPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax";
    router.replace('/login');
  };

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
          <Link href="/dashboard" className="dash-nav-item active"><i className="bi bi-grid"></i><span>Visão Geral</span></Link>
          <Link href="/whatsapp" className="dash-nav-item"><i className="bi bi-chat-left-text"></i><span>WhatsApp</span></Link>
        </nav>
        <div className="mt-auto mb-2 px-2">
          <button onClick={handleLogout} className="logout-btn"><i className="bi bi-box-arrow-right"></i><span>Terminar Sessão</span></button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DO DASHBOARD */}
      <main className="dash-main w-full">
        <h1 className="page-title">Visão Geral</h1>
        <p className="text-slate-500 text-sm">Bem-vindo ao seu painel de controlo.</p>

        <div className="saas-grid">
          <div className="saas-card">
            <h3><i className="bi bi-people text-[#1FA84A]"></i> Clientes Ativos</h3>
            <div className="value">0</div>
          </div>
          <div className="saas-card">
            <h3><i className="bi bi-chat-dots text-[#1FA84A]"></i> Mensagens Hoje</h3>
            <div className="value">0</div>
          </div>
        </div>
      </main>
    </div>
  );
}