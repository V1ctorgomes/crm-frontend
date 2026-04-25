'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

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
    if (!formName || !formEmail) return showFeedback('error', "Nome e E-mail são obrigatórios.");
    if (!editingUser && !formPassword) return showFeedback('error', "A senha é obrigatória para novos utilizadores.");

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
        showFeedback('success', editingUser ? "Utilizador atualizado!" : "Utilizador criado com sucesso!");
      } else {
        const err = await res.json();
        showFeedback('error', err.message || "Erro ao guardar alterações.");
      }
    } catch (err) { 
      showFeedback('error', "Erro de conexão ao servidor.");
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
        return <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-rose-50 text-rose-600 uppercase tracking-widest border border-rose-100">Administrador</span>;
      case 'DEVELOPER': 
        return <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-purple-50 text-purple-600 uppercase tracking-widest border border-purple-100">Developer</span>;
      default: 
        return <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-600 uppercase tracking-widest border border-blue-100">Utilizador</span>;
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-blue-100 to-blue-50 text-blue-600 border-blue-200',
      'from-emerald-100 to-emerald-50 text-emerald-600 border-emerald-200',
      'from-amber-100 to-amber-50 text-amber-600 border-amber-200',
      'from-purple-100 to-purple-50 text-purple-600 border-purple-200',
      'from-rose-100 to-rose-50 text-rose-600 border-rose-200'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f6] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 pt-[80px] md:pt-10">
        <div className="max-w-7xl mx-auto">
          
          {/* TOAST NOTIFICATION - CANTO SUPERIOR DIREITO */}
          {toast && (
            <div className={`fixed top-10 right-10 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300`}>
              <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-white border-green-100 text-green-700' : 'bg-white border-red-100 text-red-700'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {toast.type === 'success' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                  )}
                </div>
                <span className="font-bold text-sm">{toast.message}</span>
              </div>
            </div>
          )}

          {/* CABEÇALHO DA PÁGINA */}
          <header className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gestão de Acessos</span>
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Equipa do Sistema</h1>
              <p className="text-slate-500 mt-1 font-medium">Gira os utilizadores, permissões e contas de acesso ({users.length} no total).</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
              <div className="bg-white border border-slate-200/80 rounded-2xl flex items-center px-4 h-12 w-full sm:w-[320px] shadow-sm focus-within:border-[#1FA84A] focus-within:ring-4 focus-within:ring-[#1FA84A]/10 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-400 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                <input 
                  type="text" 
                  placeholder="Procurar nome ou e-mail..." 
                  className="bg-transparent border-none outline-none w-full pl-3 text-sm font-medium text-slate-700 placeholder:text-slate-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button 
                onClick={() => openModal()} 
                className="w-full sm:w-auto h-12 px-6 bg-[#1FA84A] text-white font-bold rounded-2xl hover:bg-green-600 hover:shadow-lg transition-all shadow-md flex items-center justify-center gap-2 text-sm shrink-0 whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Novo Utilizador
              </button>
            </div>
          </header>

          {/* TABELA DE UTILIZADORES */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Membro</th>
                    <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">E-mail</th>
                    <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Acesso</th>
                    <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="p-16 text-center">
                        <div className="w-10 h-10 border-4 border-[#1FA84A] border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-sm"></div>
                        <p className="text-slate-500 font-bold">A carregar a equipa...</p>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-16 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                        </div>
                        <h4 className="font-bold text-slate-700 text-lg">Nenhum utilizador encontrado</h4>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-full bg-gradient-to-br border flex items-center justify-center font-bold shadow-sm ${getAvatarColor(user.name)}`}>
                              {user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-800 text-[15px]">{user.name}</div>
                              <div className="text-[11px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wide">
                                Membro desde {new Date(user.createdAt).toLocaleDateString('pt-PT')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-slate-600 font-medium text-[14px]">{user.email}</span>
                        </td>
                        <td className="py-4 px-6">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openModal(user)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors" title="Editar">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </button>
                            <button onClick={() => setUserToDelete(user)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors" title="Remover">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
          <div 
            className="bg-white rounded-3xl shadow-2xl flex flex-col w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100" 
            onClick={e => e.stopPropagation()}
          >
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${editingUser ? 'bg-blue-50 text-blue-500' : 'bg-[#e8f6ea] text-[#1FA84A]'}`}>
                  {editingUser ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M18 19.5v-1.5c0-1.657-1.343-3-3-3h-6c-1.657 0-3 1.343-3 3v1.5m15-1.5c0 3.314-2.686 6-6 6h-6c-3.314 0-6-2.686-6-6m15 1.5H3M12 11.25a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z" /></svg>
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">{editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{editingUser ? 'Atualizar Dados' : 'Adicionar à Equipa'}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 flex flex-col gap-6 bg-white">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Nome Completo</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 outline-none focus:bg-white focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all shadow-sm"
                  value={formName} 
                  onChange={e => setFormName(e.target.value)} 
                  placeholder="Ex: Maria Santos"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">E-mail de Acesso</label>
                <input 
                  type="email" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 outline-none focus:bg-white focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all shadow-sm"
                  value={formEmail} 
                  onChange={e => setFormEmail(e.target.value)} 
                  placeholder="maria@empresa.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Nível de Permissão</label>
                <div className="relative">
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 outline-none focus:bg-white focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all shadow-sm appearance-none cursor-pointer"
                    value={formRole} 
                    onChange={e => setFormRole(e.target.value)}
                  >
                    <option value="USER">Utilizador (Atendimento)</option>
                    <option value="ADMIN">Administrador (Gestão Total)</option>
                    <option value="DEVELOPER">Developer (Acesso Técnico)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Senha {editingUser && <span className="text-slate-400 font-medium normal-case">(Opcional - Deixe em branco para manter)</span>}
                </label>
                <input 
                  type="password" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 outline-none focus:bg-white focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all shadow-sm"
                  placeholder="••••••••" 
                  value={formPassword} 
                  onChange={e => setFormPassword(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200/50 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving} 
                className={`text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center min-w-[140px] shadow-md hover:shadow-lg transition-all disabled:opacity-70 text-sm ${editingUser ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#1FA84A] hover:bg-green-600'}`}
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : editingUser ? "Salvar Alterações" : "Criar Utilizador"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE REMOÇÃO */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setUserToDelete(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="p-8 text-center bg-gradient-to-b from-white to-slate-50">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Remover Membro?</h3>
              <p className="text-[15px] font-medium text-slate-500 leading-relaxed px-2">Tem a certeza que deseja remover <b>{userToDelete.name}</b> da equipa? Esta ação é irreversível.</p>
            </div>
            <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button onClick={() => setUserToDelete(null)} className="flex-1 px-5 py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 bg-red-500 text-white px-5 py-3.5 rounded-xl font-bold text-sm hover:bg-red-600 transition-all shadow-md">Sim, Eliminar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}