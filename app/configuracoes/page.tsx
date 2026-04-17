'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';

type TabType = 'perfil' | 'tema' | 'instancias' | 'sistema';

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('perfil');

  // Estados temporários para a UI
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f5f7] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden">
        
        {/* HEADER */}
        <header className="px-6 py-6 bg-white border-b border-slate-200 shrink-0">
          <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
          <p className="text-slate-500 text-sm mt-1">Gira as suas preferências pessoais e integrações do sistema.</p>
        </header>

        {/* CONTEÚDO PRINCIPAL (SPLIT VIEW) */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* MENU LATERAL DAS CONFIGURAÇÕES */}
          <div className="w-full md:w-[250px] bg-white border-b md:border-b-0 md:border-r border-slate-200 p-4 shrink-0 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-2">
            <button 
              onClick={() => setActiveTab('perfil')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all shrink-0 md:w-full text-left ${activeTab === 'perfil' ? 'bg-[#e8f6ea] text-[#1FA84A]' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
              Meu Perfil
            </button>
            <button 
              onClick={() => setActiveTab('tema')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all shrink-0 md:w-full text-left ${activeTab === 'tema' ? 'bg-[#e8f6ea] text-[#1FA84A]' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25l7.22-7.22a3.75 3.75 0 1 1 5.303 5.304L6.75 21Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
              Tema
            </button>
            <button 
              onClick={() => setActiveTab('instancias')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all shrink-0 md:w-full text-left ${activeTab === 'instancias' ? 'bg-[#e8f6ea] text-[#1FA84A]' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
              Instâncias (WhatsApp)
            </button>
            <button 
              onClick={() => setActiveTab('sistema')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all shrink-0 md:w-full text-left ${activeTab === 'sistema' ? 'bg-[#e8f6ea] text-[#1FA84A]' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
              Sobre o Sistema
            </button>
          </div>

          {/* PAINEL DE CONTEÚDO */}
          <div className="flex-1 p-6 md:p-10 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              
              {/* TAB 1: PERFIL */}
              {activeTab === 'perfil' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <h2 className="text-xl font-bold text-slate-800 mb-6">Editar Perfil</h2>
                  
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-500 border-4 border-white shadow-md">
                        U
                      </div>
                      <div>
                        <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors">
                          Alterar Foto
                        </button>
                        <p className="text-xs text-slate-400 mt-2">JPG, GIF ou PNG. Máximo de 2MB.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome Completo</label>
                        <input type="text" placeholder="O seu nome" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1FA84A] transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">E-mail</label>
                        <input type="email" placeholder="seu@email.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1FA84A] transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Nova Senha</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1FA84A] transition-colors" />
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button className="bg-[#1FA84A] hover:bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-colors">
                        Guardar Alterações
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TEMA */}
              {activeTab === 'tema' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <h2 className="text-xl font-bold text-slate-800 mb-6">Aparência do Sistema</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Botão Light */}
                    <button 
                      onClick={() => setTheme('light')}
                      className={`p-1 rounded-2xl border-2 text-left transition-all ${theme === 'light' ? 'border-[#1FA84A]' : 'border-transparent hover:bg-slate-100'}`}
                    >
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 h-32 flex flex-col">
                        <div className="w-full h-3 bg-white rounded-full mb-2"></div>
                        <div className="w-2/3 h-3 bg-slate-200 rounded-full mb-auto"></div>
                        <div className="font-bold text-slate-700 flex justify-between items-center">
                          Claro
                          {theme === 'light' && <div className="w-4 h-4 bg-[#1FA84A] rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg></div>}
                        </div>
                      </div>
                    </button>

                    {/* Botão Dark */}
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`p-1 rounded-2xl border-2 text-left transition-all ${theme === 'dark' ? 'border-[#1FA84A]' : 'border-transparent hover:bg-slate-100'}`}
                    >
                      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 h-32 flex flex-col">
                        <div className="w-full h-3 bg-slate-800 rounded-full mb-2"></div>
                        <div className="w-2/3 h-3 bg-slate-700 rounded-full mb-auto"></div>
                        <div className="font-bold text-white flex justify-between items-center">
                          Escuro
                          {theme === 'dark' && <div className="w-4 h-4 bg-[#1FA84A] rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg></div>}
                        </div>
                      </div>
                    </button>

                    {/* Botão Auto */}
                    <button 
                      onClick={() => setTheme('system')}
                      className={`p-1 rounded-2xl border-2 text-left transition-all ${theme === 'system' ? 'border-[#1FA84A]' : 'border-transparent hover:bg-slate-100'}`}
                    >
                      <div className="bg-gradient-to-br from-slate-50 to-slate-900 rounded-xl p-4 border border-slate-300 h-32 flex flex-col">
                        <div className="w-full h-3 bg-white/50 rounded-full mb-2"></div>
                        <div className="w-2/3 h-3 bg-black/20 rounded-full mb-auto"></div>
                        <div className="font-bold text-white drop-shadow-md flex justify-between items-center">
                          Automático
                          {theme === 'system' && <div className="w-4 h-4 bg-[#1FA84A] rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg></div>}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: INSTÂNCIAS EVOLUTION */}
              {activeTab === 'instancias' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Conexões WhatsApp</h2>
                    <button className="bg-[#1FA84A] hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      Nova Instância
                    </button>
                  </div>

                  {/* Card de Instância Ativa */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#d9fdd3] flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#1FA84A]"><path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" /></svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">Atendimento Principal</h3>
                        <p className="text-sm text-slate-500 font-mono">Instância: SuporteImagem_01</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-green-100 text-green-700 font-bold text-xs rounded-full flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Conectado
                      </span>
                      <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg transition-colors">
                        Sincronizar
                      </button>
                      <button className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-800 text-sm">
                    <strong>Nota Técnica:</strong> Para ler QR Codes de novas instâncias, é necessário integrar as rotas `/instance/create` e `/instance/connect` da API do Evolution no backend do CRM.
                  </div>
                </div>
              )}

              {/* TAB 4: SISTEMA */}
              {activeTab === 'sistema' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <h2 className="text-xl font-bold text-slate-800 mb-6">Sobre o Sistema</h2>
                  
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-8 flex flex-col items-center justify-center border-b border-slate-100 bg-slate-50/50 text-center">
                      <div className="w-16 h-16 bg-[#1FA84A] rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-4">
                        SI
                      </div>
                      <h3 className="font-bold text-xl text-slate-800">Suporte Imagem CRM</h3>
                      <p className="text-slate-500 font-mono mt-1">Versão 1.0.0 (Build 42)</p>
                    </div>
                    
                    <div className="p-6">
                      <h4 className="text-sm font-bold text-slate-800 mb-3">Licença e Suporte</h4>
                      <p className="text-sm text-slate-600 leading-relaxed mb-6">
                        Este software foi desenvolvido exclusivamente para a gestão interna da Suporte Imagem. Todos os direitos reservados. Em caso de falha técnica, indisponibilidade do WhatsApp ou problemas de acesso, contacte imediatamente o administrador do sistema.
                      </p>
                      
                      <button className="w-full md:w-auto bg-slate-800 hover:bg-black text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Falar com Administrador
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </main>
    </div>
  );
}