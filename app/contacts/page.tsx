'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

export const dynamic = 'force-dynamic';

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

  // Estados de Feedback (Notificações)
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Estados do Modal de Edição
  const [isEditing, setIsEditing] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCnpj, setEditCnpj] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Estados do Modal de Confirmação de Remoção
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${baseUrl}/whatsapp/contacts`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (err) {
      showFeedback('error', "Falha ao carregar a lista de contactos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchContacts(); }, []);

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setEditName(contact.name || '');
    setEditEmail(contact.email || '');
    setEditCnpj(contact.cnpj || '');
    setIsEditing(true);
  };

  const handleSaveContact = async () => {
    if (!editingContact) return;
    setIsSaving(true);

    try {
      const res = await fetch(`${baseUrl}/whatsapp/contacts/${encodeURIComponent(editingContact.number)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, email: editEmail, cnpj: editCnpj })
      });

      if (res.ok) {
        setContacts(prev => prev.map(c => 
          c.number === editingContact.number 
            ? { ...c, name: editName, email: editEmail, cnpj: editCnpj } 
            : c
        ));
        setIsEditing(false);
        showFeedback('success', "Contacto atualizado com sucesso!");
      } else {
        const errData = await res.json().catch(() => null);
        showFeedback('error', errData?.message || "Erro ao guardar o contacto no servidor.");
      }
    } catch (err) {
      showFeedback('error', "Erro de conexão ao tentar guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;

    try {
      const res = await fetch(`${baseUrl}/whatsapp/contacts/${encodeURIComponent(contactToDelete.number)}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setContacts(prev => prev.filter(c => c.number !== contactToDelete.number));
        setContactToDelete(null);
        showFeedback('success', "Contacto removido da base de dados.");
      } else {
        const errData = await res.json().catch(() => null);
        showFeedback('error', errData?.message || "Não foi possível remover o contacto.");
        setContactToDelete(null);
      }
    } catch (err) {
      showFeedback('error', "Erro de ligação ao servidor.");
      setContactToDelete(null);
    }
  };

  const filteredContacts = contacts.filter(c => 
    (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    c.number.includes(searchTerm) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

        {/* CABEÇALHO */}
        <header className="px-6 md:px-8 pt-8 md:pt-10 pb-6 flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 z-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contactos</h1>
            <p className="text-slate-500 text-sm mt-1">Faça a gestão da sua base de clientes ({contacts.length} registados).</p>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-md flex items-center px-3 h-10 w-full xl:w-[350px] shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 mr-2 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input 
              type="text" 
              placeholder="Procurar por nome, número ou e-mail..." 
              className="bg-transparent border-none outline-none w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <div className="px-6 md:px-8 pb-12 flex flex-col gap-6 animate-in fade-in duration-500">
          
          {/* TABELA DE CONTACTOS (ESTILO CARD DO DASHBOARD) */}
          <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 hover:bg-slate-50/50">
                    <th className="h-12 px-4 align-middle font-medium text-slate-500">Cliente</th>
                    <th className="h-12 px-4 align-middle font-medium text-slate-500">WhatsApp</th>
                    <th className="h-12 px-4 align-middle font-medium text-slate-500">E-mail</th>
                    <th className="h-12 px-4 align-middle font-medium text-slate-500">CNPJ / CPF</th>
                    <th className="h-12 px-4 align-middle font-medium text-slate-500 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <span className="text-slate-500 font-medium text-sm">A carregar contactos...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="h-32 text-center text-slate-500 text-sm">
                        Nenhum contacto encontrado.
                      </td>
                    </tr>
                  ) : filteredContacts.map((contact) => (
                    <tr key={contact.number} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs overflow-hidden shrink-0">
                            {contact.profilePictureUrl ? (
                              <img src={contact.profilePictureUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt={contact.name || ''}/>
                            ) : (
                              (contact.name || '?').substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="flex flex-col max-w-[150px] sm:max-w-[250px]">
                            <span className="font-semibold text-slate-900 truncate">{contact.name || 'Sem nome'}</span>
                            <span className="text-[12px] text-slate-500 truncate">Registado via WhatsApp</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle text-slate-600 font-mono text-[13px]">{contact.number}</td>
                      <td className="p-4 align-middle text-slate-600 truncate max-w-[150px]">{contact.email || '--'}</td>
                      <td className="p-4 align-middle text-slate-600 font-mono text-[13px]">{contact.cnpj || '--'}</td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(contact)} className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors" title="Editar">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                          </button>
                          <button onClick={() => setContactToDelete(contact)} className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Remover">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DE EDIÇÃO */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={() => setIsEditing(false)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col" onMouseDown={e => e.stopPropagation()}>
            <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100">
              <h3 className="font-semibold leading-none tracking-tight text-lg">Editar Registo</h3>
              <p className="text-sm text-slate-500">Atualize as informações do cliente abaixo.</p>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-slate-700">Nome do Contacto</label>
                <input 
                  type="text" 
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-slate-700">Correio Eletrónico</label>
                <input 
                  type="email" 
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50" 
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-slate-700">CNPJ / CPF</label>
                <input 
                  type="text" 
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 font-mono" 
                  value={editCnpj} 
                  onChange={(e) => setEditCnpj(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 p-6 pt-0">
              <button onClick={() => setIsEditing(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 h-10 px-4 py-2">
                Cancelar
              </button>
              <button onClick={handleSaveContact} disabled={isSaving} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-10 px-4 py-2 disabled:pointer-events-none disabled:opacity-50">
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    A guardar...
                  </>
                ) : (
                  'Guardar Dados'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE REMOÇÃO */}
      {contactToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={() => setContactToDelete(null)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col" onMouseDown={e => e.stopPropagation()}>
            <div className="flex flex-col space-y-2 p-6 pb-4">
              <h3 className="font-semibold tracking-tight text-lg text-slate-900">Remover Contacto?</h3>
              <p className="text-sm text-slate-500">
                Tem a certeza que pretende eliminar <b>{contactToDelete.name || contactToDelete.number}</b>? Esta ação removerá o contacto permanentemente.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 p-6 pt-0">
              <button onClick={() => setContactToDelete(null)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 h-10 px-4 py-2">
                Cancelar
              </button>
              <button onClick={handleDeleteContact} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700 h-10 px-4 py-2 shadow-sm">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}