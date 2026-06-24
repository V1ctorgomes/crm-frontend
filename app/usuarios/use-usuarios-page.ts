'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { PAGE_SIZE, useUsuariosList } from './use-usuarios-list';
import { useUsuariosMutations } from './use-usuarios-mutations';
import { useUsuariosDeletions } from './use-usuarios-deletions';

export function useUsuariosPage() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  }, []);

  const list = useUsuariosList(showFeedback);
  const mutations = useUsuariosMutations(showFeedback, list);
  const deletions = useUsuariosDeletions(showFeedback);

  const {
    fetchUsers,
    fetchPending,
    fetchPasswordResetRequests,
    setViewerId,
    setViewerRole,
    isAdmin,
    adminSection,
  } = list;
  const { fetchDeletionAudits } = deletions;

  useEffect(() => {
    void fetchUsers();
    apiRequest<{ id?: string; role?: string } | null>('/users/me')
      .then((u) => {
        if (!u) return;
        setViewerId(u.id ?? null);
        setViewerRole(u.role || 'USER');
        if (u.role === 'ADMIN' || u.role === 'DEVELOPER') {
          void fetchPending();
          void fetchPasswordResetRequests();
          void fetchDeletionAudits();
        }
      })
      .catch(() => undefined);
  }, [fetchUsers, fetchPending, fetchPasswordResetRequests, fetchDeletionAudits, setViewerId, setViewerRole]);

  useEffect(() => {
    if (!isAdmin) return;
    if (adminSection === 'pending') void fetchPending();
    if (adminSection === 'password') void fetchPasswordResetRequests();
    if (adminSection === 'reverts') void fetchDeletionAudits();
  }, [adminSection, isAdmin, fetchPending, fetchPasswordResetRequests, fetchDeletionAudits]);

  return {
    PAGE_SIZE,
    toast,
    setToast,
    showFeedback,
    ...list,
    ...mutations,
    ...deletions,
  };
}

export type UsuariosPageViewModel = ReturnType<typeof useUsuariosPage>;
