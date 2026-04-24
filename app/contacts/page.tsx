'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

interface Contact {
  number: string;
  name: string;
  profilePictureUrl?: string;
  lastMessageTime: string;
  email?: string;
  cnpj?: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Estados do Modal
  const [isEditing, setIsEditing] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCnpj, setEditCnpj] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/whatsapp/contacts`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (err) {
      console.error("Erro ao carregar contatos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setEditName(contact.name || '');
    setEditEmail(contact.email || '');
    setEditCnpj(contact.cnpj || '');
    setIsEditing(true);
  };

  const closeEditModal = () => {
    setIsEditing(false);
    setEditingContact(null);
  };

  const handleSaveContact = async () => {
    if (!editingContact) return;
    setIsSaving(true);

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/whatsapp/contacts/${editingContact.number}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          cnpj: editCnpj
        })
      });

      if (res.ok) {
        setContacts(prev => prev.map(c => 
          c.number === editingContact.number 
            ? { ...c, name: editName, email: editEmail, cnpj: editCnpj } 
            : c
        ));
        closeEditModal();
      } else {
        alert("Erro ao guardar o contacto. Tente novamente.");
      }
    } catch (err) {
      console.error(err);
      alert("Falha na comunicação com o servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    c.number.includes(searchTerm) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f6] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 pt-[80px] md:pt-10">
        <div className="max-w-7xl mx-auto">
          
          {/* CABEÇALHO DA PÁGINA */}
          <header className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Base de Dados</span>
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Lista de Contactos</h1>
              <p className="text-slate-500 mt-1 font-medium">Faça a gestão dos seus clientes ({contacts.length} registados no total).</p>
            </div>
            
            {/* BARRA DE PESQUISA PREMIUM */}
            <div className="bg-white border border-slate-200/80 rounded-2xl flex items-center px-4 h-12 w-full xl:w-[400px] shadow-sm focus-within:border-[#1FA84A] focus-within:ring-4 focus-within:ring-[#1FA84A]/10 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-400 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input 
                type="text" 
                placeholder="Procurar por nome, número ou e-mail..." 
                className="bg-transparent border-none outline-none w-full pl-3 text-sm font-medium text-slate-700 placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </header>

          {/* TABELA DE CONTACTOS */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Cliente</th>
                    <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">WhatsApp</th>
                    <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">E-mail</th>
                    <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">CNPJ / CPF</th>
                    <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-16 text-center">
                        <div className="w-10 h-10 border-4 border-[#1FA84A] border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-sm"></div>
                        <p className="text-slate-500 font-bold">A carregar contactos da base de dados...</p>
                      </td>
                    </tr>
                  ) : filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-16 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                        </div>
                        <h4 className="font-bold text-slate-700 text-lg">Nenhum contacto encontrado</h4>
                        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Não encontramos resultados para a sua pesquisa. Tente utilizar outros termos.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((contact) => (
                      <tr key={contact.number} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            {contact.profilePictureUrl ? (
                              <img src={contact.profilePictureUrl} className="w-11 h-11 rounded-full object-cover shadow-sm border border-slate-100" alt="avatar" />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-50 to-slate-100 border border-slate-200 flex items-center justify-center font-bold text-blue-600 shadow-sm">
                                {contact.name ? contact.name.substring(0, 2).toUpperCase() : '??'}
                              </div>
                            )}
                            <div>
                              <div className="font-extrabold text-slate-800 text-[15px]">{contact.name || 'Sem nome'}</div>
                              <div className="text-[11px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wide">Cliente</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-slate-700 font-mono text-[13px] bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg">
                            {contact.number}
                          </span>
                        </td>
                        <td className="py-4 px-6 max-w-[200px] truncate">
                          {contact.email ? (
                            <span className="text-slate-600 font-medium text-[14px] truncate" title={contact.email}>{contact.email}</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-400 uppercase tracking-widest">
                              Não Informado
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {contact.cnpj ? (
                            <span className="font-semibold text-slate-600 font-mono text-[13px]">{contact.cnpj}</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-400 uppercase tracking-widest">
                              Não Informado
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button 
                            onClick={() => openEditModal(contact)}
                            className="inline-flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:text-[#1FA84A] hover:border-[#1FA84A]/30 hover:bg-[#e8f6ea] px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                            Editar
                          </button>
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

      {/* MODAL DE EDIÇÃO */}
      {isEditing && editingContact && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={closeEditModal}>
          <div 
            className="bg-white rounded-3xl shadow-2xl flex flex-col w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100" 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-[#e8f6ea] text-[#1FA84A] rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">Editar Registo</h3>
                  <p className="text-xs font-bold text-slate-400 font-mono mt-1 uppercase tracking-wider">{editingContact.number}</p>
                </div>
              </div>
              <button onClick={closeEditModal} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 flex flex-col gap-6 bg-white">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Nome do Cliente</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 outline-none focus:bg-white focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all shadow-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Endereço de E-mail</label>
                <input 
                  type="email" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 outline-none focus:bg-white focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all shadow-sm"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="cliente@empresa.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">CNPJ / CPF</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-mono text-slate-800 outline-none focus:bg-white focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all shadow-sm"
                  value={editCnpj}
                  onChange={(e) => setEditCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button 
                onClick={closeEditModal}
                disabled={isSaving}
                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200/50 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveContact}
                disabled={isSaving}
                className="bg-[#1FA84A] text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center min-w-[140px] hover:bg-green-600 transition-all shadow-md hover:shadow-lg disabled:opacity-70 text-sm"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : "Guardar Dados"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}