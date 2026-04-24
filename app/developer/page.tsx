'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

export default function DeveloperPage() {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
  const [activeTab, setActiveTab] = useState<'providers' | 'proxies'>('providers');
  
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

  const [isSavingProviders, setIsSavingProviders] = useState(false);

  useEffect(() => {
    fetchProxies();
    fetchProviders();
  }, []);

  const fetchProxies = async () => {
    try {
      const res = await fetch(`${baseUrl}/proxies`);
      if (res.ok) setProxies(await res.json());
    } catch (err) { console.error("Erro ao carregar proxies", err); }
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
      }
    } catch (err) { console.error("Erro ao carregar provedores", err); }
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
      }
    } catch (err) { alert('Erro ao salvar proxy.'); }
    setLoadingProxies(false);
  };

  const handleDeleteProxy = async (id: string) => {
    if (!confirm('Tem a certeza que deseja eliminar este proxy?')) return;
    try {
      await fetch(`${baseUrl}/proxies/${id}`, { method: 'DELETE' });
      fetchProxies();
    } catch (err) { alert('Erro ao eliminar proxy.'); }
  };

  const handleSaveEvo = async () => {
    setIsSavingProviders(true);
    try {
      await fetch(`${baseUrl}/providers/evolution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: evoBaseUrl, apiKey: evoApiKey })
      });
      // Um pequeno feedback visual sem usar alert nativo seria ideal, mas mantemos o alert simples por enquanto
      alert('Configurações Evolution salvas com sucesso!');
    } catch (err) { alert('Erro ao salvar Evolution.'); }
    setIsSavingProviders(false);
  };

  const handleSaveCf = async () => {
    setIsSavingProviders(true);
    try {
      await fetch(`${baseUrl}/providers/cloudflare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: cfAccountId, bucket: cfBucket, apiKey: cfAccessKey, apiToken: cfSecretKey })
      });
      alert('Configurações Cloudflare salvas com sucesso!');
    } catch (err) { alert('Erro ao salvar Cloudflare.'); }
    setIsSavingProviders(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f6]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-10 pt-[80px] md:pt-10">
        
        {/* CABEÇALHO */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Painel Técnico</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Developer Central</h1>
            <p className="text-slate-500 mt-1 font-medium">Gestão de infraestrutura, APIs externas e conectividade.</p>
          </div>
        </header>

        {/* NAVEGAÇÃO POR ABAS (Segmented Control) */}
        <div className="inline-flex bg-slate-200/50 p-1.5 rounded-xl mb-8 border border-slate-200/60 shadow-inner">
          <button 
            onClick={() => setActiveTab('providers')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'providers' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>
            Provedores de API
          </button>
          <button 
            onClick={() => setActiveTab('proxies')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'proxies' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" /></svg>
            Rede de Proxies
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* ================= ABA: PROVEDORES ================= */}
          {activeTab === 'providers' ? (
            <>
              {/* Card Evolution API */}
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 text-[#1FA84A] rounded-xl flex items-center justify-center shadow-inner">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-800">Evolution API v2</h3>
                      <p className="text-xs font-medium text-slate-500">Gateway Oficial do WhatsApp</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 text-[11px] font-bold rounded-full border ${evoBaseUrl && evoApiKey ? 'bg-green-50 text-[#1FA84A] border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                    {evoBaseUrl && evoApiKey ? 'Configurado' : 'Pendente'}
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Base URL</label>
                      <input 
                        type="text" 
                        value={evoBaseUrl} 
                        onChange={e => setEvoBaseUrl(e.target.value)} 
                        placeholder="https://api.seuservidor.com" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-[#1FA84A]/10 focus:border-[#1FA84A] transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Global API Key</label>
                      <input 
                        type="password" 
                        value={evoApiKey} 
                        onChange={e => setEvoApiKey(e.target.value)} 
                        placeholder="••••••••••••••••" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-[#1FA84A]/10 focus:border-[#1FA84A] transition-all" 
                      />
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleSaveEvo} 
                    disabled={isSavingProviders} 
                    className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold shadow-md hover:bg-slate-700 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isSavingProviders ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Salvar Credenciais Evolution'}
                  </button>
                </div>
              </div>

              {/* Card Cloudflare R2 */}
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-xl flex items-center justify-center shadow-inner">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" /></svg>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-800">Cloudflare R2 Storage</h3>
                      <p className="text-xs font-medium text-slate-500">Armazenamento de Mídia na Nuvem</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 text-[11px] font-bold rounded-full border ${cfAccountId && cfBucket ? 'bg-green-50 text-[#1FA84A] border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                    {cfAccountId && cfBucket ? 'Configurado' : 'Pendente'}
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Account ID</label>
                      <input type="text" value={cfAccountId} onChange={e => setCfAccountId(e.target.value)} placeholder="Ex: 1234567890abcdef..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Bucket Name</label>
                      <input type="text" value={cfBucket} onChange={e => setCfBucket(e.target.value)} placeholder="meu-crm-storage" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Access Key ID</label>
                      <input type="text" value={cfAccessKey} onChange={e => setCfAccessKey(e.target.value)} placeholder="Chave de Acesso" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Secret Access Key</label>
                      <input type="password" value={cfSecretKey} onChange={e => setCfSecretKey(e.target.value)} placeholder="••••••••••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all" />
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleSaveCf} 
                    disabled={isSavingProviders} 
                    className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold shadow-md hover:bg-slate-700 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isSavingProviders ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Atualizar Storage Cloudflare'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* ================= ABA: PROXIES ================= */
            <div className="xl:col-span-2 grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Coluna Esquerda: Formulário de Novo Proxy */}
              <div className="xl:col-span-1">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm sticky top-10">
                  <h3 className="text-lg font-extrabold text-slate-800 mb-2">Adicionar Proxy</h3>
                  <p className="text-sm text-slate-500 mb-6">Registe um novo nó de rede para proteger as suas instâncias do WhatsApp.</p>
                  
                  <form className="space-y-4" onSubmit={handleSaveProxy}>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Identificação</label>
                      <input value={proxyForm.name} onChange={e => setProxyForm({...proxyForm, name: e.target.value})} placeholder="Ex: Servidor BR-01" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#1FA84A]/10 focus:border-[#1FA84A] transition-all" required />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Host / IP</label>
                        <input value={proxyForm.host} onChange={e => setProxyForm({...proxyForm, host: e.target.value})} placeholder="203.0.113.50" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#1FA84A]/10 focus:border-[#1FA84A] transition-all" required />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Porta</label>
                        <input value={proxyForm.port} onChange={e => setProxyForm({...proxyForm, port: e.target.value})} type="number" placeholder="8080" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#1FA84A]/10 focus:border-[#1FA84A] transition-all" required />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Protocolo</label>
                        <div className="relative">
                          <select value={proxyForm.protocol} onChange={e => setProxyForm({...proxyForm, protocol: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#1FA84A]/10 focus:border-[#1FA84A] transition-all appearance-none cursor-pointer" required>
                            <option value="http">HTTP</option>
                            <option value="https">HTTPS</option>
                            <option value="socks5">SOCKS5</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Autenticação (Opcional)</p>
                      <div className="space-y-4">
                        <div>
                          <input value={proxyForm.username} onChange={e => setProxyForm({...proxyForm, username: e.target.value})} placeholder="Nome de Utilizador" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#1FA84A]/10 focus:border-[#1FA84A] transition-all" />
                        </div>
                        <div>
                          <input value={proxyForm.password} onChange={e => setProxyForm({...proxyForm, password: e.target.value})} type="password" placeholder="Senha" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#1FA84A]/10 focus:border-[#1FA84A] transition-all" />
                        </div>
                      </div>
                    </div>

                    <button type="submit" disabled={loadingProxies} className="w-full mt-6 bg-[#1FA84A] text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-green-600 hover:shadow-lg transition-all flex items-center justify-center gap-2">
                       {loadingProxies ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                         <>
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                           Adicionar à Rede
                         </>
                       )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Coluna Direita: Tabela de Proxies */}
              <div className="xl:col-span-2">
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-extrabold text-slate-800">Rede de Proxies Ativa</h3>
                    <p className="text-sm text-slate-500 mt-1">Lista de todos os nós disponíveis para conexão com o WhatsApp.</p>
                  </div>
                  
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Nó / Identificação</th>
                          <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Endereço IP</th>
                          <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Protocolo</th>
                          <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Auth</th>
                          <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proxies.length === 0 ? (
                          <tr>
                            <td colSpan={5}>
                              <div className="flex flex-col items-center justify-center p-16 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <h4 className="font-bold text-slate-700 text-base">Nenhum Proxy Registado</h4>
                                <p className="text-sm text-slate-500 mt-1 max-w-sm">Utilize o formulário ao lado para adicionar o seu primeiro proxy à infraestrutura.</p>
                              </div>
                            </td>
                          </tr>
                        ) : proxies.map(proxy => (
                          <tr key={proxy.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                                <span className="font-bold text-slate-800">{proxy.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg font-medium tracking-wide">
                                {proxy.host}:{proxy.port}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{proxy.protocol}</span>
                            </td>
                            <td className="py-4 px-6">
                              {proxy.username ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-600 uppercase tracking-widest border border-blue-100">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
                                  Sim
                                </span>
                              ) : (
                                <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-400 uppercase tracking-widest">
                                  Não
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button 
                                onClick={() => handleDeleteProxy(proxy.id)} 
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
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

            </div>
          )}
        </div>
      </main>
    </div>
  );
}