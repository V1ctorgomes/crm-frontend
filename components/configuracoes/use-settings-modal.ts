'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SettingsConfirmState, SettingsTab } from './types';
import { useSettingsProfile } from './use-settings-profile';
import { useSettingsConnections } from './use-settings-connections';

export type { SettingsConfirmState, SettingsTab };

export function useSettingsModal() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('perfil');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<SettingsConfirmState>(null);

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  }, []);

  const profile = useSettingsProfile(showFeedback);
  const connections = useSettingsConnections(showFeedback, setConfirmModal);

  useEffect(() => {
    const load = async () => {
      const currentUser = await profile.loadProfile();
      await connections.fetchProxies();
      if (currentUser?.id) {
        await connections.fetchInstances(currentUser.id);
      } else {
        connections.setIsInstancesLoading(false);
      }
    };
    void load();
  }, []);

  return {
    activeTab,
    setActiveTab,
    toast,
    setToast,
    confirmModal,
    setConfirmModal,
    showFeedback,
    ...profile,
    ...connections,
  };
}
