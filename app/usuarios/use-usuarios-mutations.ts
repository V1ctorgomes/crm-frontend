'use client';

import { useCallback, useState } from 'react';
import { User } from '@/components/usuarios/types';
import { apiRequest, apiDelete } from '@/lib/api-client';

type ShowFeedback = (type: 'success' | 'error', message: string) => void;

type ListApi = {
  fetchUsers: () => Promise<void>;
  fetchPending: () => Promise<void>;
  fetchPasswordResetRequests: () => Promise<void>;
  viewerId: string | null;
  viewerRole: string;
};

export function useUsuariosMutations(
  showFeedback: ShowFeedback,
  list: ListApi,
) {
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('USER');
  const [isSaving, setIsSaving] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { fetchUsers, fetchPending, fetchPasswordResetRequests, viewerId, viewerRole } = list;

  const openModal = useCallback((user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormName(user.name);
      setFormEmail(user.email);
      setFormRole(user.role);
      setFormPassword('');
    } else {
      setEditingUser(null);
      setFormName('');
      setFormEmail('');
      setFormRole('USER');
      setFormPassword('');
    }
    setIsModalOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formName || !formEmail) return showFeedback('error', 'Nome e e-mail são obrigatórios.');
    if (!editingUser && !formPassword) return showFeedback('error', 'A palavra-passe é obrigatória para novos usuarios.');

    setIsSaving(true);
    const body: Record<string, string> = {
      name: formName,
      email: formEmail,
      password: formPassword,
    };
    const canAssignRole =
      viewerRole === 'DEVELOPER' ||
      (viewerRole === 'ADMIN' && (!editingUser || (viewerId != null && editingUser.id !== viewerId)));
    if (canAssignRole) {
      body.role = formRole;
    }
    if (editingUser && !formPassword.trim()) {
      delete body.password;
    }
    const method = editingUser ? 'PUT' : 'POST';
    const endpoint = editingUser ? `/users/${editingUser.id}` : `/users`;

    try {
      await apiRequest(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setIsModalOpen(false);
      void fetchUsers();
      if (viewerRole === 'ADMIN' || viewerRole === 'DEVELOPER') {
        void fetchPending();
        void fetchPasswordResetRequests();
      }
      showFeedback('success', editingUser ? 'Usuario atualizado com sucesso!' : 'Novo usuario adicionado à equipe!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro de ligação ao servidor.';
      showFeedback('error', msg);
    } finally {
      setIsSaving(false);
    }
  }, [
    formName,
    formEmail,
    formPassword,
    editingUser,
    viewerRole,
    viewerId,
    formRole,
    fetchUsers,
    fetchPending,
    fetchPasswordResetRequests,
    showFeedback,
  ]);

  const handleDelete = useCallback(async (deleteReason?: string) => {
    if (!userToDelete) return;
    try {
      await apiDelete(`/users/${userToDelete.id}`, deleteReason);
      showFeedback('success', 'Usuario removido da equipe.');
      setUserToDelete(null);
      void fetchUsers();
      if (viewerRole === 'ADMIN' || viewerRole === 'DEVELOPER') {
        void fetchPending();
        void fetchPasswordResetRequests();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro de ligação ao servidor.';
      showFeedback('error', msg);
    }
  }, [userToDelete, viewerRole, fetchUsers, fetchPending, fetchPasswordResetRequests, showFeedback]);

  const handleApprovePending = useCallback(
    async (userId: string) => {
      setApprovingId(userId);
      try {
        await apiRequest(`/users/pending/${userId}/approve`, {
          method: 'POST',
          body: JSON.stringify({}),
        });
        showFeedback('success', 'Usuario aprovado. Já pode iniciar sessão.');
        void fetchPending();
        void fetchPasswordResetRequests();
        void fetchUsers();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao aprovar.';
        showFeedback('error', msg);
      } finally {
        setApprovingId(null);
      }
    },
    [fetchPending, fetchPasswordResetRequests, fetchUsers, showFeedback],
  );

  const onPasswordPanelCompleted = useCallback(() => {
    void fetchPasswordResetRequests();
    void fetchUsers();
  }, [fetchPasswordResetRequests, fetchUsers]);

  return {
    approvingId,
    isModalOpen,
    setIsModalOpen,
    editingUser,
    formName,
    setFormName,
    formEmail,
    setFormEmail,
    formRole,
    setFormRole,
    formPassword,
    setFormPassword,
    isSaving,
    userToDelete,
    setUserToDelete,
    openModal,
    handleSave,
    handleDelete,
    handleApprovePending,
    onPasswordPanelCompleted,
  };
}
