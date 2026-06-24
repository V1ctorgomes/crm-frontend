'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Contact } from '@/components/contacts/ContactsTable';
import type { ContactsListSection } from '@/components/contacts/ContactsSectionTabs';
import { apiRequest, apiDelete } from '@/lib/api-client';
import { normalizeContactKind, type ContactKind } from '@/lib/contact-kind';
import type { Company } from '@/lib/companies';
import {
  CONTACTS_PAGE_SIZE,
  computeKindCounts,
  filterCompaniesBySearch,
  filterContactsBySearch,
  filterContactsInSection,
  paginateRows,
  resolveLinkedCompaniesForEditing,
} from './contacts-page-derivations';
import { useContactsCompanies } from './use-contacts-companies';

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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);

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

  const fetchCompanies = useCallback(async () => {
    setCompaniesLoading(true);
    try {
      const data = await apiRequest<Company[]>('/companies');
      setCompanies(Array.isArray(data) ? data : []);
    } catch {
      showFeedback('error', 'Falha ao carregar empresas.');
    } finally {
      setCompaniesLoading(false);
    }
  }, [showFeedback]);

  const companiesApi = useContactsCompanies({
    showFeedback,
    fetchCompanies,
    fetchContacts,
    editingContact,
    setEditingContact,
    companies,
  });

  useEffect(() => {
    void fetchContacts();
    void fetchCompanies();
  }, [fetchContacts, fetchCompanies]);

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
    [contactToDelete, showFeedback],
  );

  const kindCounts = useMemo(() => computeKindCounts(contacts), [contacts]);
  const contactsInSection = useMemo(() => filterContactsInSection(contacts, listSection), [contacts, listSection]);
  const filteredContacts = useMemo(
    () => filterContactsBySearch(contactsInSection, searchTerm),
    [contactsInSection, searchTerm],
  );
  const filteredCompanies = useMemo(
    () => filterCompaniesBySearch(companies, searchTerm),
    [companies, searchTerm],
  );

  useEffect(() => {
    setTablePage(0);
  }, [searchTerm, listSection]);

  const totalRows = listSection === 'companies' ? filteredCompanies.length : filteredContacts.length;

  useEffect(() => {
    setTablePage((p) => {
      const totalPages = Math.max(1, Math.ceil(totalRows / CONTACTS_PAGE_SIZE));
      return Math.min(p, totalPages - 1);
    });
  }, [totalRows]);

  const paginatedContacts = useMemo(
    () => paginateRows(filteredContacts, tablePage, CONTACTS_PAGE_SIZE),
    [filteredContacts, tablePage],
  );
  const paginatedCompanies = useMemo(
    () => paginateRows(filteredCompanies, tablePage, CONTACTS_PAGE_SIZE),
    [filteredCompanies, tablePage],
  );
  const linkedCompaniesForEditing = useMemo(
    () => resolveLinkedCompaniesForEditing(editingContact, companies),
    [editingContact, companies],
  );

  return {
    PAGE_SIZE: CONTACTS_PAGE_SIZE,
    contacts,
    searchTerm,
    setSearchTerm,
    isLoading: isLoading || companiesLoading,
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
    companies,
    filteredCompanies,
    paginatedCompanies,
    companiesLoading,
    openCreateCompanyModal: companiesApi.openCreateCompanyModal,
    openEditCompanyModal: companiesApi.openEditCompanyModal,
    closeCompanyForm: companiesApi.closeCompanyForm,
    isCompanyFormOpen: companiesApi.isCompanyFormOpen,
    editingCompany: companiesApi.editingCompany,
    companyFormSaving: companiesApi.companyFormSaving,
    handleSubmitCompany: companiesApi.handleSubmitCompany,
    companyDetails: companiesApi.companyDetails,
    setCompanyDetails: companiesApi.setCompanyDetails,
    companyToDelete: companiesApi.companyToDelete,
    setCompanyToDelete: companiesApi.setCompanyToDelete,
    handleDeleteCompany: companiesApi.handleDeleteCompany,
    companyFormDefaultCnpj: companiesApi.companyFormDefaultCnpj,
    companyFormDefaultLegalName: companiesApi.companyFormDefaultLegalName,
    fetchCompanies,
    fetchContacts,
    linkedCompaniesForEditing,
    linkCompanyToContact: companiesApi.linkCompanyToContact,
    unlinkCompanyFromContact: companiesApi.unlinkCompanyFromContact,
    linkBusy: companiesApi.linkBusy,
  };
}

export type ContactsPageViewModel = ReturnType<typeof useContactsPage>;
