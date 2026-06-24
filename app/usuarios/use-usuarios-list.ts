'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { User, type PasswordResetRequestRow } from '@/components/usuarios/types';
import type { UsuariosAdminSection } from '@/components/usuarios/UsuariosSectionTabs';
import { apiRequest } from '@/lib/api-client';

export const PAGE_SIZE = 8;

type ShowFeedback = (type: 'success' | 'error', message: string) => void;

export function useUsuariosList(showFeedback: ShowFeedback) {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [passwordResetRequests, setPasswordResetRequests] = useState<PasswordResetRequestRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<string>('USER');
  const [tablePage, setTablePage] = useState(0);
  const [adminSection, setAdminSection] = useState<UsuariosAdminSection>('users');

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

  const isAdmin = viewerRole === 'ADMIN' || viewerRole === 'DEVELOPER';

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

  return {
    users,
    pendingUsers,
    passwordResetRequests,
    isLoading,
    searchTerm,
    setSearchTerm,
    viewerId,
    setViewerId,
    viewerRole,
    setViewerRole,
    tablePage,
    setTablePage,
    adminSection,
    setAdminSection,
    isAdmin,
    fetchUsers,
    fetchPending,
    fetchPasswordResetRequests,
    filteredUsers,
    paginatedUsers,
  };
}
