'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';

type TabType = 'perfil' | 'tema' | 'instancias' | 'sistema';

interface Instance {
  id: string;
  name: string;
  status: string;
  rejectCalls: boolean;
  ignoreGroups: boolean;
  proxyHost?: string;
  createdAt: string;
}

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('perfil');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  // =====================================
  // ESTADOS DAS INSTÂNCIAS
  // =====================================
  const [instances, setInstances] = useState<Instance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Modais Instância
  const [isInstanceModalOpen, setIsInstanceModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [activeQrCode, setActiveQrCode] = useState<string | null>(null);
  
  const [editingInstance, setEditingInstance] = useState<Instance | null>(null);

  // Form Instância
  const [formName, setFormName] = useState('');
  const [formRejectCalls, setFormRejectCalls] = useState(false);
  const [formIgnoreGroups, setFormIgnoreGroups] = useState(false);
  // Proxy
  const [useProxy, setUseProxy] = useState(false);
  const [proxyHost, setProxyHost] = useState('');
  const [proxyPort, setProxyPort] = useState('');
  const [proxyUser, setProxyUser] = useState('');
  const [proxyPass, setProxyPass] = useState('');
  const [proxyProto, setProxyProto] = useState('http');

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  // Simula a obtenção do usuário logado (pega o primeiro user do banco para exemplo)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${baseUrl}/users`);
        if (res.ok) {
          const users = await res.json();
          if (users.length > 0) setUserId(users[0].id); // Fixa no primeiro usuário para teste
        }
      } catch (e) {}
    };
    fetchUser();
  }, [baseUrl]);

  const fetchInstances = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${baseUrl}/instances/user/${userId}`);
      if (res.ok) setInstances(await res.json());
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'instancias') fetchInstances();
  }, [activeTab, userId]);

  // =====================================
  // AÇÕES DE INSTÂNCIA
  // =====================================
  const openCreateModal = () => {
    setEditingInstance(null); setFormName(''); setFormRejectCalls(false); setFormIgnoreGroups(false);
    setUseProxy(false); setProxyHost(''); setProxyPort(''); setProxyUser(''); setProxyPass('');
    setIsInstanceModalOpen(true);
  };

  const openEditModal = (inst: Instance) => {
    setEditingInstance(inst); setFormName(inst.name); setFormRejectCalls(inst.rejectCalls); setFormIgnoreGroups(inst.ignoreGroups);
    setIsInstanceModalOpen(true);
  };

  const handleSaveInstance = async () => {
    if (!userId || !formName) return alert("O nome da instância é obrigatório!");
    setIsLoading(true);

    try {
      if (editingInstance) {
        // Apenas atualiza Settings
        const res = await fetch(`${baseUrl}/instances/${editingInstance.name}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rejectCalls: formRejectCalls, ignoreGroups: formIgnoreGroups })
        });
        if (res.ok) { setIsInstanceModalOpen(false); fetchInstances(); }
      } else {
        // Cria Nova (Com proxy se ativado)
        const payload: any = { name: formName.trim().replace(/\s+/g, ''), userId, rejectCalls: formRejectCalls, ignoreGroups: formIgnoreGroups };
        if (useProxy && proxyHost && proxyPort) {
          payload.proxyHost = proxyHost; payload.proxyPort = proxyPort; payload.proxyUser = proxyUser; payload.proxyPass = proxyPass; payload.proxyProto = proxyProto;
        }
        const res = await fetch(`${baseUrl}/instances`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (res.ok) { setIsInstanceModalOpen(false); fetchInstances(); }
        else { const err = await res.json(); alert(err.message || "Erro ao criar"); }
      }
    } catch (err) { alert("Erro de comunicação."); } finally { setIsLoading(false); }
  };

  const handleDeleteInstance = async (name: string) => {
    if (!confirm(`Deseja remover a instância ${name}? O WhatsApp será desconectado.`)) return;
    setIsLoading(true);
    await fetch(`${baseUrl}/instances/${name}`, { method: 'DELETE' });
    fetchInstances();
  };

  // CORREÇÃO: Tratamento robusto para não crashar o frontend quando o backend devolve erro não-JSON
  const openQrCode = async (name: string) => {
    setActiveQrCode(null);
    setIsQrModalOpen(true);
    try {
      const res = await fetch(`${baseUrl}/instances/connect/${name}`);
      
      if (!res.ok) {
        // Lemos como texto primeiro para não rebentar se o erro for HTML
        const errText = await res.text();
        console.error("Resposta de Erro:", errText);
        alert(`Erro ao tentar carregar o QR Code. A instância pode estar a ser criada. Tente novamente em 5 segundos.`);
        setIsQrModalOpen(false);
        return;
      }

      const data = await res.json();
      
      // Procura a base64 na resposta da Evolution API v2
      const qrBase64 = data?.base64 || data?.qrcode?.base64 || data?.instance?.qrcode;
      
      if (qrBase64) {
        setActiveQrCode(qrBase64.startsWith('data:') ? qrBase64 : `data:image/png;base64,${qrBase64}`);
      } else {
        alert("A instância já está conectada, ou o QR code está em processamento. Aguarde alguns segundos.");
        setIsQrModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert("Falha de conexão com o servidor. Verifique se o backend está ativo.");
      setIsQrModalOpen(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f5f7] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden">
        
        <header className="px-6 py-6 bg-white border-b border-slate-200 shrink-0">
          <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
          <p className="text-slate-500 text-sm mt-1">Gira as suas preferências pessoais e integrações do sistema.</p>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          <div className="w-full md:w-[250px] bg-white border-b md:border-b-0 md:border-r border-slate-200 p-4 shrink-0 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-2">
            <button onClick={() => setActiveTab('perfil')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all shrink-0 md:w-full text-left ${activeTab === 'perfil' ? 'bg-[#e8f6ea] text-[#1FA84A]' : 'text-slate-600 hover:bg-slate-50'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
              Meu Perfil
            </button>
            <button onClick={() => setActiveTab('tema')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all shrink-0 md:w-full text-left ${activeTab === 'tema' ? 'bg-[#e8f6ea] text-[#1FA84A]' : 'text-slate-600 hover:bg-slate-50'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25l7.22-7.22a3.75 3.75 0 1 1 5.303 5.304L6.75 21Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
              Tema
            </button>
            <button onClick={() => setActiveTab('instancias')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all shrink-0 md:w-full text-left ${activeTab === 'instancias' ? 'bg-[#e8f6ea] text-[#1FA84A]' : 'text-slate-600 hover:bg-slate-50'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
              Instâncias (WhatsApp)
            </button>
            <button onClick={() => setActiveTab('sistema')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all shrink-0 md:w-full text-left ${activeTab === 'sistema' ? 'bg-[#e8f6ea] text-[#1FA84A]' : 'text-slate-600 hover:bg-slate-50'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
              Sobre o Sistema
            </button>
          </div>

          <div className="flex-1 p-6 md:p-10 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              
              {/* TAB 1: PERFIL */}
              {activeTab === 'perfil' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <h2 className="text-xl font-bold text-slate-800 mb-6">Editar Perfil</h2>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-500 mb-4">Esta funcionalidade será ativada quando implementar a autenticação completa.</p>
                  </div>
                </div>
              )}

              {/* TAB 2: TEMA */}
              {activeTab === 'tema' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <h2 className="text-xl font-bold text-slate-800 mb-6">Aparência do Sistema</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={() => setTheme('light')} className={`p-1 rounded-2xl border-2 text-left transition-all ${theme === 'light' ? 'border-[#1FA84A]' : 'border-transparent hover:bg-slate-100'}`}>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 h-32 flex flex-col">
                        <div className="w-full h-3 bg-white rounded-full mb-2"></div>
                        <div className="w-2/3 h-3 bg-slate-200 rounded-full mb-auto"></div>
                        <div className="font-bold text-slate-700 flex justify-between items-center">Claro {theme === 'light' && <div className="w-4 h-4 bg-[#1FA84A] rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg></div>}</div>
                      </div>
                    </button>
                    <button onClick={() => setTheme('dark')} className={`p-1 rounded-2xl border-2 text-left transition-all ${theme === 'dark' ? 'border-[#1FA84A]' : 'border-transparent hover:bg-slate-100'}`}>
                      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 h-32 flex flex-col">
                        <div className="w-full h-3 bg-slate-700 rounded-full mb-2"></div>
                        <div className="w-2/3 h-3 bg-slate-600 rounded-full mb-auto"></div>
                        <div className="font-bold text-white flex justify-between items-center">Escuro {theme === 'dark' && <div className="w-4 h-4 bg-[#1FA84A] rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg></div>}</div>
                      </div>
                    </button>
                    <button onClick={() => setTheme('system')} className={`p-1 rounded-2xl border-2 text-left transition-all ${theme === 'system' ? 'border-[#1FA84A]' : 'border-transparent hover:bg-slate-100'}`}>
                      <div className="bg-gradient-to-br from-slate-50 to-slate-800 rounded-xl p-4 border border-slate-300 h-32 flex flex-col">
                        <div className="w-full h-3 bg-white/50 rounded-full mb-2"></div>
                        <div className="w-2/3 h-3 bg-black/20 rounded-full mb-auto"></div>
                        <div className="font-bold text-white drop-shadow-md flex justify-between items-center">Sistema {theme === 'system' && <div className="w-4 h-4 bg-[#1FA84A] rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg></div>}</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: INSTÂNCIAS EVOLUTION */}
              {activeTab === 'instancias' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Suas Conexões WhatsApp</h2>
                    <button onClick={openCreateModal} className="bg-[#1FA84A] hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      Nova Instância
                    </button>
                  </div>

                  {instances.length === 0 && !isLoading && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400">
                      Nenhuma instância conectada. Clique em "Nova Instância" para começar.
                    </div>
                  )}

                  {isLoading && instances.length === 0 && (
                    <div className="text-center p-10"><div className="w-8 h-8 border-4 border-[#1FA84A] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
                  )}

                  <div className="flex flex-col gap-4">
                    {instances.map(inst => (
                      <div key={inst.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all hover:border-[#1FA84A]">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${inst.status === 'connected' ? 'bg-[#d9fdd3] text-[#1FA84A]' : 'bg-slate-100 text-slate-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" /></svg>
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                              {inst.name}
                            </h3>
                            <div className="flex items-center gap-2 text-[11px] font-bold mt-1">
                              {inst.rejectCalls ? <span className="text-red-500 bg-red-50 px-2 rounded">Rejeita Calls</span> : <span className="text-slate-400 bg-slate-100 px-2 rounded">Aceita Calls</span>}
                              {inst.ignoreGroups ? <span className="text-red-500 bg-red-50 px-2 rounded">Ignora Grupos</span> : <span className="text-slate-400 bg-slate-100 px-2 rounded">Lê Grupos</span>}
                            </div>
                            {/* Proxy Indicator */}
                            {(inst.proxyHost || inst.proxyPort) && (
                               <p className="text-[11px] font-bold text-blue-500 mt-1 uppercase tracking-wider">
                                 PROXY ATIVO: {inst.proxyHost}:{inst.proxyPort}
                               </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-4 lg:mt-0 flex-wrap">
                          {inst.status === 'connected' ? (
                            <span className="px-3 py-1.5 bg-green-100 text-green-700 font-bold text-xs rounded-full flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span> Conectado
                            </span>
                          ) : (
                            <button onClick={() => openQrCode(inst.name)} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-sm rounded-lg transition-colors flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" /></svg>
                              Ler QR Code
                            </button>
                          )}
                          <button onClick={fetchInstances} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg transition-colors">Sincronizar</button>
                          <button onClick={() => openEditModal(inst)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg transition-colors">Editar</button>
                          <button onClick={() => handleDeleteInstance(inst.name)} className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: SISTEMA */}
              {activeTab === 'sistema' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <h2 className="text-xl font-bold text-slate-800 mb-6">Sobre o Sistema</h2>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-8 flex flex-col items-center justify-center border-b border-slate-100 bg-slate-50/50 text-center">
                      <div className="w-16 h-16 bg-[#1FA84A] rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-4">SI</div>
                      <h3 className="font-bold text-xl text-slate-800">Suporte Imagem CRM</h3>
                      <p className="text-slate-500 font-mono mt-1">Versão 1.0.0 (Evolution API v2)</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* MODAL CRIAR/EDITAR INSTÂNCIA */}
      {isInstanceModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4" onClick={() => setIsInstanceModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-slate-800">{editingInstance ? 'Editar Configurações' : 'Criar Nova Instância'}</h3>
              <button onClick={() => setIsInstanceModalOpen(false)} className="text-slate-400 hover:text-slate-600"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              {!editingInstance && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Instância <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="ex: AtendimentoPrincipal" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#1FA84A]" value={formName} onChange={e => setFormName(e.target.value.replace(/\s+/g, ''))} />
                  <p className="text-[11px] text-slate-400 mt-1">Sem espaços ou caracteres especiais.</p>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Comportamento do WhatsApp</h4>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-[#1FA84A]" checked={formRejectCalls} onChange={e => setFormRejectCalls(e.target.checked)} />
                  <span className="text-sm font-bold text-slate-700">Rejeitar Chamadas Automaticamente</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-[#1FA84A]" checked={formIgnoreGroups} onChange={e => setFormIgnoreGroups(e.target.checked)} />
                  <span className="text-sm font-bold text-slate-700">Ignorar Mensagens de Grupos</span>
                </label>
              </div>

              {!editingInstance && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between cursor-pointer" onClick={() => setUseProxy(!useProxy)}>
                    <h4 className="text-xs font-bold text-slate-500 uppercase">Configurar Proxy (Opcional)</h4>
                    <input type="checkbox" className="w-4 h-4 accent-[#1FA84A] pointer-events-none" checked={useProxy} readOnly />
                  </div>
                  {useProxy && (
                    <div className="p-4 grid grid-cols-2 gap-4 bg-white">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Protocolo</label>
                        <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" value={proxyProto} onChange={e => setProxyProto(e.target.value)}>
                          <option value="http">HTTP</option><option value="https">HTTPS</option><option value="socks5">SOCKS5</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Host / IP</label>
                        <input type="text" placeholder="192.168.1.1" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" value={proxyHost} onChange={e => setProxyHost(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Porta</label>
                        <input type="text" placeholder="8080" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" value={proxyPort} onChange={e => setProxyPort(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Usuário</label>
                        <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" value={proxyUser} onChange={e => setProxyUser(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Senha</label>
                        <input type="password" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" value={proxyPass} onChange={e => setProxyPass(e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsInstanceModalOpen(false)} className="px-4 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancelar</button>
              <button onClick={handleSaveInstance} disabled={isLoading} className="bg-[#1FA84A] text-white px-6 py-2 rounded-lg font-bold hover:bg-green-600 shadow-sm transition-colors disabled:opacity-50">
                {isLoading ? 'Processando...' : 'Salvar Instância'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL QR CODE */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4" onClick={() => setIsQrModalOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-xl text-slate-800 mb-2 text-center">Conectar WhatsApp</h3>
            <p className="text-sm text-slate-500 text-center mb-6">Abra o WhatsApp no seu telemóvel, vá a "Aparelhos Conectados" e aponte a câmara para este código.</p>
            
            <div className="w-64 h-64 bg-slate-50 border-2 border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden relative">
              {!activeQrCode ? (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-[#1FA84A] border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span className="text-sm font-bold text-slate-400">A gerar código...</span>
                </div>
              ) : (
                <img src={activeQrCode} alt="QR Code" className="w-full h-full object-contain" />
              )}
            </div>
            
            <button onClick={() => { setIsQrModalOpen(false); fetchInstances(); }} className="mt-8 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
              Fechar e Atualizar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}