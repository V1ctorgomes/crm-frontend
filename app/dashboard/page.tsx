'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './dashboard.css';

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.replace('/login');
  };

  return (
    <div className="dash-container">
      <aside className="dash-sidebar">
        <div className="logo-container flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#1FA84A] flex items-center justify-center">
            <span className="text-white font-bold text-sm">SI</span>
          </div>
          <span className="font-bold text-lg text-slate-800 tracking-tight">Suporte Imagem</span>
        </div>
        
        <nav className="dash-nav">
          <Link href="/dashboard" className="dash-nav-item active">
            <i className="bi bi-grid"></i>
            <span>Visão Geral</span>
          </Link>
          <Link href="/whatsapp" className="dash-nav-item">
            <i className="bi bi-chat-left-text"></i>
            <span>WhatsApp</span>
          </Link>
        </nav>
        
        <div className="mt-auto mb-2 px-2">
          <div className="flex items-center gap-2 mb-4 text-xs text-slate-500 px-3">
             <div className="w-2 h-2 rounded-full bg-green-500"></div>
             Sistema Conectado
          </div>
          <button onClick={handleLogout} className="logout-btn w-full">
            <i className="bi bi-box-arrow-right"></i>
            <span>Terminar Sessão</span>
          </button>
        </div>
      </aside>

      <main className="dash-main">
        <header>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-slate-500 text-sm">Visão geral do seu negócio e métricas recentes.</p>
        </header>

        <div className="saas-grid">
          <div className="saas-card">
            <h3><i className="bi bi-people text-[#1FA84A]"></i> Clientes Ativos</h3>
            <div className="value">1,284</div>
            <div className="mt-2 text-xs text-[#1FA84A] font-medium flex items-center gap-1">
              <i className="bi bi-arrow-up-right"></i> +12% este mês
            </div>
          </div>
          
          <div className="saas-card">
            <h3><i className="bi bi-hdd-network text-[#1FA84A]"></i> Status da API</h3>
            <div className="value text-green-600">Online</div>
            <div className="mt-2 text-xs text-slate-400 font-medium">{process.env.NEXT_PUBLIC_API_URL || 'Produção'}</div>
          </div>
        </div>

        <section className="mt-8 border border-slate-200 bg-white rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[300px] shadow-sm">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
            <i className="bi bi-rocket-takeoff text-2xl text-[#1FA84A]"></i>
          </div>
          <h2 className="text-xl font-bold mb-2 text-slate-800">Infraestrutura Pronta</h2>
          <p className="text-slate-500 text-sm max-w-md">
            Seu ambiente corporativo está rodando perfeitamente no tema claro. Utilize o menu lateral para iniciar os seus atendimentos.
          </p>
        </section>
      </main>
    </div>
  );
}