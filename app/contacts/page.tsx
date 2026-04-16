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
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[80px] md:pt-0 h-full relative overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Lista de Contactos</h1>
              <p className="text-slate-500 mt-1 font-medium">Faça a gestão dos seus clientes ({contacts.length} no total).</p>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-xl flex items-center px-4 h-11 w-full md:w-[350px] shadow-sm focus-within:border-[#1FA84A] focus-within:ring-1 focus-within:ring-[#1FA84A] transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input 
                type="text" 
                placeholder="Procurar nome, número ou e-mail..." 
                className="bg-transparent border-none outline-none w-full pl-3 text-[15px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </header>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[13px] uppercase tracking-wider font-semibold">
                    <th className="p-4 pl-6">Cliente</th>
                    <th className="p-4">Número (WhatsApp)</th>
                    <th className="p-4">E-mail</th>
                    <th className="p-4">CNPJ</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-[#1FA84A] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        A carregar contactos...
                      </td>
                    </tr>
                  ) : filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">Nenhum contacto encontrado.</td>
                    </tr>
                  ) : (
                    filteredContacts.map((contact) => (
                      <tr key={contact.number} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            {contact.profilePictureUrl ? (
                              <img src={contact.profilePictureUrl} className="w-10 h-10 rounded-full object-cover shadow-sm" alt="avatar" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 shadow-sm">
                                {contact.name ? contact.name.substring(0, 2).toUpperCase() : '??'}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-800 text-[15px]">{contact.name || 'Sem nome'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-slate-600 font-mono text-[14px] bg-slate-100 px-2 py-1 rounded-md">{contact.number}</span>
                        </td>
                        <td className="p-4">
                          {contact.email ? (
                            <span className="text-slate-600 text-[14px]">{contact.email}</span>
                          ) : (
                            <span className="text-slate-400 text-[13px] italic">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          {contact.cnpj ? (
                            <span className="font-medium text-slate-600 text-[14px]">{contact.cnpj}</span>
                          ) : (
                            <span className="text-slate-400 text-[13px] italic">—</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => openEditModal(contact)}
                            className="bg-slate-100 hover:bg-[#1FA84A] text-slate-600 hover:text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm"
                          >
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
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4" onClick={closeEditModal}>
          <div 
            className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-md overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-100 bg-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Editar Contacto</h3>
                <p className="text-sm text-slate-500 font-mono mt-0.5">{editingContact.number}</p>
              </div>
              <button onClick={closeEditModal} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5 bg-[#f8f9fa]">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Nome</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[15px] outline-none focus:border-[#1FA84A] focus:ring-1 focus:ring-[#1FA84A] transition-all shadow-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nome do cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">E-mail</label>
                <input 
                  type="email" 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[15px] outline-none focus:border-[#1FA84A] focus:ring-1 focus:ring-[#1FA84A] transition-all shadow-sm"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="cliente@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">CNPJ / CPF</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[15px] outline-none focus:border-[#1FA84A] focus:ring-1 focus:ring-[#1FA84A] transition-all shadow-sm font-mono"
                  value={editCnpj}
                  onChange={(e) => setEditCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
              <button 
                onClick={closeEditModal}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveContact}
                disabled={isSaving}
                className="bg-[#1FA84A] text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center min-w-[120px] hover:bg-green-600 transition-colors shadow-sm disabled:opacity-70"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}