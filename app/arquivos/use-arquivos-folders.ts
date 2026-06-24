'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  CompanyFolder,
  CustomerFolder,
  TicketFolder,
} from '@/components/arquivos/types';
import { apiRequest } from '@/lib/api-client';

export function useArquivosFolders(onFetchError?: () => void) {
  const [companyFolders, setCompanyFolders] = useState<CompanyFolder[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyFolder | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerFolder | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketFolder | null>(null);
  const [folderSearchTerm, setFolderSearchTerm] = useState('');

  const fetchFolders = async () => {
    try {
      const data = await apiRequest<CompanyFolder[]>('/tickets/folders');
      const safe = Array.isArray(data) ? data : [];
      setCompanyFolders(safe);

      if (selectedCompany) {
        const updatedCompany =
          safe.find((c) => (c.company?.id || '__no_company__') === (selectedCompany.company?.id || '__no_company__')) ||
          null;
        setSelectedCompany(updatedCompany);
        if (selectedCustomer && updatedCompany) {
          const updatedCustomer =
            updatedCompany.contacts.find((c) => c.contact.number === selectedCustomer.contact.number) || null;
          setSelectedCustomer(updatedCustomer);
          if (selectedTicket && updatedCustomer) {
            const updatedTicket = updatedCustomer.tickets.find((t) => t.id === selectedTicket.id) || null;
            setSelectedTicket(updatedTicket);
          } else {
            setSelectedTicket(null);
          }
        } else {
          setSelectedCustomer(null);
          setSelectedTicket(null);
        }
      }
    } catch {
      onFetchError?.();
    }
  };

  useEffect(() => {
    void fetchFolders();
  }, []);

  const filteredCompanies = useMemo(() => {
    if (!folderSearchTerm.trim()) return companyFolders;
    const term = folderSearchTerm.trim().toLowerCase();
    return companyFolders.filter((c) => {
      if (!c.company) return 'sem empresa'.includes(term);
      const haystack = [
        c.company.legalName,
        c.company.tradeName || '',
        c.company.cnpj,
        c.company.cnpj.replace(/\D/g, ''),
      ];
      return haystack.some((s) => s.toLowerCase().includes(term));
    });
  }, [companyFolders, folderSearchTerm]);

  const filteredContacts = useMemo(() => {
    if (!selectedCompany) return [];
    if (!folderSearchTerm.trim()) return selectedCompany.contacts;
    const term = folderSearchTerm.trim().toLowerCase();
    return selectedCompany.contacts.filter(
      (f) =>
        (f.contact.name && f.contact.name.toLowerCase().includes(term)) ||
        (f.contact.number && f.contact.number.includes(term)),
    );
  }, [selectedCompany, folderSearchTerm]);

  const showSearch = !selectedCustomer;
  const searchPlaceholder = !selectedCompany
    ? 'Procurar por empresa, nome fantasia ou CNPJ...'
    : 'Procurar por contato ou número...';

  return {
    selectedCompany,
    setSelectedCompany,
    selectedCustomer,
    setSelectedCustomer,
    selectedTicket,
    setSelectedTicket,
    folderSearchTerm,
    setFolderSearchTerm,
    filteredCompanies,
    filteredContacts,
    showSearch,
    searchPlaceholder,
    fetchFolders,
  };
}
