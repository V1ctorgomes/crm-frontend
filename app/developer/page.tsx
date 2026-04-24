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
    if (!confirm('Eliminar proxy?')) return;
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
      alert('Configurações Evolution salvas!');
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
      alert('Configurações Cloudflare salvas!');
    } catch (err) { alert('Erro ao salvar Cloudflare.'); }
    setIsSavingProviders(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-10 pt-[80px] md:pt-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Developer Central</h1>
          <p className="text-slate-500 mt-1">Configurações críticas de infraestrutura e conectividade.</p>
        </header>

        {/* Navegação por Abas */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('providers')}
            className={`pb-4 px-2 font-bold text-sm transition-all ${activeTab === 'providers' ? 'border-b-2 border-[#1FA84A] text-[#1FA84A]' : 'text-slate-400'}`}
          >
            Provedores (API & Storage)
          </button>
          <button 
            onClick={() => setActiveTab('proxies')}
            className={`pb-4 px-2 font-bold text-sm transition-all ${activeTab === 'proxies' ? 'border-b-2 border-[#1FA84A] text-[#1FA84A]' : 'text-slate-400'}`}
          >
            Gestão de Proxies
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 max-w-5xl">
          {activeTab === 'providers' ? (
            <div className="space-y-6">
              {/* Card Evolution API */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <i className="bi bi-cpu text-blue-500"></i> Evolution API v2
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" value={evoBaseUrl} onChange={e => setEvoBaseUrl(e.target.value)} placeholder="Base URL (Ex: https://api.meu-crm.com)" className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20" />
                  <input type="password" value={evoApiKey} onChange={e => setEvoApiKey(e.target.value)} placeholder="Global API Key" className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20" />
                </div>
                <button onClick={handleSaveEvo} disabled={isSavingProviders} className="mt-4 bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-700 transition-all">
                  Salvar Credenciais Evolution
                </button>
              </div>

              {/* Card Cloudflare R2 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <i className="bi bi-cloud-check text-orange-500"></i> Cloudflare R2 Storage
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" value={cfAccountId} onChange={e => setCfAccountId(e.target.value)} placeholder="Account ID" className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20" />
                  <input type="text" value={cfBucket} onChange={e => setCfBucket(e.target.value)} placeholder="Bucket Name" className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20" />
                  <input type="text" value={cfAccessKey} onChange={e => setCfAccessKey(e.target.value)} placeholder="Access Key ID" className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20" />
                  <input type="password" value={cfSecretKey} onChange={e => setCfSecretKey(e.target.value)} placeholder="Secret Access Key" className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20" />
                </div>
                <button onClick={handleSaveCf} disabled={isSavingProviders} className="mt-4 bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-700 transition-all">
                  Atualizar Storage Cloudflare
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Cadastrar Novo Proxy</h3>
              <form className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 items-start" onSubmit={handleSaveProxy}>
                <div className="col-span-1 md:col-span-2">
                  <input value={proxyForm.name} onChange={e => setProxyForm({...proxyForm, name: e.target.value})} placeholder="Nome Identificador (Ex: BR-01)" className="w-full p-3 rounded-xl border border-slate-200" required />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <input value={proxyForm.host} onChange={e => setProxyForm({...proxyForm, host: e.target.value})} placeholder="Host/IP" className="w-full p-3 rounded-xl border border-slate-200" required />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <input value={proxyForm.port} onChange={e => setProxyForm({...proxyForm, port: e.target.value})} type="number" placeholder="Porta" className="w-full p-3 rounded-xl border border-slate-200" required />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <select value={proxyForm.protocol} onChange={e => setProxyForm({...proxyForm, protocol: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-white" required>
                    <option value="http">HTTP</option>
                    <option value="https">HTTPS</option>
                    <option value="socks5">SOCKS5</option>
                  </select>
                </div>
                <div className="col-span-1 md:col-span-1">
                  <input value={proxyForm.username} onChange={e => setProxyForm({...proxyForm, username: e.target.value})} placeholder="Usuário (Opcional)" className="w-full p-3 rounded-xl border border-slate-200" />
                </div>
                <div className="col-span-1 md:col-span-2 flex gap-4">
                  <input value={proxyForm.password} onChange={e => setProxyForm({...proxyForm, password: e.target.value})} type="password" placeholder="Senha (Opcional)" className="w-full p-3 rounded-xl border border-slate-200" />
                  <button type="submit" disabled={loadingProxies} className="bg-[#1FA84A] text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition-all shrink-0">
                    Adicionar
                  </button>
                </div>
              </form>

              <h4 className="font-bold text-slate-700 mb-4">Proxies Ativos</h4>
              <div className="overflow-hidden border border-slate-100 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-4 font-bold">Nome</th>
                      <th className="p-4 font-bold">Host:Porta</th>
                      <th className="p-4 font-bold">Protocolo</th>
                      <th className="p-4 font-bold">Autenticação</th>
                      <th className="p-4 font-bold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proxies.length === 0 ? (
                      <tr><td colSpan={5} className="p-6 text-center text-slate-400">Nenhum proxy cadastrado.</td></tr>
                    ) : proxies.map(proxy => (
                      <tr key={proxy.id} className="border-t border-slate-50">
                        <td className="p-4 font-medium text-slate-800">{proxy.name}</td>
                        <td className="p-4 text-slate-500 font-mono">{proxy.host}:{proxy.port}</td>
                        <td className="p-4 text-slate-500 uppercase">{proxy.protocol}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${proxy.username ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>{proxy.username ? 'COM AUTH' : 'SEM AUTH'}</span></td>
                        <td className="p-4"><button onClick={() => handleDeleteProxy(proxy.id)} className="text-red-500 font-bold hover:underline">Remover</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}