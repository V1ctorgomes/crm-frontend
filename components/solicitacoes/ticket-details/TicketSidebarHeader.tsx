import React from 'react';
import { Building2 } from 'lucide-react';
import { formatCnpjInput } from '@/lib/companies';
import type { Ticket } from '../types';

/**
 * Topo da coluna esquerda — passa a destacar a EMPRESA da OS (com Nome Fantasia/Razão Social
 * e CNPJ). O contato deixou de ser o protagonista; aparece como "solicitante" no info abaixo.
 */
export function TicketSidebarHeader({ ticket }: { ticket: Ticket }) {
  const company = ticket.company;
  const display = company?.tradeName?.trim() || company?.legalName || null;

  return (
    <div className="p-6 flex flex-col items-center text-center border-b border-slate-200 shrink-0">
      <div className="w-20 h-20 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700 mb-3 shadow-sm">
        <Building2 className="w-8 h-8" />
      </div>
      {display ? (
        <>
          <h3 className="font-semibold text-lg text-brand-950 break-words leading-tight">{display}</h3>
          {company?.legalName && company.tradeName?.trim() && display !== company.legalName ? (
            <p className="text-xs text-slate-500 mt-0.5 break-words">{company.legalName}</p>
          ) : null}
          <span className="text-slate-500 font-mono text-xs mt-2 bg-white px-2 py-0.5 rounded border border-slate-200">
            {formatCnpjInput(company!.cnpj)}
          </span>
        </>
      ) : (
        <>
          <h3 className="font-semibold text-base text-amber-700 leading-tight">Sem empresa vinculada</h3>
          <p className="text-[11px] text-amber-600 mt-1">
            Vá em «Editar» para escolher uma empresa vinculada a este contato.
          </p>
        </>
      )}
    </div>
  );
}
