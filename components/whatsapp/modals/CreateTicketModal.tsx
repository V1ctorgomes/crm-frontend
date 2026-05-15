import React from 'react';
import { formatCpfCnpjInput } from '@/lib/ticket-form-validation';
import { formatCnpjInput } from '@/lib/companies';
import { CATALOG_CATEGORY_LABELS, type TicketCatalogOptions } from '@/lib/ticket-catalog-types';
import type { Contact } from '@/components/whatsapp/types';

type CreateTicketModalProps = {
  onClose: () => void;
  activeContact: Contact;
  formNome: string;
  setFormNome: (v: string) => void;
  formEmail: string;
  setFormEmail: (v: string) => void;
  formCpf: string;
  setFormCpf: (v: string) => void;
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

/** Atalho para criar OS a partir da página WhatsApp (cliente já vem do contacto activo). */
export function CreateTicketModal({
  onClose,
  activeContact,
  formNome,
  setFormNome,
  formEmail,
  setFormEmail,
  formCpf,
  setFormCpf,
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

  return (
    <div
      className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 className="font-semibold text-lg text-brand-950">Nova solicitação (OS)</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Fechar">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <p className="text-xs text-slate-500 -mt-1">
            Todos os campos são obrigatórios. Marca, modelo e tipos vêm do catálogo (Developer → Catálogo de OS).
          </p>
          {!catalogReady && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Catálogo incompleto ou a carregar. Confirme em <strong>Developer → Catálogo de OS</strong> que existem itens ativos nas
              quatro listas.
            </div>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Nome do cliente *</label>
            <input
              type="text"
              autoComplete="name"
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              value={formNome}
              onChange={(e) => setFormNome(e.target.value)}
              placeholder="Nome completo"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">E-mail *</label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={254}
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              onBlur={(e) => setFormEmail(e.target.value.trim().toLowerCase())}
              placeholder="nome@empresa.pt"
            />
            <p className="text-[10px] text-slate-500">Formato: nome@domínio.ext (máx. 254 caracteres).</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">CPF ou CNPJ *</label>
            <input
              type="text"
              inputMode="numeric"
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-mono focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              value={formCpf}
              onChange={(e) => setFormCpf(formatCpfCnpjInput(e.target.value))}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
            />
            <p className="text-[10px] text-slate-500">11 dígitos (CPF) ou 14 (CNPJ); validação dos dígitos verificadores.</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Empresa solicitante {companies.length > 1 ? <span className="text-red-600">*</span> : null}
            </label>
            {companies.length === 0 ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Este contato ainda não tem empresas vinculadas. Vá a <strong>Contatos</strong>, edite este contato e vincule uma empresa antes de criar a OS.
              </div>
            ) : companies.length === 1 ? (
              <div className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 flex items-center text-sm text-slate-700">
                <span className="truncate">
                  {companies[0].tradeName?.trim() || companies[0].legalName} · <span className="font-mono">{formatCnpjInput(companies[0].cnpj)}</span>
                </span>
              </div>
            ) : (
              <select
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
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
            <p className="text-[10px] text-slate-500">
              Apenas empresas vinculadas a este contato aparecem aqui.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-slate-700">{CATALOG_CATEGORY_LABELS.MARCA} *</label>
              <select
                disabled={!catalogReady}
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 disabled:bg-slate-100"
                value={formMarca}
                onChange={(e) => setFormMarca(e.target.value)}
              >
                <option value="">— Selecione —</option>
                {(ticketCatalog?.MARCA || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-slate-700">{CATALOG_CATEGORY_LABELS.MODELO} *</label>
              <select
                disabled={!catalogReady}
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 disabled:bg-slate-100"
                value={formModelo}
                onChange={(e) => setFormModelo(e.target.value)}
              >
                <option value="">— Selecione —</option>
                {(ticketCatalog?.MODELO || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-slate-700">{CATALOG_CATEGORY_LABELS.CUSTOMER_TYPE} *</label>
              <select
                disabled={!catalogReady}
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 disabled:bg-slate-100"
                value={formCustomerType}
                onChange={(e) => setFormCustomerType(e.target.value)}
              >
                <option value="">— Selecione —</option>
                {(ticketCatalog?.CUSTOMER_TYPE || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-slate-700">{CATALOG_CATEGORY_LABELS.TICKET_TYPE} *</label>
              <select
                disabled={!catalogReady}
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 disabled:bg-slate-100"
                value={formTicketType}
                onChange={(e) => setFormTicketType(e.target.value)}
              >
                <option value="">— Selecione —</option>
                {(ticketCatalog?.TICKET_TYPE || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 shrink-0">
          <button type="button" onClick={onClose} className="px-4 h-10 rounded-md font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 bg-white transition-colors text-sm">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCreateTicket}
            disabled={!catalogReady}
            className="bg-brand-600 text-white px-4 h-10 rounded-md font-medium hover:bg-brand-700 transition-colors text-sm disabled:opacity-50"
          >
            Criar OS
          </button>
        </div>
      </div>
    </div>
  );
}
