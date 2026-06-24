'use client';

import { useCallback, useState } from 'react';
import type { Contact } from '@/components/contacts/ContactsTable';
import { apiRequest, apiDelete } from '@/lib/api-client';
import { normalizeContactKind, type ContactKind } from '@/lib/contact-kind';

export function useContactsEdit(
  showFeedback: (type: 'success' | 'error', message: string) => void,
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>,
) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCnpj, setEditCnpj] = useState('');
  const [editContactKind, setEditContactKind] = useState<ContactKind>('UNKNOWN');
  const [isSaving, setIsSaving] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const openEditModal = useCallback((contact: Contact) => {
    setEditingContact(contact);
    setEditName(contact.name || '');
    setEditEmail(contact.email || '');
    setEditCnpj(contact.cnpj || '');
    setEditContactKind(normalizeContactKind(contact.contactKind));
    setIsEditing(true);
  }, []);

  const handleSaveContact = useCallback(async () => {
    if (!editingContact) return;
    setIsSaving(true);
    try {
      await apiRequest(`/whatsapp/contacts/${encodeURIComponent(editingContact.number)}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          cnpj: editCnpj,
          contactKind: editContactKind,
        }),
      });
      setContacts((prev) =>
        prev.map((c) =>
          c.number === editingContact.number
            ? { ...c, name: editName, email: editEmail, cnpj: editCnpj, contactKind: editContactKind }
            : c,
        ),
      );
      setIsEditing(false);
      showFeedback('success', 'Contato atualizado com sucesso!');
    } catch {
      showFeedback('error', 'Erro de conexão ao tentar guardar.');
    } finally {
      setIsSaving(false);
    }
  }, [editingContact, editName, editEmail, editCnpj, editContactKind, setContacts, showFeedback]);

  const handleDeleteContact = useCallback(
    async (deleteReason?: string) => {
      if (!contactToDelete) return;
      try {
        await apiDelete(`/whatsapp/contacts/${encodeURIComponent(contactToDelete.number)}`, deleteReason);
        setContacts((prev) => prev.filter((c) => c.number !== contactToDelete.number));
        setContactToDelete(null);
        showFeedback('success', 'Contato removido da base de dados.');
      } catch {
        showFeedback('error', 'Erro de ligação ao servidor.');
        setContactToDelete(null);
      }
    },
    [contactToDelete, setContacts, showFeedback],
  );

  return {
    isEditing,
    setIsEditing,
    editingContact,
    setEditingContact,
    editName,
    setEditName,
    editEmail,
    setEditEmail,
    editCnpj,
    setEditCnpj,
    editContactKind,
    setEditContactKind,
    isSaving,
    contactToDelete,
    setContactToDelete,
    openEditModal,
    handleSaveContact,
    handleDeleteContact,
  };
}
