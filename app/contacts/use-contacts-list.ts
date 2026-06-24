'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Contact } from '@/components/contacts/ContactsTable';
import type { ContactsListSection } from '@/components/contacts/ContactsSectionTabs';
import { apiRequest } from '@/lib/api-client';
import { normalizeContactKind } from '@/lib/contact-kind';
import type { Company } from '@/lib/companies';
import {
  CONTACTS_PAGE_SIZE,
  computeKindCounts,
  filterCompaniesBySearch,
  filterContactsBySearch,
  filterContactsInSection,
  paginateRows,
} from './contacts-page-derivations';

export function useContactsList(showFeedback: (type: 'success' | 'error', message: string) => void) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [tablePage, setTablePage] = useState(0);
  const [listSection, setListSection] = useState<ContactsListSection>('unknown');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);

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

  return {
    contacts,
    setContacts,
    searchTerm,
    setSearchTerm,
    isLoading,
    tablePage,
    setTablePage,
    listSection,
    setListSection,
    companies,
    companiesLoading,
    kindCounts,
    filteredContacts,
    paginatedContacts,
    filteredCompanies,
    paginatedCompanies,
    fetchContacts,
    fetchCompanies,
  };
}
