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

  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCnpj, setEditCnpj] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
    <div className="flex h-screen overflow-hidden bg-[#f4f7f6] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 pt-[80px] md:pt-10">
        <div className="max-w-7xl mx-auto">
          
          {toast && (
            <div className={`fixed bottom-10 right-10 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300`}>
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

          <header className="mb-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-md text-white font-bold">C</div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Base de Dados</span>
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Lista de Contactos</h1>
              <p className="text-slate-500 mt-1 font-medium">Faça a gestão dos seus clientes ({contacts.length} registados).</p>
            </div>
            
            <div className="bg-white border border-slate-200/80 rounded-2xl flex items-center px-4 h-12 w-full xl:w-[400px] shadow-sm focus-within:ring-4 focus-within:ring-[#1FA84A]/10 transition-all">
              <input 
                type="text" 
                placeholder="Procurar por nome, número ou e-mail..." 
                className="bg-transparent border-none outline-none w-full text-sm font-medium text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </header>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 uppercase text-[11px] font-bold text-slate-400 tracking-widest">
                    <th className="py-5 px-6">Cliente</th>
                    <th className="py-5 px-6">WhatsApp</th>
                    <th className="py-5 px-6">E-mail</th>
                    <th className="py-5 px-6">CNPJ / CPF</th>
                    <th className="py-5 px-6 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-20 text-center"><div className="w-10 h-10 border-4 border-[#1FA84A] border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                  ) : filteredContacts.map((contact) => (
                    <tr key={contact.number} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 overflow-hidden">
                            {contact.profilePictureUrl ? <img src={contact.profilePictureUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover"/> : contact.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-800 text-[15px]">{contact.name || 'Sem nome'}</div>
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Cliente</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-sm text-slate-600">{contact.number}</td>
                      <td className="py-4 px-6 text-slate-600 font-medium">{contact.email || '--'}</td>
                      <td className="py-4 px-6 text-slate-600 font-mono text-sm">{contact.cnpj || '--'}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                          <button onClick={() => openEditModal(contact)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors" title="Editar">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                          <button onClick={() => setContactToDelete(contact)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors" title="Remover">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
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

      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-b from-slate-50 to-white">
              <h3 className="font-extrabold text-xl text-slate-800">Editar Registo</h3>
              <button onClick={() => setIsEditing(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 flex flex-col gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Nome</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 outline-none focus:bg-white focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all shadow-sm" value={editName} onChange={(e) => setEditName(e.target.value)}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">E-mail</label>
                <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 outline-none focus:bg-white focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all shadow-sm" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">CNPJ / CPF</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-mono text-slate-800 outline-none focus:bg-white focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all shadow-sm" value={editCnpj} onChange={(e) => setEditCnpj(e.target.value)}/>
              </div>
            </div>
            <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200/50 transition-colors text-sm">Cancelar</button>
              <button onClick={handleSaveContact} disabled={isSaving} className="bg-[#1FA84A] text-white px-8 py-3 rounded-xl font-bold hover:bg-green-600 shadow-md hover:shadow-lg transition-all text-sm flex items-center gap-2">
                {isSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                Guardar Dados
              </button>
            </div>
          </div>
        </div>
      )}

      {contactToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setContactToDelete(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="p-8 text-center bg-gradient-to-b from-white to-slate-50">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Remover Contacto?</h3>
              <p className="text-[15px] font-medium text-slate-500 leading-relaxed px-2">Esta ação apagará permanentemente o contacto <b>{contactToDelete.name || contactToDelete.number}</b> e todo o seu histórico de chat.</p>
            </div>
            <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button onClick={() => setContactToDelete(null)} className="flex-1 px-5 py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm">Cancelar</button>
              <button onClick={handleDeleteContact} className="flex-1 bg-red-500 text-white px-5 py-3.5 rounded-xl font-bold text-sm hover:bg-red-600 transition-all shadow-md">Sim, Eliminar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}