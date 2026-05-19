'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiRequest, apiDelete } from '@/lib/api-client';
import type { Instance, InstanceHealthSnapshot, ProxyNode } from './types';

type SettingsMeUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  profilePictureUrl?: string | null;
};

type QrConnectResponse = {
  base64?: string;
  pairingCode?: string;
};

export type SettingsTab = 'perfil' | 'conexoes' | 'notificacoes';

export type SettingsConfirmState = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (deleteReason?: string) => void | Promise<void>;
} | null;

export function useSettingsModal() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('perfil');

  const [userData, setUserData] = useState<SettingsMeUser | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [instances, setInstances] = useState<Instance[]>([]);
  const [instancesHealth, setInstancesHealth] = useState<Record<string, InstanceHealthSnapshot>>({});
  const [isInstancesLoading, setIsInstancesLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [availableProxies, setAvailableProxies] = useState<ProxyNode[]>([]);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [selectedProxyId, setSelectedProxyId] = useState<string>('');
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ base64?: string; pairingCode?: string } | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<SettingsConfirmState>(null);

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  }, []);

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

  useEffect(() => {
    const fetchSettingsData = async () => {
      const userPromise = apiRequest<SettingsMeUser | null>('/users/me').catch(() => null);
      const proxiesPromise = fetchProxies();
      const currentUser = await userPromise;

      if (currentUser) {
        setUserData(currentUser);
        setName(currentUser.name || '');
        setEmail(currentUser.email || '');
        if (currentUser.profilePictureUrl) setPhotoPreview(currentUser.profilePictureUrl);
      } else {
        showFeedback('error', 'Erro ao carregar usuario.');
      }
      setIsProfileLoading(false);

      await Promise.all([
        proxiesPromise,
        currentUser?.id ? fetchInstances(currentUser.id) : Promise.resolve(setIsInstancesLoading(false)),
      ]);
    };

    void fetchSettingsData();
  }, [fetchProxies, fetchInstances, showFeedback]);

  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }, []);

  const handleSaveProfile = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userData) return;
      setIsSavingProfile(true);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      if (password.trim() !== '') formData.append('password', password);
      if (photoFile) formData.append('file', photoFile);

      try {
        await apiRequest(`/users/${userData.id}`, { method: 'PUT', body: formData });
        showFeedback('success', 'Perfil atualizado com sucesso!');
        setPassword('');
      } catch {
        showFeedback('error', 'Erro de ligação ao servidor.');
      } finally {
        setIsSavingProfile(false);
      }
    },
    [userData, name, email, password, photoFile, showFeedback],
  );

  const handleCreateInstance = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newInstanceName.trim()) return;
      if (!selectedProxyId) {
        showFeedback('error', 'Selecione uma proxy. É obrigatório para criar uma linha WhatsApp.');
        return;
      }
      const selectedProxy = availableProxies.find((p) => p.id === selectedProxyId);
      if (!selectedProxy) {
        showFeedback('error', 'Proxy inválida. Recarregue a página ou adicione uma em Developer → Proxies.');
        return;
      }
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
          proxyHost: selectedProxy.host,
          proxyPort: String(selectedProxy.port),
          proxyUser: selectedProxy.username,
          proxyPass: selectedProxy.password,
          proxyProto: selectedProxy.protocol,
        };

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
    [fetchInstances, showFeedback],
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
    activeTab,
    setActiveTab,
    userData,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    photoPreview,
    fileInputRef,
    isProfileLoading,
    isSavingProfile,
    handlePhotoSelect,
    handleSaveProfile,
    instances,
    instancesHealth,
    isInstancesLoading,
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
    toast,
    setToast,
    confirmModal,
    setConfirmModal,
    showFeedback,
  };
}
