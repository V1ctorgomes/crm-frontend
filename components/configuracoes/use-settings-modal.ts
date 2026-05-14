'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import type { Instance, ProxyNode } from './types';

export type SettingsTab = 'perfil' | 'conexoes' | 'notificacoes';

export type SettingsConfirmState = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
} | null;

export function useSettingsModal() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('perfil');

  const [userData, setUserData] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [instances, setInstances] = useState<Instance[]>([]);
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
      const data = await apiRequest('/proxies');
      setAvailableProxies(data);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchInstances = useCallback(async (userId?: string) => {
    try {
      const resolvedUserId = userId || (await apiRequest('/users/me')).id;
      const list = await apiRequest(`/instances/user/${resolvedUserId}`);
      setInstances(list);
    } catch {
      /* ignore */
    } finally {
      setIsInstancesLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchSettingsData = async () => {
      const userPromise = apiRequest('/users/me').catch(() => null);
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
      setIsCreatingInstance(true);

      try {
        const me = await apiRequest('/users/me');
        const payload: Record<string, unknown> = { name: newInstanceName, userId: me.id };
        if (selectedProxyId) {
          const selectedProxy = availableProxies.find((p) => p.id === selectedProxyId);
          if (selectedProxy) {
            payload.proxyHost = selectedProxy.host;
            payload.proxyPort = String(selectedProxy.port);
            payload.proxyUser = selectedProxy.username;
            payload.proxyPass = selectedProxy.password;
            payload.proxyProto = selectedProxy.protocol;
          }
        }

        await apiRequest('/instances', { method: 'POST', body: JSON.stringify(payload) });
        setNewInstanceName('');
        setSelectedProxyId('');
        await fetchInstances();
        showFeedback('success', 'Instância criada com sucesso!');
      } catch {
        showFeedback('error', 'Erro de conexão com o servidor.');
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
        onConfirm: async () => {
          try {
            await apiRequest(`/instances/${encodeURIComponent(instanceName)}`, { method: 'DELETE' });
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
        const data = await apiRequest(`/instances/connect/${name}`);
        setQrCodeData(data);
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
