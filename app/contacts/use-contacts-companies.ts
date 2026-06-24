'use client';

import { useCallback, useState } from 'react';
import type { Contact } from '@/components/contacts/ContactsTable';
import { apiRequest, apiDelete } from '@/lib/api-client';
import type { Company } from '@/lib/companies';

interface UseContactsCompaniesOptions {
  showFeedback: (type: 'success' | 'error', message: string) => void;
  fetchCompanies: () => Promise<void>;
  fetchContacts: () => Promise<void>;
  editingContact: Contact | null;
  setEditingContact: React.Dispatch<React.SetStateAction<Contact | null>>;
  companies: Company[];
}

export function useContactsCompanies({
  showFeedback,
  fetchCompanies,
  fetchContacts,
  editingContact,
  setEditingContact,
  companies,
}: UseContactsCompaniesOptions) {
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyFormSaving, setCompanyFormSaving] = useState(false);
  const [companyDetails, setCompanyDetails] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [companyFormDefaultCnpj, setCompanyFormDefaultCnpj] = useState<string | undefined>(undefined);
  const [companyFormDefaultLegalName, setCompanyFormDefaultLegalName] = useState<string | undefined>(undefined);
  const [linkBusy, setLinkBusy] = useState(false);

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
          if (editingContact && created?.id) {
            try {
              await apiRequest(
                `/companies/${created.id}/contacts/${encodeURIComponent(editingContact.number)}`,
                { method: 'POST' },
              );
            } catch {
              /* utilizador pode vincular depois */
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

  const handleDeleteCompany = useCallback(
    async (deleteReason?: string) => {
      if (!companyToDelete) return;
      try {
        await apiDelete(`/companies/${companyToDelete.id}`, deleteReason);
        setCompanyToDelete(null);
        await Promise.all([fetchCompanies(), fetchContacts()]);
        showFeedback('success', 'Empresa removida.');
      } catch (err) {
        showFeedback('error', err instanceof Error ? err.message : 'Erro ao remover empresa.');
      }
    },
    [companyToDelete, fetchCompanies, fetchContacts, showFeedback],
  );

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
    [editingContact, fetchContacts, fetchCompanies, companies, showFeedback, setEditingContact],
  );

  const unlinkCompanyFromContact = useCallback(
    async (companyId: string, deleteReason?: string) => {
      if (!editingContact) return;
      setLinkBusy(true);
      try {
        await apiDelete(
          `/companies/${companyId}/contacts/${encodeURIComponent(editingContact.number)}`,
          deleteReason,
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
    [editingContact, fetchContacts, fetchCompanies, showFeedback, setEditingContact],
  );

  return {
    isCompanyFormOpen,
    editingCompany,
    companyFormSaving,
    companyDetails,
    setCompanyDetails,
    companyToDelete,
    setCompanyToDelete,
    companyFormDefaultCnpj,
    companyFormDefaultLegalName,
    linkBusy,
    openCreateCompanyModal,
    openEditCompanyModal,
    closeCompanyForm,
    handleSubmitCompany,
    handleDeleteCompany,
    linkCompanyToContact,
    unlinkCompanyFromContact,
  };
}
