import React from 'react';
import { formatCnpjInput } from '@/lib/companies';
import { formatCpfCnpjInput } from '@/lib/ticket-form-validation';
import { CATALOG_CATEGORY_LABELS, type TicketCatalogOptions } from '@/lib/ticket-catalog-types';
import { NewTicketCatalogSelect, newTicketInputClass } from '@/components/solicitacoes/NewTicketCatalogSelect';
import type { Contact } from '@/components/whatsapp/types';

export type CreateTicketModalProps = {
  onClose: () => void;
  activeContact: Contact;
  formNome: string;
  formCompanyCnpj: string;
  formSolicitanteCpf: string;
  setFormSolicitanteCpf: (v: string) => void;
  formEmail: string;
  setFormEmail: (v: string) => void;
  formMarca: string;
  setFormMarca: (v: string) => void;
  formModelo: string;
  setFormModelo: (v: string) => void;
  formCustomerType: string;
  setFormCustomerType: (v: string) => void;
  formTicketType: string;
  setFormTicketType: (v: string) => void;
  formCompanyId: string;
  onSelectCompany: (id: string) => void;
  handleCreateTicket: () => void;
  ticketCatalog: TicketCatalogOptions | null;
};

export function CreateTicketModalBody({
  activeContact,
  formNome,
  formCompanyCnpj,
  formSolicitanteCpf,
  setFormSolicitanteCpf,
  formEmail,
  setFormEmail,
  formMarca,
  setFormMarca,
  formModelo,
  setFormModelo,
  formCustomerType,
  setFormCustomerType,
  formTicketType,
  setFormTicketType,
  formCompanyId,
  onSelectCompany,
  ticketCatalog,
}: Omit<CreateTicketModalProps, 'onClose' | 'handleCreateTicket'>) {
  const companies = activeContact.companies || [];
  const catalogReady =
    ticketCatalog &&
    ticketCatalog.MARCA.length > 0 &&
    ticketCatalog.MODELO.length > 0 &&
    ticketCatalog.CUSTOMER_TYPE.length > 0 &&
    ticketCatalog.TICKET_TYPE.length > 0;
  const companySelected = !!formCompanyId;

  return (
    <div className="p-6 flex flex-col gap-4">
      <p className="text-xs text-slate-500">
        O <strong>cliente</strong> é a empresa. O contato do chat é o <strong>solicitante</strong>.
      </p>
      {!catalogReady && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Catálogo incompleto. Confirme em <strong>Developer → Catálogo de OS</strong>.
        </div>
      )}

      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Solicitante</p>
        <p className="text-sm font-semibold text-brand-950">{activeContact.name || 'Sem nome'}</p>
        <p className="text-xs font-mono text-slate-500">{activeContact.number}</p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          Empresa (cliente) {companies.length > 1 ? <span className="text-red-600">*</span> : null}
        </label>
        {companies.length === 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Este contato ainda não tem empresas vinculadas. Vá a <strong>Contatos</strong> e vincule uma empresa.
          </div>
        ) : companies.length === 1 ? (
          <div className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 flex items-center text-sm text-slate-700">
            <span className="truncate">
              {companies[0].tradeName?.trim() || companies[0].legalName} ·{' '}
              <span className="font-mono">{formatCnpjInput(companies[0].cnpj)}</span>
            </span>
          </div>
        ) : (
          <select
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:border-brand-600"
            value={formCompanyId}
            onChange={(e) => onSelectCompany(e.target.value)}
          >
            <option value="">— Selecione a empresa —</option>
            {companies.map((co) => (
              <option key={co.id} value={co.id}>
                {co.tradeName?.trim() || co.legalName} — {formatCnpjInput(co.cnpj)}
              </option>
            ))}
          </select>
        )}
      </div>

      {companySelected && (
        <div className="bg-brand-50/50 p-3 rounded-md border border-brand-100 flex flex-col gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Razão social / nome fantasia</label>
            <input type="text" readOnly className={`${newTicketInputClass} border-slate-200 text-slate-700`} value={formNome} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">CNPJ</label>
            <input type="text" readOnly className={`${newTicketInputClass} border-slate-200 font-mono text-slate-700`} value={formCompanyCnpj} />
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">CPF do solicitante *</label>
        <input
          type="text"
          inputMode="numeric"
          className={`${newTicketInputClass} font-mono`}
          value={formSolicitanteCpf}
          onChange={(e) => setFormSolicitanteCpf(formatCpfCnpjInput(e.target.value))}
          placeholder="000.000.000-00"
        />
        <p className="text-[10px] text-slate-500">Gravado no perfil do contato. Pode actualizar aqui se ainda não tiver.</p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">E-mail do solicitante *</label>
        <input
          type="email"
          maxLength={254}
          className={newTicketInputClass}
          value={formEmail}
          onChange={(e) => setFormEmail(e.target.value)}
          onBlur={(e) => setFormEmail(e.target.value.trim().toLowerCase())}
          placeholder="nome@empresa.pt"
        />
      </div>

      <div className="flex gap-4">
        <NewTicketCatalogSelect
          label={CATALOG_CATEGORY_LABELS.MARCA}
          ready={!!catalogReady}
          value={formMarca}
          options={ticketCatalog?.MARCA || []}
          onChange={setFormMarca}
        />
        <NewTicketCatalogSelect
          label={CATALOG_CATEGORY_LABELS.MODELO}
          ready={!!catalogReady}
          value={formModelo}
          options={ticketCatalog?.MODELO || []}
          onChange={setFormModelo}
        />
      </div>
      <div className="flex gap-4">
        <NewTicketCatalogSelect
          label={CATALOG_CATEGORY_LABELS.CUSTOMER_TYPE}
          ready={!!catalogReady}
          value={formCustomerType}
          options={ticketCatalog?.CUSTOMER_TYPE || []}
          onChange={setFormCustomerType}
        />
        <NewTicketCatalogSelect
          label={CATALOG_CATEGORY_LABELS.TICKET_TYPE}
          ready={!!catalogReady}
          value={formTicketType}
          options={ticketCatalog?.TICKET_TYPE || []}
          onChange={setFormTicketType}
        />
      </div>
    </div>
  );
}
