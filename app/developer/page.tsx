'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Toast } from '@/components/ui/toast';
import { ProxyNode, ProxyFormData } from '@/components/developer/types';
import { DeveloperHeader } from '@/components/developer/DeveloperHeader';
import { DeveloperTabs } from '@/components/developer/DeveloperTabs';
import { EvolutionCard } from '@/components/developer/EvolutionCard';
import { CloudflareCard } from '@/components/developer/CloudflareCard';
import { ProxyForm } from '@/components/developer/ProxyForm';
import { ProxiesTable } from '@/components/developer/ProxiesTable';

export const dynamic = 'force-dynamic';

export default function DeveloperPage() {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
  const [activeTab, setActiveTab] = useState<'providers' | 'proxies'>('providers');
  
  // Feedback System (Toast)
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Estados para Proxies
  const [proxies, setProxies] = useState<ProxyNode[]>([]);
  const [loadingProxies, setLoadingProxies] = useState(false);
  const [proxyForm, setProxyForm] = useState<ProxyFormData>({ name: '', host: '', port: '', username: '', password: '', protocol: 'http' });

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
    if (!window.confirm('Tem a certeza que deseja eliminar este proxy?')) return;
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
        
        {toast && <Toast type={toast.type} message={toast.message} />}

        <DeveloperHeader />

        <div className="px-6 md:px-8 pb-12 flex flex-col gap-6 animate-in fade-in duration-500">
          
          <DeveloperTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {activeTab === 'providers' ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              <EvolutionCard 
                evoBaseUrl={evoBaseUrl} setEvoBaseUrl={setEvoBaseUrl}
                evoApiKey={evoApiKey} setEvoApiKey={setEvoApiKey}
                isSavingProviders={isSavingProviders} handleSaveEvo={handleSaveEvo}
              />
              <CloudflareCard 
                cfAccountId={cfAccountId} setCfAccountId={setCfAccountId}
                cfBucket={cfBucket} setCfBucket={setCfBucket}
                cfAccessKey={cfAccessKey} setCfAccessKey={setCfAccessKey}
                cfSecretKey={cfSecretKey} setCfSecretKey={setCfSecretKey}
                cfPublicUrl={cfPublicUrl} setCfPublicUrl={setCfPublicUrl}
                isSavingProviders={isSavingProviders} handleSaveCf={handleSaveCf}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              <ProxyForm 
                proxyForm={proxyForm} setProxyForm={setProxyForm}
                loadingProxies={loadingProxies} handleSaveProxy={handleSaveProxy}
              />
              <ProxiesTable 
                proxies={proxies} handleDeleteProxy={handleDeleteProxy} 
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}