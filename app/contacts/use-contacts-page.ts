'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Contact } from '@/components/contacts/ContactsTable';
import type { ContactsListSection } from '@/components/contacts/ContactsSectionTabs';
import { apiRequest } from '@/lib/api-client';
import { isWhatsAppGroupJid, normalizeContactKind, type ContactKind } from '@/lib/contact-kind';
import type { Company } from '@/lib/companies';

const PAGE_SIZE = 8;

export function useContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edição de contato
  const [isEditing, setIsEditing] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCnpj, setEditCnpj] = useState('');
  const [editContactKind, setEditContactKind] = useState<ContactKind>('UNKNOWN');
  const [isSaving, setIsSaving] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  // Paginação e secção
  const [tablePage, setTablePage] = useState(0);
  const [listSection, setListSection] = useState<ContactsListSection>('unknown');

  // Empresas
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyFormSaving, setCompanyFormSaving] = useState(false);
  const [companyDetails, setCompanyDetails] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [companyFormDefaultCnpj, setCompanyFormDefaultCnpj] = useState<string | undefined>(undefined);
  const [companyFormDefaultLegalName, setCompanyFormDefaultLegalName] = useState<string | undefined>(undefined);
  const [linkBusy, setLinkBusy] = useState(false);

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

  // -------- Empresas --------
  const openCreateCompanyModal = useCallback((initialLegalName?: string, initialCnpj?: string) => {
    setEditingCompany(null);
    setCompanyFormDefaultCnpj(initialCnpj);
    setCompanyFormDefaultLegalName(initialLegalName);
    setIsCompanyFormOpen(true);
  }, []);

  const openEditCompanyModal = useCallback((c: Company) => {
    setEditingCompany(c);
    setCompanyFormDefaultCnpj(undefined);
    setCompanyFormDefaultLegalName(undefined);
    setIsCompanyFormOpen(true);
  }, []);

  const closeCompanyForm = useCallback(() => {
    setIsCompanyFormOpen(false);
    setEditingCompany(null);
  }, []);

  const handleSubmitCompany = useCallback(
    async (data: { legalName: string; tradeName: string | null; cnpj: string }) => {
      setCompanyFormSaving(true);
      try {
        if (editingCompany) {
          await apiRequest(`/companies/${editingCompany.id}`, { method: 'PUT', body: JSON.stringify(data) });
          showFeedback('success', 'Empresa actualizada.');
        } else {
          const created = await apiRequest<Company>('/companies', { method: 'POST', body: JSON.stringify(data) });
          // Se vimos pela busca dentro do modal do contacto, vincular imediatamente.
          if (editingContact && created?.id) {
            try {
              await apiRequest(
                `/companies/${created.id}/contacts/${encodeURIComponent(editingContact.number)}`,
                { method: 'POST' },
              );
            } catch {
              // ignora — utilizador pode vincular depois
            }
          }
          showFeedback('success', 'Empresa cadastrada.');
        }
        await Promise.all([fetchCompanies(), fetchContacts()]);
        closeCompanyForm();
      } catch (err) {
        showFeedback('error', err instanceof Error ? err.message : 'Erro ao guardar empresa.');
      } finally {
        setCompanyFormSaving(false);
      }
    },
    [editingCompany, editingContact, fetchCompanies, fetchContacts, showFeedback, closeCompanyForm],
  );

  const handleDeleteCompany = useCallback(async () => {
    if (!companyToDelete) return;
    try {
      await apiRequest(`/companies/${companyToDelete.id}`, { method: 'DELETE' });
      setCompanyToDelete(null);
      await Promise.all([fetchCompanies(), fetchContacts()]);
      showFeedback('success', 'Empresa removida.');
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'Erro ao remover empresa.');
    }
  }, [companyToDelete, fetchCompanies, fetchContacts, showFeedback]);

  const linkCompanyToContact = useCallback(
    async (companyId: string) => {
      if (!editingContact) return;
      setLinkBusy(true);
      try {
        await apiRequest(
          `/companies/${companyId}/contacts/${encodeURIComponent(editingContact.number)}`,
          { method: 'POST' },
        );
        await Promise.all([fetchContacts(), fetchCompanies()]);
        // Atualizar referência interna do contacto em edição
        setEditingContact((prev) => {
          if (!prev) return prev;
          const co = companies.find((x) => x.id === companyId);
          if (!co) return prev;
          const existing = prev.companies || [];
          if (existing.some((x) => x.id === companyId)) return prev;
          return { ...prev, companies: [...existing, co] };
        });
        showFeedback('success', 'Empresa vinculada ao contato.');
      } catch (err) {
        showFeedback('error', err instanceof Error ? err.message : 'Erro ao vincular empresa.');
      } finally {
        setLinkBusy(false);
      }
    },
    [editingContact, fetchContacts, fetchCompanies, companies, showFeedback],
  );

  const unlinkCompanyFromContact = useCallback(
    async (companyId: string) => {
      if (!editingContact) return;
      setLinkBusy(true);
      try {
        await apiRequest(
          `/companies/${companyId}/contacts/${encodeURIComponent(editingContact.number)}`,
          { method: 'DELETE' },
        );
        await Promise.all([fetchContacts(), fetchCompanies()]);
        setEditingContact((prev) => {
          if (!prev) return prev;
          const existing = prev.companies || [];
          return { ...prev, companies: existing.filter((c) => c.id !== companyId) };
        });
        showFeedback('success', 'Empresa desvinculada.');
      } catch (err) {
        showFeedback('error', err instanceof Error ? err.message : 'Erro ao desvincular empresa.');
      } finally {
        setLinkBusy(false);
      }
    },
    [editingContact, fetchContacts, fetchCompanies, showFeedback],
  );

  // -------- Derivações --------
  const kindCounts = useMemo(() => {
    let customer = 0;
    let internal = 0;
    let unknown = 0;
    let groups = 0;
    for (const c of contacts) {
      if (isWhatsAppGroupJid(c.number)) {
        groups += 1;
        continue;
      }
      const k = normalizeContactKind(c.contactKind);
      if (k === 'CUSTOMER') customer += 1;
      else if (k === 'INTERNAL') internal += 1;
      else unknown += 1;
    }
    return { customer, internal, unknown, groups };
  }, [contacts]);

  const contactsInSection = useMemo(() => {
    if (listSection === 'companies') return [] as Contact[];
    if (listSection === 'groups') {
      return contacts.filter((c) => isWhatsAppGroupJid(c.number));
    }
    const want: ContactKind =
      listSection === 'customer' ? 'CUSTOMER' : listSection === 'internal' ? 'INTERNAL' : 'UNKNOWN';
    return contacts.filter(
      (c) => !isWhatsAppGroupJid(c.number) && normalizeContactKind(c.contactKind) === want,
    );
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

  const filteredCompanies = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter(
      (c) =>
        c.legalName.toLowerCase().includes(term) ||
        (c.tradeName || '').toLowerCase().includes(term) ||
        c.cnpj.replace(/\D/g, '').includes(term.replace(/\D/g, '')),
    );
  }, [companies, searchTerm]);

  useEffect(() => {
    setTablePage(0);
  }, [searchTerm, listSection]);

  const totalRows =
    listSection === 'companies' ? filteredCompanies.length : filteredContacts.length;

  useEffect(() => {
    setTablePage((p) => {
      const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
      return Math.min(p, totalPages - 1);
    });
  }, [totalRows]);

  const paginatedContacts = useMemo(() => {
    const start = tablePage * PAGE_SIZE;
    return filteredContacts.slice(start, start + PAGE_SIZE);
  }, [filteredContacts, tablePage]);

  const paginatedCompanies = useMemo(() => {
    const start = tablePage * PAGE_SIZE;
    return filteredCompanies.slice(start, start + PAGE_SIZE);
  }, [filteredCompanies, tablePage]);

  const linkedCompaniesForEditing = useMemo<Company[]>(() => {
    if (!editingContact) return [];
    const fromContact = editingContact.companies || [];
    // garantir tipos completos com cnpj/legalName atualizados do directório
    return fromContact.map((c) => companies.find((x) => x.id === c.id) || c);
  }, [editingContact, companies]);

  return {
    PAGE_SIZE,
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

    // Empresas
    companies,
    filteredCompanies,
    paginatedCompanies,
    companiesLoading,
    openCreateCompanyModal,
    openEditCompanyModal,
    closeCompanyForm,
    isCompanyFormOpen,
    editingCompany,
    companyFormSaving,
    handleSubmitCompany,
    companyDetails,
    setCompanyDetails,
    companyToDelete,
    setCompanyToDelete,
    handleDeleteCompany,
    companyFormDefaultCnpj,
    companyFormDefaultLegalName,
    fetchCompanies,
    fetchContacts,

    // Vínculos no modal de contacto
    linkedCompaniesForEditing,
    linkCompanyToContact,
    unlinkCompanyFromContact,
    linkBusy,
  };
}

export type ContactsPageViewModel = ReturnType<typeof useContactsPage>;
