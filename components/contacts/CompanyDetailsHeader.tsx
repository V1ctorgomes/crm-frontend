'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import { formatCnpjInput, type Company } from '@/lib/companies';

interface CompanyDetailsHeaderProps {
  company: Company;
  ticketCount: number | null;
  onClose: () => void;
}

export function CompanyDetailsHeader({ company, ticketCount, onClose }: CompanyDetailsHeaderProps) {
  return (
    <div className="p-6 border-b border-slate-100 flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700 shrink-0">
        <Building2 className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold tracking-tight text-lg text-brand-950 truncate">{company.legalName}</h3>
        <p className="text-sm text-slate-500 truncate">
          {company.tradeName ? <span className="mr-2">{company.tradeName}</span> : null}
          <span className="font-mono text-[12px]">{formatCnpjInput(company.cnpj)}</span>
        </p>
        {ticketCount != null && ticketCount > 0 ? (
          <p className="mt-2 text-xs text-amber-900 bg-amber-50 border border-amber-200/80 rounded-md px-2.5 py-1.5 leading-snug">
            {ticketCount === 1
              ? '1 ordem de serviço está vinculada a esta empresa — não é possível eliminá-la até remover ou alterar a empresa nessa OS.'
              : `${ticketCount} ordens de serviço estão vinculadas — eliminação bloqueada até não existir nenhuma OS com esta empresa.`}
          </p>
        ) : null}
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-700 transition-colors text-2xl leading-none"
        aria-label="Fechar"
      >
        ×
      </button>
    </div>
  );
}
