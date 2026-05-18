'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { User, type PasswordResetRequestRow } from '@/components/usuarios/types';
import type { UsuariosAdminSection } from '@/components/usuarios/UsuariosSectionTabs';
import { apiRequest, apiDelete } from '@/lib/api-client';

const PAGE_SIZE = 8;

export function useUsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [passwordResetRequests, setPasswordResetRequests] = useState<PasswordResetRequestRow[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<string>('USER');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('USER');
  const [isSaving, setIsSaving] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [tablePage, setTablePage] = useState(0);
  const [adminSection, setAdminSection] = useState<UsuariosAdminSection>('users');

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  }, []);

  const fetchPasswordResetRequests = useCallback(async () => {
    try {
      const data = await apiRequest<PasswordResetRequestRow[]>('/users/password-reset-requests');
      setPasswordResetRequests(Array.isArray(data) ? data : []);
    } catch {
      setPasswordResetRequests([]);
    }
  }, []);

  const fetchPending = useCallback(async () => {
    try {
      const data = await apiRequest<User[]>('/users/pending');
      setPendingUsers(Array.isArray(data) ? data : []);
    } catch {
      setPendingUsers([]);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<User[]>('/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      showFeedback('error', 'Erro ao carregar a lista de usuarios.');
    } finally {
      setIsLoading(false);
    }
  }, [showFeedback]);

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
        }
      })
      .catch(() => {});
  }, [fetchUsers, fetchPending, fetchPasswordResetRequests]);

  const isAdmin = viewerRole === 'ADMIN' || viewerRole === 'DEVELOPER';

  useEffect(() => {
    if (!isAdmin) return;
    if (adminSection === 'pending') void fetchPending();
    if (adminSection === 'password') void fetchPasswordResetRequests();
  }, [adminSection, isAdmin, fetchPending, fetchPasswordResetRequests]);

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
    if (viewerRole === 'DEVELOPER') {
      body.role = formRole;
    } else if (viewerRole === 'ADMIN') {
      if (!editingUser) {
        body.role = 'USER';
      } else if (viewerId && editingUser.id !== viewerId) {
        body.role = 'USER';
      }
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

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [users, searchTerm],
  );

  useEffect(() => {
    setTablePage(0);
  }, [searchTerm]);

  useEffect(() => {
    setTablePage((p) => {
      const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
      return Math.min(p, totalPages - 1);
    });
  }, [filteredUsers.length]);

  const paginatedUsers = useMemo(() => {
    const start = tablePage * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, tablePage]);

  const onPasswordPanelCompleted = useCallback(() => {
    void fetchPasswordResetRequests();
    void fetchUsers();
  }, [fetchPasswordResetRequests, fetchUsers]);

  return {
    PAGE_SIZE,
    users,
    pendingUsers,
    passwordResetRequests,
    approvingId,
    isLoading,
    searchTerm,
    setSearchTerm,
    viewerRole,
    toast,
    setToast,
    showFeedback,
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
    tablePage,
    setTablePage,
    adminSection,
    setAdminSection,
    isAdmin,
    openModal,
    handleSave,
    handleDelete,
    handleApprovePending,
    filteredUsers,
    paginatedUsers,
    onPasswordPanelCompleted,
  };
}
