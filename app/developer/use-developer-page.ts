'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProxyNode, ProxyFormData } from '@/components/developer/types';
import { apiRequest } from '@/lib/api-client';

export type DeveloperTab = 'providers' | 'proxies' | 'catalogo';

export function useDeveloperPage() {
  const [activeTab, setActiveTab] = useState<DeveloperTab>('providers');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [proxies, setProxies] = useState<ProxyNode[]>([]);
  const [loadingProxies, setLoadingProxies] = useState(false);
  const [proxyForm, setProxyForm] = useState<ProxyFormData>({
    name: '',
    host: '',
    port: '',
    username: '',
    password: '',
    protocol: 'http',
  });

  const [evoBaseUrl, setEvoBaseUrl] = useState('');
  const [evoApiKey, setEvoApiKey] = useState('');
  const [cfAccountId, setCfAccountId] = useState('');
  const [cfBucket, setCfBucket] = useState('');
  const [cfAccessKey, setCfAccessKey] = useState('');
  const [cfSecretKey, setCfSecretKey] = useState('');
  const [cfPublicUrl, setCfPublicUrl] = useState('');
  const [isSavingProviders, setIsSavingProviders] = useState(false);

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  }, []);

  const fetchProxies = useCallback(async () => {
    try {
      const data = await apiRequest<ProxyNode[]>('/proxies');
      setProxies(Array.isArray(data) ? data : []);
    } catch {
      showFeedback('error', 'Erro ao carregar proxies.');
    }
  }, [showFeedback]);

  const fetchProviders = useCallback(async () => {
    try {
      const [evo, cf] = await Promise.all([
        apiRequest<Record<string, unknown>>('/providers/evolution').catch(() => null),
        apiRequest<Record<string, unknown>>('/providers/cloudflare').catch(() => null),
      ]);
      const evoRec = evo && typeof evo === 'object' ? evo : null;
      const cfRec = cf && typeof cf === 'object' ? cf : null;
      if (evoRec) {
        if (typeof evoRec.baseUrl === 'string') setEvoBaseUrl(evoRec.baseUrl);
        if (typeof evoRec.apiKey === 'string') setEvoApiKey(evoRec.apiKey);
      }
      if (cfRec) {
        if (typeof cfRec.accountId === 'string') setCfAccountId(cfRec.accountId);
        if (typeof cfRec.bucket === 'string') setCfBucket(cfRec.bucket);
        if (typeof cfRec.apiKey === 'string') setCfAccessKey(cfRec.apiKey);
        if (typeof cfRec.apiToken === 'string') setCfSecretKey(cfRec.apiToken);
        if (typeof cfRec.baseUrl === 'string') setCfPublicUrl(cfRec.baseUrl);
      }
    } catch {
      showFeedback('error', 'Erro ao carregar configurações dos provedores.');
    }
  }, [showFeedback]);

  useEffect(() => {
    void fetchProxies();
    void fetchProviders();
  }, [fetchProxies, fetchProviders]);

  const handleSaveProxy = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoadingProxies(true);
      try {
        await apiRequest('/proxies', {
          method: 'POST',
          body: JSON.stringify(proxyForm),
        });
        setProxyForm({ name: '', host: '', port: '', username: '', password: '', protocol: 'http' });
        void fetchProxies();
        showFeedback('success', 'Proxy adicionado à rede com sucesso.');
      } catch {
        showFeedback('error', 'Erro de conexão ao salvar proxy.');
      }
      setLoadingProxies(false);
    },
    [proxyForm, fetchProxies, showFeedback],
  );

  const handleDeleteProxy = useCallback(
    async (id: string) => {
      if (!window.confirm('Tem a certeza que deseja eliminar este proxy?')) return;
      try {
        await apiRequest(`/proxies/${id}`, { method: 'DELETE' });
        void fetchProxies();
        showFeedback('success', 'Proxy removido da infraestrutura.');
      } catch {
        showFeedback('error', 'Erro ao eliminar proxy.');
      }
    },
    [fetchProxies, showFeedback],
  );

  const handleSaveEvo = useCallback(async () => {
    setIsSavingProviders(true);
    try {
      await apiRequest('/providers/evolution', {
        method: 'POST',
        body: JSON.stringify({ baseUrl: evoBaseUrl, apiKey: evoApiKey }),
      });
      showFeedback('success', 'Configurações da Evolution API atualizadas!');
    } catch {
      showFeedback('error', 'Falha de conexão com o servidor.');
    }
    setIsSavingProviders(false);
  }, [evoBaseUrl, evoApiKey, showFeedback]);

  const handleSaveCf = useCallback(async () => {
    setIsSavingProviders(true);
    try {
      await apiRequest('/providers/cloudflare', {
        method: 'POST',
        body: JSON.stringify({
          accountId: cfAccountId,
          bucket: cfBucket,
          apiKey: cfAccessKey,
          apiToken: cfSecretKey,
          baseUrl: cfPublicUrl,
        }),
      });
      showFeedback('success', 'Configurações da Cloudflare atualizadas!');
    } catch {
      showFeedback('error', 'Falha de conexão com o servidor.');
    }
    setIsSavingProviders(false);
  }, [cfAccountId, cfBucket, cfAccessKey, cfSecretKey, cfPublicUrl, showFeedback]);

  return {
    activeTab,
    setActiveTab,
    toast,
    setToast,
    showFeedback,
    proxies,
    loadingProxies,
    proxyForm,
    setProxyForm,
    evoBaseUrl,
    setEvoBaseUrl,
    evoApiKey,
    setEvoApiKey,
    cfAccountId,
    setCfAccountId,
    cfBucket,
    setCfBucket,
    cfAccessKey,
    setCfAccessKey,
    cfSecretKey,
    setCfSecretKey,
    cfPublicUrl,
    setCfPublicUrl,
    isSavingProviders,
    handleSaveProxy,
    handleDeleteProxy,
    handleSaveEvo,
    handleSaveCf,
  };
}
