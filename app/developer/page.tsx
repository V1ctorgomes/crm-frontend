'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

export const dynamic = 'force-dynamic';

export default function DeveloperPage() {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
  const [activeTab, setActiveTab] = useState<'providers' | 'proxies'>('providers');
  
  // Feedback System (Toast)
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Estados para Proxies
  const [proxies, setProxies] = useState<any[]>([]);
  const [loadingProxies, setLoadingProxies] = useState(false);
  const [proxyForm, setProxyForm] = useState({ name: '', host: '', port: '', username: '', password: '', protocol: 'http' });

  // Estados para Provedores (Evolution)
  const [evoBaseUrl, setEvoBaseUrl] = useState('');
  const [evoApiKey, setEvoApiKey] = useState('');
  
  // Estados para Provedores (Cloudflare)
  const [cfAccountId, setCfAccountId] = useState('');
  const [cfBucket, setCfBucket] = useState('');
  const [cfAccessKey, setCfAccessKey] = useState('');
  const [cfSecretKey, setCfSecretKey] = useState('');
  const [cfPublicUrl, setCfPublicUrl] = useState('');

  const [isSavingProviders, setIsSavingProviders] = useState(false);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchProxies();
    fetchProviders();
  }, []);

  const fetchProxies = async () => {
    try {
      const res = await fetch(`${baseUrl}/proxies`);
      if (res.ok) setProxies(await res.json());
    } catch (err) { 
      showFeedback('error', "Erro ao carregar proxies."); 
    }
  };

  const fetchProviders = async () => {
    try {
      const resEvo = await fetch(`${baseUrl}/providers/evolution`);
      if (resEvo.ok) {
        const data = await resEvo.json();
        if (data.baseUrl) setEvoBaseUrl(data.baseUrl);
        if (data.apiKey) setEvoApiKey(data.apiKey);
      }

      const resCf = await fetch(`${baseUrl}/providers/cloudflare`);
      if (resCf.ok) {
        const data = await resCf.json();
        if (data.accountId) setCfAccountId(data.accountId);
        if (data.bucket) setCfBucket(data.bucket);
        if (data.apiKey) setCfAccessKey(data.apiKey);
        if (data.apiToken) setCfSecretKey(data.apiToken);
        if (data.baseUrl) setCfPublicUrl(data.baseUrl);
      }
    } catch (err) { 
      showFeedback('error', "Erro ao carregar configurações dos provedores."); 
    }
  };

  const handleSaveProxy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProxies(true);
    try {
      const res = await fetch(`${baseUrl}/proxies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proxyForm)
      });
      if (res.ok) {
        setProxyForm({ name: '', host: '', port: '', username: '', password: '', protocol: 'http' });
        fetchProxies();
        showFeedback('success', "Proxy adicionado à rede com sucesso.");
      } else {
        showFeedback('error', "Não foi possível adicionar o proxy.");
      }
    } catch (err) { 
      showFeedback('error', "Erro de conexão ao salvar proxy."); 
    }
    setLoadingProxies(false);
  };

  const handleDeleteProxy = async (id: string) => {
    if (!confirm('Tem a certeza que deseja eliminar este proxy?')) return;
    try {
      const res = await fetch(`${baseUrl}/proxies/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProxies();
        showFeedback('success', "Proxy removido da infraestrutura.");
      }
    } catch (err) { 
      showFeedback('error', "Erro ao eliminar proxy."); 
    }
  };

  const handleSaveEvo = async () => {
    setIsSavingProviders(true);
    try {
      const res = await fetch(`${baseUrl}/providers/evolution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: evoBaseUrl, apiKey: evoApiKey })
      });
      if (res.ok) showFeedback('success', "Configurações da Evolution API atualizadas!");
      else showFeedback('error', "Erro ao guardar definições da Evolution.");
    } catch (err) { 
      showFeedback('error', "Falha de conexão com o servidor."); 
    }
    setIsSavingProviders(false);
  };

  const handleSaveCf = async () => {
    setIsSavingProviders(true);
    try {
      const res = await fetch(`${baseUrl}/providers/cloudflare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: cfAccountId, bucket: cfBucket, apiKey: cfAccessKey, apiToken: cfSecretKey, baseUrl: cfPublicUrl })
      });
      if (res.ok) showFeedback('success', "Configurações da Cloudflare atualizadas!");
      else showFeedback('error', "Erro ao guardar definições da Cloudflare.");
    } catch (err) { 
      showFeedback('error', "Falha de conexão com o servidor."); 
    }
    setIsSavingProviders(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden overflow-y-auto no-scrollbar selection:bg-blue-100 selection:text-blue-900">
        
        {/* TOAST NOTIFICATION */}
        {toast && (
          <div className="fixed top-4 right-4 md:top-8 md:right-8 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300">
            <div className="px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border bg-white border-slate-200">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {toast.type === 'success' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                )}
              </div>
              <span className="font-medium text-sm text-slate-800">{toast.message}</span>
            </div>
          </div>
        )}

        {/* CABEÇALHO */}
        <header className="px-6 md:px-8 pt-8 md:pt-10 pb-6 flex flex-col shrink-0 z-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Developer Central</h1>
            <p className="text-slate-500 text-sm mt-1">Gestão de infraestrutura, APIs externas e conectividade.</p>
          </div>
        </header>

        <div className="px-6 md:px-8 pb-12 flex flex-col gap-6 animate-in fade-in duration-500">
          
          {/* NAVEGAÇÃO DE ABAS */}
          <div className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500 w-full sm:w-auto self-start">
            <button 
              onClick={() => setActiveTab('providers')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all ${activeTab === 'providers' ? 'bg-white text-slate-950 shadow-sm' : 'hover:text-slate-900'}`}
            >
              Provedores de API
            </button>
            <button 
              onClick={() => setActiveTab('proxies')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all ${activeTab === 'proxies' ? 'bg-white text-slate-950 shadow-sm' : 'hover:text-slate-900'}`}
            >
              Rede de Proxies
            </button>
          </div>

          {/* ================= ABA: PROVEDORES ================= */}
          {activeTab === 'providers' ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              
              {/* Card Evolution API */}
              <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0 text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                    </div>
                    <div>
                      <h3 className="font-semibold leading-none tracking-tight text-base">Evolution API v2</h3>
                      <p className="text-sm text-slate-500 mt-1">Gateway Oficial do WhatsApp</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-md border ${evoBaseUrl && evoApiKey ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {evoBaseUrl && evoApiKey ? 'Configurado' : 'Pendente'}
                  </span>
                </div>
                
                <div className="p-6 flex flex-col gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-slate-700">URL Base</label>
                    <input 
                      type="text" 
                      value={evoBaseUrl} 
                      onChange={e => setEvoBaseUrl(e.target.value)} 
                      placeholder="https://api.suaempresa.com" 
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-slate-700">Global API Key</label>
                    <input 
                      type="password" 
                      value={evoApiKey} 
                      onChange={e => setEvoApiKey(e.target.value)} 
                      placeholder="••••••••••••••••" 
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                    />
                  </div>
                </div>
                <div className="p-6 pt-0 border-t border-slate-100 bg-slate-50 mt-auto rounded-b-xl flex justify-end items-center py-4">
                  <button 
                    onClick={handleSaveEvo} 
                    disabled={isSavingProviders} 
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-10 px-4 py-2 disabled:opacity-50"
                  >
                    {isSavingProviders ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> : null}
                    {isSavingProviders ? 'A guardar...' : 'Guardar Alterações'}
                  </button>
                </div>
              </div>

              {/* Card Cloudflare R2 */}
              <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0 text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" /></svg>
                    </div>
                    <div>
                      <h3 className="font-semibold leading-none tracking-tight text-base">Cloudflare R2</h3>
                      <p className="text-sm text-slate-500 mt-1">Armazenamento de Ficheiros na Nuvem</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-md border ${cfAccountId && cfBucket ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {cfAccountId && cfBucket ? 'Configurado' : 'Pendente'}
                  </span>
                </div>
                
                <div className="p-6 flex flex-col gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-slate-700">URL Pública do Bucket (Public Endpoint)</label>
                    <input 
                      type="text" 
                      value={cfPublicUrl} 
                      onChange={e => setCfPublicUrl(e.target.value)} 
                      placeholder="Ex: https://pub-12345.r2.dev" 
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none text-slate-700">Account ID</label>
                      <input type="text" value={cfAccountId} onChange={e => setCfAccountId(e.target.value)} placeholder="1234567890abcdef" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none text-slate-700">Bucket Name</label>
                      <input type="text" value={cfBucket} onChange={e => setCfBucket(e.target.value)} placeholder="meu-crm-storage" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none text-slate-700">Access Key ID</label>
                      <input type="text" value={cfAccessKey} onChange={e => setCfAccessKey(e.target.value)} placeholder="Chave de Acesso" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none text-slate-700">Secret Access Key</label>
                      <input type="password" value={cfSecretKey} onChange={e => setCfSecretKey(e.target.value)} placeholder="••••••••••••••••" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                  </div>
                </div>
                
                <div className="p-6 pt-0 border-t border-slate-100 bg-slate-50 mt-auto rounded-b-xl flex justify-end items-center py-4">
                  <button 
                    onClick={handleSaveCf} 
                    disabled={isSavingProviders} 
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-10 px-4 py-2 disabled:opacity-50"
                  >
                    {isSavingProviders ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> : null}
                    {isSavingProviders ? 'A guardar...' : 'Guardar Alterações'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ================= ABA: PROXIES ================= */
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              
              {/* Coluna Esquerda: Formulário de Novo Proxy */}
              <div className="xl:col-span-1 rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm flex flex-col sticky top-6">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-semibold leading-none tracking-tight text-lg">Adicionar Proxy</h3>
                  <p className="text-sm text-slate-500 mt-1.5">Registe um novo nó de rede para proteger as ligações do WhatsApp.</p>
                </div>
                
                <form className="p-6 flex flex-col gap-4" onSubmit={handleSaveProxy}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-slate-700">Identificação</label>
                    <input value={proxyForm.name} onChange={e => setProxyForm({...proxyForm, name: e.target.value})} placeholder="Ex: Nó Europa 01" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <label className="text-sm font-medium leading-none text-slate-700">Endereço IP / Host</label>
                      <input value={proxyForm.host} onChange={e => setProxyForm({...proxyForm, host: e.target.value})} placeholder="203.0.113.50" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none text-slate-700">Porta</label>
                      <input value={proxyForm.port} onChange={e => setProxyForm({...proxyForm, port: e.target.value})} type="number" placeholder="8080" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none text-slate-700">Protocolo</label>
                      <select value={proxyForm.protocol} onChange={e => setProxyForm({...proxyForm, protocol: e.target.value})} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required>
                        <option value="http">HTTP</option>
                        <option value="https">HTTPS</option>
                        <option value="socks5">SOCKS5</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-2">
                    <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-widest">Autenticação (Opcional)</p>
                    <div className="space-y-4">
                      <input value={proxyForm.username} onChange={e => setProxyForm({...proxyForm, username: e.target.value})} placeholder="Nome de Utilizador" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      <input value={proxyForm.password} onChange={e => setProxyForm({...proxyForm, password: e.target.value})} type="password" placeholder="Palavra-passe" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                  </div>

                  <button type="submit" disabled={loadingProxies} className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-10 px-4 py-2 mt-4 disabled:opacity-50">
                     {loadingProxies ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> : null}
                     {loadingProxies ? 'A adicionar...' : 'Adicionar Nó à Rede'}
                  </button>
                </form>
              </div>

              {/* Coluna Direita: Tabela de Proxies */}
              <div className="xl:col-span-2 rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-semibold leading-none tracking-tight text-lg">Infraestrutura Ativa</h3>
                  <p className="text-sm text-slate-500 mt-1.5">Lista de todos os proxies registados e disponíveis.</p>
                </div>
                
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50">
                        <th className="h-12 px-4 align-middle font-medium text-slate-500">Identificação</th>
                        <th className="h-12 px-4 align-middle font-medium text-slate-500">Endereço IP</th>
                        <th className="h-12 px-4 align-middle font-medium text-slate-500">Protocolo</th>
                        <th className="h-12 px-4 align-middle font-medium text-slate-500">Auth</th>
                        <th className="h-12 px-4 align-middle font-medium text-slate-500 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {proxies.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center p-6 text-slate-400">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mb-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                              <span className="font-medium text-sm text-slate-500">Nenhum Proxy Registado</span>
                            </div>
                          </td>
                        </tr>
                      ) : proxies.map(proxy => (
                        <tr key={proxy.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                              <span className="font-semibold text-slate-900">{proxy.name}</span>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <span className="font-mono text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded">
                              {proxy.host}:{proxy.port}
                            </span>
                          </td>
                          <td className="p-4 align-middle">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{proxy.protocol}</span>
                          </td>
                          <td className="p-4 align-middle">
                            {proxy.username ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase tracking-widest border border-blue-200">
                                Sim
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-widest border border-slate-200">
                                Não
                              </span>
                            )}
                          </td>
                          <td className="p-4 align-middle text-right">
                            <button 
                              onClick={() => handleDeleteProxy(proxy.id)} 
                              className="h-8 w-8 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 ml-auto"
                              title="Eliminar Proxy"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}