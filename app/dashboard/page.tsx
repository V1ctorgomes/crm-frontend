'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import './dashboard.css';

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax";
    localStorage.removeItem('user');
    router.replace('/login');
    router.refresh();
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  return (
    <div className="dash-container">
      <aside className="dash-sidebar">
        <div className="logo-container">
          <Image src="/logo.png" alt="Suporte Imagem CRM" width={160} height={45} priority />
        </div>
        
        <nav className="dash-nav">
          <a href="#" className="dash-nav-item active"><span className="icon">🏠</span> Início</a>
          <a href="#" className="dash-nav-item"><span className="icon">👥</span> Clientes</a>
          <a href="#" className="dash-nav-item"><span className="icon">🎫</span> Chamados</a>
          <a href="#" className="dash-nav-item"><span className="icon">📊</span> Relatórios</a>
          <a href="#" className="dash-nav-item"><span className="icon">⚙️</span> Configurações</a>
        </nav>

        <button onClick={handleLogout} className="logout-btn">
          🚪 Sair do Sistema
        </button>
      </aside>

      <main className="dash-main">
        <header className="dash-header">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Dashboard</h1>
            <p className="text-slate-500 mt-1">Ambiente Seguro Suporte Imagem</p>
          </div>
          
          <div className="user-badge">
            <div className="avatar">A</div>
            <div className="user-info">
              <p className="username font-bold">Administrador</p>
              <div className="status-container">
                <span className="status-dot"></span>
                <p className="status-text font-bold">Online</p>
              </div>
            </div>
          </div>
        </header>

        <div className="dash-grid">
          <div className="dash-card">
            <h3>Clientes Ativos</h3>
            <div className="value">1.284</div>
            <div className="trend positive">▲ 12.5%</div>
          </div>
          <div className="dash-card">
            <h3>Chamados Críticos</h3>
            <div className="value">08</div>
            <div className="trend warning">● Prioridade Alta</div>
          </div>
          <div className="dash-card">
            <h3>Faturamento Mensal</h3>
            <div className="value">R$ 45.200</div>
            <div className="trend positive">▲ 5.2%</div>
          </div>
        </div>

        <section className="welcome-banner">
          <div className="welcome-icon">✨</div>
          <h2 className="text-2xl font-black mb-2">Interface de Alta Performance</h2>
          <p className="text-slate-500">
            Conectado com sucesso à infraestrutura de produção: <br/>
            <code className="mt-4 inline-block">{API_URL || 'api.suporteimagem.com'}</code>
          </p>
          <button className="action-button">
            Explorar Base de Dados
          </button>
        </section>
      </main>
    </div>
  );
}