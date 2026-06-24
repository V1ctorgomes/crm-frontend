'use client';

import { useCallback, useMemo, useState } from 'react';
import { CONTACTS_PAGE_SIZE, resolveLinkedCompaniesForEditing } from './contacts-page-derivations';
import { useContactsList } from './use-contacts-list';
import { useContactsEdit } from './use-contacts-edit';
import { useContactsCompanies } from './use-contacts-companies';

export function useContactsPage() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  }, []);

  const list = useContactsList(showFeedback);
  const edit = useContactsEdit(showFeedback, list.setContacts);
  const companiesApi = useContactsCompanies({
    showFeedback,
    fetchCompanies: list.fetchCompanies,
    fetchContacts: list.fetchContacts,
    editingContact: edit.editingContact,
    setEditingContact: edit.setEditingContact,
    companies: list.companies,
  });

  const linkedCompaniesForEditing = useMemo(
    () => resolveLinkedCompaniesForEditing(edit.editingContact, list.companies),
    [edit.editingContact, list.companies],
  );

  return {
    PAGE_SIZE: CONTACTS_PAGE_SIZE,
    toast,
    setToast,
    showFeedback,
    ...list,
    ...edit,
    isLoading: list.isLoading || list.companiesLoading,
    linkedCompaniesForEditing,
    companiesLoading: list.companiesLoading,
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
    linkCompanyToContact: companiesApi.linkCompanyToContact,
    unlinkCompanyFromContact: companiesApi.unlinkCompanyFromContact,
    linkBusy: companiesApi.linkBusy,
  };
}

export type ContactsPageViewModel = ReturnType<typeof useContactsPage>;
