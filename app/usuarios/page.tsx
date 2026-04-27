'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Toast } from '@/components/ui/toast'; // Reutilizando do refatoramento anterior
import { User } from '@/components/usuarios/types';
import { UsuariosHeader } from '@/components/usuarios/UsuariosHeader';
import { UsuariosTable } from '@/components/usuarios/UsuariosTable';
import { UserFormModal } from '@/components/usuarios/UserFormModal';
import { DeleteUserModal } from '@/components/usuarios/DeleteUserModal';

export const dynamic = 'force-dynamic';

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${baseUrl}/users`);
      if (res.ok) setUsers(await res.json());
    } catch (err) { 
      showFeedback('error', "Erro ao carregar a lista de utilizadores.");
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => { fetchUsers(); }, []);

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
    const body = { name: formName, email: formEmail, role: formRole, password: formPassword };
    const method = editingUser ? 'PUT' : 'POST';
    const url = editingUser ? `${baseUrl}/users/${editingUser.id}` : `${baseUrl}/users`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchUsers();
        showFeedback('success', editingUser ? "Utilizador atualizado com sucesso!" : "Novo utilizador adicionado à equipa!");
      } else {
        const err = await res.json();
        showFeedback('error', err.message || "Erro ao guardar alterações.");
      }
    } catch (err) { 
      showFeedback('error', "Erro de ligação ao servidor.");
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`${baseUrl}/users/${userToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        showFeedback('success', "Utilizador removido da equipa.");
        setUserToDelete(null);
        fetchUsers();
      } else {
        showFeedback('error', "Não foi possível remover este utilizador.");
      }
    } catch (err) { 
      showFeedback('error', "Erro de ligação ao servidor.");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden overflow-y-auto no-scrollbar selection:bg-blue-100 selection:text-blue-900">
        
        {toast && <Toast type={toast.type} message={toast.message} />}

        <UsuariosHeader 
          totalUsers={users.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onNewUser={() => openModal()}
        />

        <UsuariosTable 
          isLoading={isLoading}
          users={filteredUsers}
          onEdit={openModal}
          onDelete={setUserToDelete}
        />

      </main>

      {isModalOpen && (
        <UserFormModal 
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