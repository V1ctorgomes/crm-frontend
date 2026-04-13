'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import './dashboard.css';

export default function DashboardPage() {
  const router = useRouter();

  // Função de Logout para Produção
  const handleLogout = () => {
    // 1. Limpa o cookie do token (essencial para o Middleware barrar o acesso)
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax";
    
    // 2. Limpa dados residuais se existirem
    localStorage.removeItem('user');
    
    // 3. Redireciona e limpa o cache do Next.js
    router.replace('/login');
    router.refresh();
  };

  // URL da API vinda das variáveis de ambiente
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  return (
    <div className="dash-container">
      {/* Sidebar Lateral */}
      <aside className="dash-sidebar">
        <div className="logo-container">
          <Image 
            src="/logo.png" 
            alt="Suporte Imagem CRM" 
            width={160} 
            height={45} 
            priority 
          />
        </div>
        
        <nav className="dash-nav">
          <a href="#" className="dash-nav-item active">
            <span className="icon">🏠</span> Início
          </a>
          <a href="#" className="dash-nav-item">
            <span className="icon">👥</span> Clientes
          </a>
          <a href="#" className="dash-nav-item">
            <span className="icon">🎫</span> Chamados
          </a>
          <a href="#" className="dash-nav-item">
            <span className="icon">📊</span> Relatórios
          </a>
          <a href="#" className="dash-nav-item">
            <span className="icon">⚙️</span> Configurações
          </a>
        </nav>

        <button onClick={handleLogout} className="logout-btn">
          <span>🚪</span> Sair do Sistema
        </button>
      </aside>

      {/* Conteúdo Principal */}
      <main className="dash-main">
        <header className="dash-header">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Dashboard</h1>
            <p className="text-slate-500 mt-1">Bem-vindo à Suporte Imagem</p>
          </div>
          
          <div className="user-badge">
            <div className="avatar">A</div>
            <div className="user-info">
              <p className="username">Administrador</p>
              <div className="status-container">
                <span className="status-dot"></span>
                <p className="status-text">Online</p>
              </div>
            </div>
          </div>
        </header>

        {/* Grid de Estatísticas Dinâmicas */}
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

        {/* Área Central de Boas-vindas */}
        <section className="welcome-banner">
          <div className="welcome-icon">✨</div>
          <h2>Ambiente de Produção Ativo</h2>
          <p>
            As rotas estão protegidas e a API configurada para: <br/>
            <code>{API_URL}</code>
          </p>
          <button className="action-button">
            Explorar Base de Dados
          </button>
        </section>
      </main>
    </div>
  );
}