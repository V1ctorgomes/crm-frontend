'use client';

import React from 'react';
import { CONTACT_KIND_OPTIONS, type ContactKind } from '@/lib/contact-kind';
import type { Company } from '@/lib/companies';
import { EditContactCompanyLinks } from './EditContactCompanyLinks';

export interface EditContactFormFieldsProps {
  editName: string;
  setEditName: (val: string) => void;
  editEmail: string;
  setEditEmail: (val: string) => void;
  editCnpj: string;
  setEditCnpj: (val: string) => void;
  editContactKind: ContactKind;
  setEditContactKind: (val: ContactKind) => void;
  isWhatsAppGroup?: boolean;
  linkedCompanies: Company[];
  companySearch: string;
  setCompanySearch: (val: string) => void;
  candidates: Company[];
  linkBusy: boolean;
  onLinkCompany: (companyId: string) => void | Promise<void>;
  onRequestCreateCompany: (initialLegalName?: string) => void;
  onRequestUnlink: (company: Company) => void;
}

const inputClass =
  'flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 disabled:cursor-not-allowed disabled:opacity-50';

export function EditContactFormFields({
  editName,
  setEditName,
  editEmail,
  setEditEmail,
  editCnpj,
  setEditCnpj,
  editContactKind,
  setEditContactKind,
  isWhatsAppGroup = false,
  linkedCompanies,
  companySearch,
  setCompanySearch,
  candidates,
  linkBusy,
  onLinkCompany,
  onRequestCreateCompany,
  onRequestUnlink,
}: EditContactFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none text-slate-700">
          {isWhatsAppGroup ? 'Nome do grupo' : 'Nome do Contato'}
        </label>
        <input type="text" className={inputClass} value={editName} onChange={(e) => setEditName(e.target.value)} />
      </div>

      {!isWhatsAppGroup && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">Correio Eletrónico</label>
            <input type="email" className={inputClass} value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">CPF (pessoa física)</label>
            <input
              type="text"
              className={`${inputClass} font-mono`}
              value={editCnpj}
              onChange={(e) => setEditCnpj(e.target.value)}
            />
            <p className="text-xs text-slate-500">Para empresas (CNPJ), use a secção abaixo «Empresas vinculadas».</p>
          </div>
        </>
      )}

      <div className="space-y-2">
        <label htmlFor="edit-contact-kind" className="text-sm font-medium leading-none text-slate-700">
          {isWhatsAppGroup ? 'Classificação do grupo' : 'Tipo de contato'}
        </label>
        <select
          id="edit-contact-kind"
          value={editContactKind}
          onChange={(e) => setEditContactKind(e.target.value as ContactKind)}
          className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
        >
          {CONTACT_KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500">
          {isWhatsAppGroup
            ? 'Indique se este grupo é usado com clientes ou com a equipa interna.'
            : 'Cliente comercial vs colaborador que escreve no mesmo número.'}
        </p>
      </div>

      {!isWhatsAppGroup && (
        <EditContactCompanyLinks
          linkedCompanies={linkedCompanies}
          companySearch={companySearch}
          setCompanySearch={setCompanySearch}
          candidates={candidates}
          linkBusy={linkBusy}
          onLinkCompany={onLinkCompany}
          onRequestCreateCompany={onRequestCreateCompany}
          onRequestUnlink={onRequestUnlink}
        />
      )}
    </>
  );
}
