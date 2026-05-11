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
import { apiRequest } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

export default function DeveloperPage() {
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
      const data = await apiRequest('/proxies');
      setProxies(data);
    } catch (err) { 
      showFeedback('error', "Erro ao carregar proxies."); 
    }
  };

  const fetchProviders = async () => {
    try {
      const [evo, cf] = await Promise.all([
        apiRequest('/providers/evolution').catch(() => ({})),
        apiRequest('/providers/cloudflare').catch(() => ({})),
      ]);
      if (evo.baseUrl) setEvoBaseUrl(evo.baseUrl);
      if (evo.apiKey) setEvoApiKey(evo.apiKey);

      if (cf.accountId) setCfAccountId(cf.accountId);
      if (cf.bucket) setCfBucket(cf.bucket);
      if (cf.apiKey) setCfAccessKey(cf.apiKey);
      if (cf.apiToken) setCfSecretKey(cf.apiToken);
      if (cf.baseUrl) setCfPublicUrl(cf.baseUrl);
    } catch (err) { 
      showFeedback('error', "Erro ao carregar configurações dos provedores."); 
    }
  };

  const handleSaveProxy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProxies(true);
    try {
      await apiRequest('/proxies', {
        method: 'POST',
        body: JSON.stringify(proxyForm)
      });
      setProxyForm({ name: '', host: '', port: '', username: '', password: '', protocol: 'http' });
      fetchProxies();
      showFeedback('success', "Proxy adicionado à rede com sucesso.");
    } catch (err) { 
      showFeedback('error', "Erro de conexão ao salvar proxy."); 
    }
    setLoadingProxies(false);
  };

  const handleDeleteProxy = async (id: string) => {
    if (!window.confirm('Tem a certeza que deseja eliminar este proxy?')) return;
    try {
      await apiRequest(`/proxies/${id}`, { method: 'DELETE' });
      fetchProxies();
      showFeedback('success', "Proxy removido da infraestrutura.");
    } catch (err) { 
      showFeedback('error', "Erro ao eliminar proxy."); 
    }
  };

  const handleSaveEvo = async () => {
    setIsSavingProviders(true);
    try {
      await apiRequest('/providers/evolution', {
        method: 'POST',
        body: JSON.stringify({ baseUrl: evoBaseUrl, apiKey: evoApiKey })
      });
      showFeedback('success', "Configurações da Evolution API atualizadas!");
    } catch (err) { 
      showFeedback('error', "Falha de conexão com o servidor."); 
    }
    setIsSavingProviders(false);
  };

  const handleSaveCf = async () => {
    setIsSavingProviders(true);
    try {
      await apiRequest('/providers/cloudflare', {
        method: 'POST',
        body: JSON.stringify({ accountId: cfAccountId, bucket: cfBucket, apiKey: cfAccessKey, apiToken: cfSecretKey, baseUrl: cfPublicUrl })
      });
      showFeedback('success', "Configurações da Cloudflare atualizadas!");
    } catch (err) { 
      showFeedback('error', "Falha de conexão com o servidor."); 
    }
    setIsSavingProviders(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-brand-canvas font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden overflow-y-auto no-scrollbar selection:bg-brand-100 selection:text-brand-900">
        
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