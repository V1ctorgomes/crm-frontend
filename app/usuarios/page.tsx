'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

export const dynamic = 'force-dynamic';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">Administrador</span>;
      case 'DEVELOPER': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Developer</span>;
      default: 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Utilizador</span>;
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-blue-100 to-blue-50 text-blue-700 border-blue-200',
      'from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200',
      'from-amber-100 to-amber-50 text-amber-700 border-amber-200',
      'from-purple-100 to-purple-50 text-purple-700 border-purple-200',
      'from-rose-100 to-rose-50 text-rose-700 border-rose-200'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden overflow-y-auto no-scrollbar selection:bg-blue-100 selection:text-blue-900">
        
        {/* TOAST NOTIFICATION */}
        {toast && (
          <div className="fixed top-4 right-4 md:top-8 md:right-8 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300">
            <div className="px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border bg-white border-slate-200">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {toast.type === 'success' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                )}
              </div>
              <span className="font-medium text-sm text-slate-800">{toast.message}</span>
            </div>
          </div>
        )}

        {/* CABEÇALHO DA PÁGINA */}
        <header className="px-6 md:px-8 pt-8 md:pt-10 pb-6 flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 z-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Equipa do Sistema</h1>
            <p className="text-slate-500 text-sm mt-1">Gira os utilizadores, permissões e contas de acesso ({users.length} no total).</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="bg-white border border-slate-200 rounded-md flex items-center px-3 h-10 w-full sm:w-[300px] shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 mr-2 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input 
                type="text" 
                placeholder="Procurar nome ou e-mail..." 
                className="bg-transparent border-none outline-none w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button 
              onClick={() => openModal()} 
              className="bg-slate-900 text-white px-4 h-10 rounded-md font-medium shadow hover:bg-slate-800 transition-colors text-sm flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Novo Utilizador
            </button>
          </div>
        </header>

        <div className="px-6 md:px-8 pb-12 flex flex-col gap-6 animate-in fade-in duration-500">
          
          {/* TABELA DE UTILIZADORES */}
          <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 hover:bg-slate-50/50">
                    <th className="h-12 px-4 align-middle font-medium text-slate-500">Membro</th>
                    <th className="h-12 px-4 align-middle font-medium text-slate-500">Correio Eletrónico</th>
                    <th className="h-12 px-4 align-middle font-medium text-slate-500">Acesso</th>
                    <th className="h-12 px-4 align-middle font-medium text-slate-500 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <span className="text-slate-500 font-medium text-sm">A carregar a equipa...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="h-32 text-center text-slate-500 text-sm">
                        Nenhum utilizador encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br border flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 ${getAvatarColor(user.name)}`}>
                              {user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col max-w-[150px] sm:max-w-[250px]">
                              <span className="font-semibold text-slate-900 truncate">{user.name}</span>
                              <span className="text-[12px] text-slate-500 truncate">
                                Desde {new Date(user.createdAt).toLocaleDateString('pt-PT')}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-slate-600 truncate max-w-[200px]">
                          {user.email}
                        </td>
                        <td className="p-4 align-middle">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="p-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openModal(user)} className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors" title="Editar">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                            </button>
                            <button onClick={() => setUserToDelete(user)} className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Remover">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col" onMouseDown={e => e.stopPropagation()}>
            <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100">
              <h3 className="font-semibold leading-none tracking-tight text-lg">{editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}</h3>
              <p className="text-sm text-slate-500">{editingUser ? 'Atualize as permissões ou dados do membro.' : 'Adicione um novo membro à sua equipa.'}</p>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-slate-700">Nome Completo</label>
                <input 
                  type="text" 
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50" 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Maria Santos"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-slate-700">Correio Eletrónico</label>
                <input 
                  type="email" 
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50" 
                  value={formEmail} 
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="maria@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-slate-700">Nível de Permissão</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50" 
                  value={formRole} 
                  onChange={e => setFormRole(e.target.value)}
                >
                  <option value="USER">Utilizador (Atendimento)</option>
                  <option value="ADMIN">Administrador (Gestão Total)</option>
                  <option value="DEVELOPER">Developer (Acesso Técnico)</option>
                </select>
              </div>
              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium leading-none text-slate-700">
                  Palavra-passe {editingUser && <span className="font-normal text-slate-400">(opcional)</span>}
                </label>
                <input 
                  type="password" 
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 font-mono" 
                  value={formPassword} 
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 p-6 pt-0">
              <button onClick={() => setIsModalOpen(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 h-10 px-4 py-2">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={isSaving} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-10 px-4 py-2 disabled:pointer-events-none disabled:opacity-50">
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    A guardar...
                  </>
                ) : (
                  editingUser ? 'Guardar Alterações' : 'Criar Utilizador'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE REMOÇÃO */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={() => setUserToDelete(null)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col" onMouseDown={e => e.stopPropagation()}>
            <div className="flex flex-col space-y-2 p-6 pb-4">
              <h3 className="font-semibold tracking-tight text-lg text-slate-900">Remover Membro?</h3>
              <p className="text-sm text-slate-500">
                Tem a certeza que pretende eliminar <b>{userToDelete.name}</b> da equipa? Esta ação revogará os seus acessos imediatamente.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 p-6 pt-0">
              <button onClick={() => setUserToDelete(null)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 h-10 px-4 py-2">
                Cancelar
              </button>
              <button onClick={handleDelete} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700 h-10 px-4 py-2 shadow-sm">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}