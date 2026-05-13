'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { Toast } from '@/components/ui/toast'; // Reutilizando do refatoramento anterior
import { User, type PasswordResetRequestRow } from '@/components/usuarios/types';
import { UsuariosHeader } from '@/components/usuarios/UsuariosHeader';
import { UsuariosTable } from '@/components/usuarios/UsuariosTable';
import { UserFormModal } from '@/components/usuarios/UserFormModal';
import { DeleteUserModal } from '@/components/usuarios/DeleteUserModal';
import { PendingUsersPanel } from '@/components/usuarios/PendingUsersPanel';
import { PasswordResetRequestsPanel } from '@/components/usuarios/PasswordResetRequestsPanel';
import {
  UsuariosSectionTabs,
  type UsuariosAdminSection,
} from '@/components/usuarios/UsuariosSectionTabs';
import { apiRequest } from '@/lib/api-client';

const PAGE_SIZE = 8;

export const dynamic = 'force-dynamic';

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [passwordResetRequests, setPasswordResetRequests] = useState<PasswordResetRequestRow[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<string>('USER');

  // Estados de Feedback (Notificações)
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form States
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('USER');
  const [isSaving, setIsSaving] = useState(false);

  // Modal de Confirmação de Remoção
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [tablePage, setTablePage] = useState(0);
  const [adminSection, setAdminSection] = useState<UsuariosAdminSection>('users');

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  const fetchPasswordResetRequests = async () => {
    try {
      const data = await apiRequest<PasswordResetRequestRow[]>('/users/password-reset-requests');
      setPasswordResetRequests(Array.isArray(data) ? data : []);
    } catch {
      setPasswordResetRequests([]);
    }
  };

  const fetchPending = async () => {
    try {
      const data = await apiRequest<User[]>('/users/pending');
      setPendingUsers(Array.isArray(data) ? data : []);
    } catch {
      setPendingUsers([]);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<User[]>('/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) { 
      showFeedback('error', "Erro ao carregar a lista de utilizadores.");
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    fetchUsers();
    apiRequest('/users/me')
      .then((u: { id?: string; role?: string }) => {
        setViewerId(u.id ?? null);
        setViewerRole(u.role || 'USER');
        if (u.role === 'ADMIN' || u.role === 'DEVELOPER') {
          void fetchPending();
          void fetchPasswordResetRequests();
        }
      })
      .catch(() => {});
  }, []);

  const isAdmin = viewerRole === 'ADMIN' || viewerRole === 'DEVELOPER';

  useEffect(() => {
    if (!isAdmin) return;
    if (adminSection === 'pending') void fetchPending();
    if (adminSection === 'password') void fetchPasswordResetRequests();
  }, [adminSection, isAdmin]);

  const openModal = (user?: User) => {
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
  };

  const handleSave = async () => {
    if (!formName || !formEmail) return showFeedback('error', "Nome e e-mail são obrigatórios.");
    if (!editingUser && !formPassword) return showFeedback('error', "A palavra-passe é obrigatória para novos utilizadores.");

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
        body: JSON.stringify(body)
      });
      setIsModalOpen(false);
      fetchUsers();
      if (viewerRole === 'ADMIN' || viewerRole === 'DEVELOPER') {
        void fetchPending();
        void fetchPasswordResetRequests();
      }
      showFeedback('success', editingUser ? "Utilizador atualizado com sucesso!" : "Novo utilizador adicionado à equipa!");
    } catch (err: unknown) { 
      const msg = err instanceof Error ? err.message : "Erro de ligação ao servidor.";
      showFeedback('error', msg);
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await apiRequest(`/users/${userToDelete.id}`, { method: 'DELETE' });
      showFeedback('success', "Utilizador removido da equipa.");
      setUserToDelete(null);
      fetchUsers();
      if (viewerRole === 'ADMIN' || viewerRole === 'DEVELOPER') {
        void fetchPending();
        void fetchPasswordResetRequests();
      }
    } catch (err: unknown) { 
      const msg = err instanceof Error ? err.message : "Erro de ligação ao servidor.";
      showFeedback('error', msg);
    }
  };

  const handleApprovePending = async (userId: string) => {
    setApprovingId(userId);
    try {
      await apiRequest(`/users/pending/${userId}/approve`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      showFeedback('success', 'Utilizador aprovado. Já pode iniciar sessão.');
      void fetchPending();
      void fetchPasswordResetRequests();
      void fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao aprovar.';
      showFeedback('error', msg);
    } finally {
      setApprovingId(null);
    }
  };

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

  return (
    <div className="flex h-screen overflow-hidden bg-brand-canvas font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden overflow-y-auto no-scrollbar selection:bg-brand-100 selection:text-brand-900">
        
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onDismiss={() => setToast(null)}
          />
        )}

        <UsuariosHeader 
          totalUsers={users.length}
          pendingCount={isAdmin ? pendingUsers.length : 0}
          passwordResetCount={isAdmin ? passwordResetRequests.length : 0}
          showToolbar={!isAdmin || adminSection === 'users'}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onNewUser={() => openModal()}
        />

        {isAdmin && (
          <UsuariosSectionTabs
            value={adminSection}
            onChange={setAdminSection}
            pendingCount={pendingUsers.length}
            passwordResetCount={passwordResetRequests.length}
          />
        )}

        {isAdmin && adminSection === 'pending' && (
          <div className="mx-6 md:mx-8">
            <PendingUsersPanel
              users={pendingUsers}
              approvingId={approvingId}
              onApprove={handleApprovePending}
            />
          </div>
        )}

        {isAdmin && adminSection === 'password' && (
          <div className="mx-6 md:mx-8">
            <PasswordResetRequestsPanel
              requests={passwordResetRequests}
              onCompleted={() => {
                void fetchPasswordResetRequests();
                void fetchUsers();
              }}
              showFeedback={showFeedback}
            />
          </div>
        )}

        {(!isAdmin || adminSection === 'users') && (
          <UsuariosTable 
            isLoading={isLoading}
            users={paginatedUsers}
            onEdit={openModal}
            onDelete={setUserToDelete}
            pagination={{
              page: tablePage,
              pageSize: PAGE_SIZE,
              total: filteredUsers.length,
              onPageChange: setTablePage,
            }}
          />
        )}

      </main>

      {isModalOpen && (
        <UserFormModal 
          viewerRole={viewerRole}
          editingUser={editingUser}
          formName={formName}
          setFormName={setFormName}
          formEmail={formEmail}
          setFormEmail={setFormEmail}
          formRole={formRole}
          setFormRole={setFormRole}
          formPassword={formPassword}
          setFormPassword={setFormPassword}
          isSaving={isSaving}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {userToDelete && (
        <DeleteUserModal 
          user={userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={handleDelete}
        />
      )}

    </div>
  );
}