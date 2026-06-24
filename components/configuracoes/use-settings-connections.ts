'use client';

import { useState, useCallback } from 'react';
import { apiRequest, apiDelete } from '@/lib/api-client';
import type { Instance, InstanceHealthSnapshot, ProxyNode, SettingsConfirmState, SettingsMeUser } from './types';

type QrConnectResponse = {
  base64?: string;
  pairingCode?: string;
};

type ShowFeedback = (type: 'success' | 'error', message: string) => void;

export function useSettingsConnections(
  showFeedback: ShowFeedback,
  setConfirmModal: React.Dispatch<React.SetStateAction<SettingsConfirmState>>,
) {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [instancesHealth, setInstancesHealth] = useState<Record<string, InstanceHealthSnapshot>>({});
  const [isInstancesLoading, setIsInstancesLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [availableProxies, setAvailableProxies] = useState<ProxyNode[]>([]);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [selectedProxyId, setSelectedProxyId] = useState<string>('');
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ base64?: string; pairingCode?: string } | null>(null);

  const fetchProxies = useCallback(async () => {
    try {
      const data = await apiRequest<ProxyNode[]>('/proxies');
      setAvailableProxies(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchInstancesHealth = useCallback(async () => {
    try {
      const rows = await apiRequest<InstanceHealthSnapshot[]>('/whatsapp/instances-health');
      const map: Record<string, InstanceHealthSnapshot> = {};
      for (const row of rows || []) {
        map[row.instanceName] = row;
      }
      setInstancesHealth(map);
    } catch {
      setInstancesHealth({});
    }
  }, []);

  const fetchInstances = useCallback(async (userId?: string) => {
    try {
      const me = await apiRequest<SettingsMeUser | null>('/users/me');
      const resolvedUserId = userId || me?.id;
      if (!resolvedUserId) {
        setInstances([]);
        setInstancesHealth({});
        return;
      }
      const list = await apiRequest<Instance[]>(`/instances/user/${resolvedUserId}`);
      setInstances(Array.isArray(list) ? list : []);
      await fetchInstancesHealth();
    } catch {
      /* ignore */
    } finally {
      setIsInstancesLoading(false);
    }
  }, [fetchInstancesHealth]);

  const handleCreateInstance = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newInstanceName.trim()) return;
      setIsCreatingInstance(true);

      try {
        const me = await apiRequest<SettingsMeUser | null>('/users/me');
        if (!me?.id) {
          showFeedback('error', 'Sessão inválida.');
          return;
        }
        const payload: Record<string, unknown> = {
          name: newInstanceName,
          userId: me.id,
        };

        if (selectedProxyId) {
          const selectedProxy = availableProxies.find((p) => p.id === selectedProxyId);
          if (!selectedProxy) {
            showFeedback('error', 'Proxy inválida. Recarregue a página ou adicione uma em Developer → Proxies.');
            return;
          }
          payload.proxyHost = selectedProxy.host;
          payload.proxyPort = String(selectedProxy.port);
          payload.proxyUser = selectedProxy.username;
          payload.proxyPass = selectedProxy.password;
          payload.proxyProto = selectedProxy.protocol;
        }

        await apiRequest('/instances', { method: 'POST', body: JSON.stringify(payload) });
        setNewInstanceName('');
        setSelectedProxyId('');
        await fetchInstances();
        showFeedback('success', 'Instância criada com sucesso!');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro de conexão com o servidor.';
        showFeedback('error', msg);
      } finally {
        setIsCreatingInstance(false);
      }
    },
    [newInstanceName, selectedProxyId, availableProxies, fetchInstances, showFeedback],
  );

  const handleDeleteInstance = useCallback(
    (instanceName: string) => {
      setConfirmModal({
        isOpen: true,
        title: 'Excluir Instância?',
        message: 'Tem a certeza que deseja excluir esta conexão?',
        onConfirm: async (deleteReason?: string) => {
          try {
            await apiDelete(`/instances/${encodeURIComponent(instanceName)}`, deleteReason);
            await fetchInstances();
            showFeedback('success', 'Instância removida com sucesso.');
          } catch {
            showFeedback('error', 'Erro de conexão ao remover.');
          } finally {
            setConfirmModal(null);
          }
        },
      });
    },
    [fetchInstances, showFeedback, setConfirmModal],
  );

  const handleConnectInstance = useCallback(
    async (name: string) => {
      try {
        const data = await apiRequest<QrConnectResponse | null>(`/instances/connect/${name}`);
        setQrCodeData(data && typeof data === 'object' ? data : null);
      } catch {
        showFeedback('error', 'Erro ao conectar à Evolution API.');
      }
    },
    [showFeedback],
  );

  return {
    instances,
    instancesHealth,
    isInstancesLoading,
    setIsInstancesLoading,
    selectedProvider,
    setSelectedProvider,
    availableProxies,
    newInstanceName,
    setNewInstanceName,
    selectedProxyId,
    setSelectedProxyId,
    isCreatingInstance,
    handleCreateInstance,
    handleDeleteInstance,
    handleConnectInstance,
    qrCodeData,
    setQrCodeData,
    fetchProxies,
    fetchInstances,
  };
}
