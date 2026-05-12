'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Toast } from '@/components/ui/toast';
import { ContactsHeader } from '@/components/contacts/ContactsHeader';
import { ContactsTable, Contact } from '@/components/contacts/ContactsTable';
import { EditContactModal } from '@/components/contacts/EditContactModal';
import { DeleteContactModal } from '@/components/contacts/DeleteContactModal';
import { apiRequest } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

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

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/whatsapp/contacts');
      setContacts(data);
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
      await apiRequest(`/whatsapp/contacts/${encodeURIComponent(editingContact.number)}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName, email: editEmail, cnpj: editCnpj }),
      });

      setContacts(prev => prev.map(c => 
        c.number === editingContact.number 
          ? { ...c, name: editName, email: editEmail, cnpj: editCnpj } 
          : c
      ));
      setIsEditing(false);
      showFeedback('success', "Contacto atualizado com sucesso!");
    } catch (err) {
      showFeedback('error', "Erro de conexão ao tentar guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;

    try {
      await apiRequest(`/whatsapp/contacts/${encodeURIComponent(contactToDelete.number)}`, {
        method: 'DELETE',
      });

      setContacts(prev => prev.filter(c => c.number !== contactToDelete.number));
      setContactToDelete(null);
      showFeedback('success', "Contacto removido da base de dados.");
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

        <ContactsHeader 
          totalContacts={contacts.length} 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
        />

        <ContactsTable 
          isLoading={isLoading} 
          contacts={filteredContacts} 
          onEdit={openEditModal} 
          onDelete={setContactToDelete} 
        />
      </main>

      {isEditing && (
        <EditContactModal 
          editName={editName}
          setEditName={setEditName}
          editEmail={editEmail}
          setEditEmail={setEditEmail}
          editCnpj={editCnpj}
          setEditCnpj={setEditCnpj}
          isSaving={isSaving}
          onClose={() => setIsEditing(false)}
          onSave={handleSaveContact}
        />
      )}

      {contactToDelete && (
        <DeleteContactModal 
          contact={contactToDelete}
          onClose={() => setContactToDelete(null)}
          onConfirm={handleDeleteContact}
        />
      )}

    </div>
  );
}