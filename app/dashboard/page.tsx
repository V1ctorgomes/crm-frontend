'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import './dashboard.css';

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax";
    router.replace('/login');
    router.refresh();
  };

  return (
    <div className="dash-container">
      {/* Sidebar Retrátil com Hover */}
      <aside className="dash-sidebar">
        <div className="logo-container">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={40} 
            height={40} 
            className="object-contain"
          />
        </div>
        
        <nav className="dash-nav">
          <a href="#" className="dash-nav-item active">
            <i className="bi bi-grid-1x2-fill"></i>
            <span>Dashboard</span>
          </a>
          <a href="#" className="dash-nav-item">
            <i className="bi bi-whatsapp"></i>
            <span>WhatsApp</span>
          </a>
        </nav>

        <button onClick={handleLogout} className="logout-btn">
          <i className="bi bi-box-arrow-right"></i>
          <span>Sair</span>
        </button>
      </aside>

      {/* Conteúdo Principal */}
      <main className="dash-main">
        <header className="dash-header">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-800">Visão Geral</h1>
            <p className="text-slate-400 mt-2 font-medium">CRM Suporte Imagem</p>
          </div>
        </header>

        <div className="dash-grid">
          <div className="dash-card">
            <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">Métricas de Hoje</h3>
            <div className="text-3xl font-black text-slate-800">1.284</div>
            <p className="text-green-500 text-sm font-bold mt-2">Atividade Estável</p>
          </div>
          
          <div className="dash-card">
            <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">Status da API</h3>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xl font-bold text-slate-700">Conectado</span>
            </div>
            <p className="text-slate-400 text-sm mt-2">{process.env.NEXT_PUBLIC_API_URL}</p>
          </div>
        </div>

        {/* Área Minimalista de Conteúdo */}
        <section className="mt-12 p-10 bg-white/30 backdrop-blur-md rounded-[32px] border border-white/50 text-center min-h-[300px] flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-800">Selecione uma ferramenta no menu lateral</h2>
          <p className="text-slate-500 mt-4 max-w-md mx-auto">
            Utilize o menu minimalista à esquerda para navegar entre o painel de controle e a gestão de WhatsApp.
          </p>
        </section>
      </main>
    </div>
  );
}