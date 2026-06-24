'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProxyNode, ProxyFormData } from '@/components/developer/types';
import { apiRequest } from '@/lib/api-client';

export function useDeveloperProxies(showFeedback: (type: 'success' | 'error', message: string) => void) {
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

  const fetchProxies = useCallback(async () => {
    try {
      const data = await apiRequest<ProxyNode[]>('/proxies');
      setProxies(Array.isArray(data) ? data : []);
    } catch {
      showFeedback('error', 'Erro ao carregar proxies.');
    }
  }, [showFeedback]);

  useEffect(() => {
    void fetchProxies();
  }, [fetchProxies]);

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

  return {
    proxies,
    loadingProxies,
    proxyForm,
    setProxyForm,
    handleSaveProxy,
    handleDeleteProxy,
  };
}
