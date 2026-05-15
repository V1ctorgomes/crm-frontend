import React from 'react';
import { formatCnpjInput } from '@/lib/companies';
import { formatCpfCnpjInput } from '@/lib/ticket-form-validation';
import { CATALOG_CATEGORY_LABELS, type TicketCatalogOptions } from '@/lib/ticket-catalog-types';
import type { Contact } from '@/components/whatsapp/types';

type CreateTicketModalProps = {
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

/** Nova OS no WhatsApp: solicitante já definido pelo chat; empresa (cliente) é seleccionada. */
export function CreateTicketModal({
  onClose,
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
  handleCreateTicket,
  ticketCatalog,
}: CreateTicketModalProps) {
  const companies = activeContact.companies || [];
  const catalogReady =
    ticketCatalog &&
    ticketCatalog.MARCA.length > 0 &&
    ticketCatalog.MODELO.length > 0 &&
    ticketCatalog.CUSTOMER_TYPE.length > 0 &&
    ticketCatalog.TICKET_TYPE.length > 0;
  const companySelected = !!formCompanyId;

  return (
    <div
      className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
      onClick={onClose}
    >
        <div
          className="bg-white rounded-xl shadow-lg w-full max-w-md flex flex-col border border-slate-200 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
            <h3 className="font-semibold text-lg text-brand-950">Nova solicitação (OS)</h3>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Fechar">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

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
                  <input type="text" readOnly className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700" value={formNome} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">CNPJ</label>
                  <input type="text" readOnly className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-mono text-slate-700" value={formCompanyCnpj} />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">CPF do solicitante *</label>
              <input
                type="text"
                inputMode="numeric"
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-mono focus:outline-none focus:border-brand-600"
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
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:border-brand-600"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                onBlur={(e) => setFormEmail(e.target.value.trim().toLowerCase())}
                placeholder="nome@empresa.pt"
              />
            </div>

            <div className="flex gap-4">
              <CatalogField
                label={CATALOG_CATEGORY_LABELS.MARCA}
                ready={!!catalogReady}
                value={formMarca}
                options={ticketCatalog?.MARCA || []}
                onChange={setFormMarca}
              />
              <CatalogField
                label={CATALOG_CATEGORY_LABELS.MODELO}
                ready={!!catalogReady}
                value={formModelo}
                options={ticketCatalog?.MODELO || []}
                onChange={setFormModelo}
              />
            </div>
            <div className="flex gap-4">
              <CatalogField
                label={CATALOG_CATEGORY_LABELS.CUSTOMER_TYPE}
                ready={!!catalogReady}
                value={formCustomerType}
                options={ticketCatalog?.CUSTOMER_TYPE || []}
                onChange={setFormCustomerType}
              />
              <CatalogField
                label={CATALOG_CATEGORY_LABELS.TICKET_TYPE}
                ready={!!catalogReady}
                value={formTicketType}
                options={ticketCatalog?.TICKET_TYPE || []}
                onChange={setFormTicketType}
              />
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 shrink-0">
            <button type="button" onClick={onClose} className="px-4 h-10 rounded-md text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-100">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateTicket}
              disabled={!catalogReady || (companies.length > 0 && !formCompanyId)}
              className="bg-brand-600 text-white px-4 h-10 rounded-md text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              Criar OS
            </button>
          </div>
        </div>
    </div>
  );
}

function CatalogField({
  label,
  ready,
  value,
  options,
  onChange,
}: {
  label: string;
  ready: boolean;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex-1 space-y-1">
      <label className="text-sm font-medium text-slate-700">{label} *</label>
      <select
        disabled={!ready}
        className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm disabled:bg-slate-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Selecione —</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
