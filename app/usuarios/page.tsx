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

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form States
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('USER');
  const [isSaving, setIsSaving] = useState(false);

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${baseUrl}/users`);
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
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
    if (!formName || !formEmail) return alert("Nome e Email são obrigatórios.");
    if (!editingUser && !formPassword) return alert("A senha é obrigatória para novos usuários.");

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
      } else {
        const err = await res.json();
        alert(err.message || "Erro ao salvar.");
      }
    } catch (err) { console.error(err); } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que deseja remover este usuário? Esta ação é irreversível.")) return;
    try {
      const res = await fetch(`${baseUrl}/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
    } catch (err) { console.error(err); }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return <span className="bg-red-100 text-red-700 font-bold px-2 py-1 rounded text-xs">Administrador</span>;
      case 'DEVELOPER': return <span className="bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded text-xs">Developer</span>;
      default: return <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-xs">Usuário Comum</span>;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f5f7] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[80px] md:pt-0 h-full relative overflow-hidden">
        
        <header className="px-6 py-5 bg-white border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Equipa e Acessos</h1>
            <p className="text-slate-500 text-sm mt-1">Gira os utilizadores e permissões do sistema.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="bg-slate-50 border border-slate-200 rounded-xl flex items-center px-4 h-10 w-full md:w-[250px] shadow-sm focus-within:border-[#1FA84A] transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
              <input type="text" placeholder="Procurar nome ou email..." className="bg-transparent border-none outline-none w-full pl-2 text-sm text-slate-700" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <button onClick={() => openModal()} className="h-10 px-4 bg-[#1FA84A] text-white font-bold rounded-lg hover:bg-green-600 transition-colors shadow-sm flex items-center gap-2 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Novo Usuário
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-5xl mx-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[12px] uppercase tracking-wider font-bold">
                  <th className="p-4 pl-6">Nome</th>
                  <th className="p-4">E-mail</th>
                  <th className="p-4">Nível de Acesso</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-400">A carregar equipa...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-400 font-medium">Nenhum utilizador encontrado.</td></tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-800 text-[14px]">{user.name}</td>
                      <td className="p-4 text-slate-600 text-[14px]">{user.email}</td>
                      <td className="p-4">{getRoleBadge(user.role)}</td>
                      <td className="p-4 flex items-center justify-center gap-2">
                        <button onClick={() => openModal(user)} className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded text-xs font-bold transition-colors">Editar</button>
                        <button onClick={() => handleDelete(user.id)} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded text-xs font-bold transition-colors">Remover</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL DE CRIAÇÃO/EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-slate-800">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1FA84A]" value={formName} onChange={e => setFormName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
                <input type="email" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1FA84A]" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nível de Acesso</label>
                <select className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1FA84A]" value={formRole} onChange={e => setFormRole(e.target.value)}>
                  <option value="USER">Usuário Comum (Atendimento)</option>
                  <option value="ADMIN">Administrador (Gestão Total)</option>
                  <option value="DEVELOPER">Developer (Acesso Técnico)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Senha {editingUser && <span className="text-slate-400 font-normal">(Deixe em branco para não alterar)</span>}</label>
                <input type="password" placeholder="••••••••" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1FA84A]" value={formPassword} onChange={e => setFormPassword(e.target.value)} />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={isSaving} className="bg-[#1FA84A] text-white px-6 py-2 rounded-lg font-bold hover:bg-green-600 shadow-sm transition-colors disabled:opacity-50">
                {isSaving ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}