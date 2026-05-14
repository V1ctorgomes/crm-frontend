'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Contact } from '@/components/contacts/ContactsTable';
import type { ContactsListSection } from '@/components/contacts/ContactsSectionTabs';
import { apiRequest } from '@/lib/api-client';
import { normalizeContactKind, type ContactKind } from '@/lib/contact-kind';

const PAGE_SIZE = 8;

export function useContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCnpj, setEditCnpj] = useState('');
  const [editContactKind, setEditContactKind] = useState<ContactKind>('UNKNOWN');
  const [isSaving, setIsSaving] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [tablePage, setTablePage] = useState(0);
  const [listSection, setListSection] = useState<ContactsListSection>('unknown');

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  }, []);

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/whatsapp/contacts');
      const rows = Array.isArray(data) ? data : [];
      setContacts(
        rows.map((c: Record<string, unknown>) => ({
          ...(c as unknown as Contact),
          contactKind: normalizeContactKind(c.contactKind),
        })),
      );
    } catch {
      showFeedback('error', 'Falha ao carregar a lista de contatos.');
    } finally {
      setIsLoading(false);
    }
  }, [showFeedback]);

  useEffect(() => {
    void fetchContacts();
  }, [fetchContacts]);

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
  }, [editingContact, editName, editEmail, editCnpj, editContactKind, showFeedback]);

  const handleDeleteContact = useCallback(async () => {
    if (!contactToDelete) return;
    try {
      await apiRequest(`/whatsapp/contacts/${encodeURIComponent(contactToDelete.number)}`, {
        method: 'DELETE',
      });
      setContacts((prev) => prev.filter((c) => c.number !== contactToDelete.number));
      setContactToDelete(null);
      showFeedback('success', 'Contato removido da base de dados.');
    } catch {
      showFeedback('error', 'Erro de ligação ao servidor.');
      setContactToDelete(null);
    }
  }, [contactToDelete, showFeedback]);

  const kindCounts = useMemo(() => {
    let customer = 0;
    let internal = 0;
    let unknown = 0;
    for (const c of contacts) {
      const k = normalizeContactKind(c.contactKind);
      if (k === 'CUSTOMER') customer += 1;
      else if (k === 'INTERNAL') internal += 1;
      else unknown += 1;
    }
    return { customer, internal, unknown };
  }, [contacts]);

  const contactsInSection = useMemo(() => {
    const want: ContactKind =
      listSection === 'customer' ? 'CUSTOMER' : listSection === 'internal' ? 'INTERNAL' : 'UNKNOWN';
    return contacts.filter((c) => normalizeContactKind(c.contactKind) === want);
  }, [contacts, listSection]);

  const filteredContacts = useMemo(
    () =>
      contactsInSection.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          c.number.includes(searchTerm) ||
          (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())),
      ),
    [contactsInSection, searchTerm],
  );

  useEffect(() => {
    setTablePage(0);
  }, [searchTerm, listSection]);

  useEffect(() => {
    setTablePage((p) => {
      const totalPages = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE));
      return Math.min(p, totalPages - 1);
    });
  }, [filteredContacts.length]);

  const paginatedContacts = useMemo(() => {
    const start = tablePage * PAGE_SIZE;
    return filteredContacts.slice(start, start + PAGE_SIZE);
  }, [filteredContacts, tablePage]);

  return {
    PAGE_SIZE,
    contacts,
    searchTerm,
    setSearchTerm,
    isLoading,
    toast,
    setToast,
    showFeedback,
    isEditing,
    setIsEditing,
    editingContact,
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
    tablePage,
    setTablePage,
    listSection,
    setListSection,
    kindCounts,
    openEditModal,
    handleSaveContact,
    handleDeleteContact,
    filteredContacts,
    paginatedContacts,
  };
}

export type ContactsPageViewModel = ReturnType<typeof useContactsPage>;
