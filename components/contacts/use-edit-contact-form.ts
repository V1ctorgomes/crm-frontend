'use client';

import { useMemo, useState } from 'react';
import { formatCnpjInput, type Company } from '@/lib/companies';

export function useEditContactForm(
  linkedCompanies: Company[],
  allCompanies: Company[],
) {
  const [companySearch, setCompanySearch] = useState('');
  const [unlinkCompany, setUnlinkCompany] = useState<Company | null>(null);

  const linkedSet = useMemo(() => new Set(linkedCompanies.map((c) => c.id)), [linkedCompanies]);
  const candidates = useMemo(() => {
    const term = companySearch.trim().toLowerCase();
    if (!term) return [];
    return allCompanies
      .filter((c) => !linkedSet.has(c.id))
      .filter((c) =>
        c.legalName.toLowerCase().includes(term) ||
        (c.tradeName || '').toLowerCase().includes(term) ||
        c.cnpj.replace(/\D/g, '').includes(term.replace(/\D/g, '')),
      )
      .slice(0, 6);
  }, [companySearch, allCompanies, linkedSet]);

  return {
    companySearch,
    setCompanySearch,
    unlinkCompany,
    setUnlinkCompany,
    candidates,
  };
}

export type { Company };
