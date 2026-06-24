import React from 'react';
import { Stage } from './types';
import { describeCompany } from '@/lib/companies';
import { CATALOG_CATEGORY_LABELS } from '@/lib/ticket-catalog-types';
import { useNewTicketForm } from './use-new-ticket-form';
import { NewTicketCatalogSelect, newTicketInputClass, newTicketSelectClass } from './NewTicketCatalogSelect';

interface NewTicketModalProps {
  stages: Stage[];
  onClose: () => void;
  onSuccess: () => void;
  showFeedback: (type: 'success' | 'error', msg: string) => void;
}

/** Nova OS em Solicitações: empresa (cliente) → solicitante (contato) → catálogo. */
export function NewTicketModal({ stages, onClose, onSuccess, showFeedback }: NewTicketModalProps) {
  const form = useNewTicketForm({ stages, onSuccess, showFeedback });

  return (
    <div
      className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100">
          <h3 className="font-semibold leading-none tracking-tight text-lg">Nova Solicitação (OS)</h3>
          <p className="text-sm text-slate-500">
            Seleccione a empresa (cliente) e depois o solicitante que está a pedir o serviço.
          </p>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          {form.catalogLoading && <p className="text-xs text-slate-500">A carregar listas…</p>}
          {!form.catalogLoading && !form.catalogReady && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Catálogo de OS incompleto. Peça a um <strong>Developer</strong> para preencher as listas.
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Empresa (cliente) <span className="text-red-600">*</span>
            </label>
            {form.companiesLoading ? (
              <p className="text-xs text-slate-500">A carregar empresas…</p>
            ) : form.companies.length === 0 ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Nenhuma empresa cadastrada. Cadastre em <strong>Contatos → Empresas</strong>.
              </div>
            ) : (
              <select
                className={newTicketSelectClass}
                value={form.formCompanyId}
                onChange={(e) => form.setFormCompanyId(e.target.value)}
              >
                <option value="">— Selecione a empresa —</option>
                {form.companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {describeCompany(c)}
                    {c.contactCount != null ? ` (${c.contactCount} contato${c.contactCount === 1 ? '' : 's'})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {form.formCompanyId && (
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-col gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Razão social / nome fantasia</label>
                <input type="text" readOnly className={`${newTicketInputClass} border-slate-200 text-slate-700`} value={form.formNome} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">CNPJ da empresa</label>
                <input type="text" readOnly className={`${newTicketInputClass} border-slate-200 font-mono text-slate-700`} value={form.formCompanyCnpj} />
              </div>

              <div className="space-y-1 pt-1 border-t border-slate-200">
                <label className="text-xs font-medium text-slate-600">
                  Solicitante (contato) <span className="text-red-600">*</span>
                </label>
                {form.contactsLoading ? (
                  <p className="text-xs text-slate-500">A carregar contatos…</p>
                ) : form.linkedContacts.length === 0 ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Esta empresa não tem contatos vinculados. Vincule em <strong>Contatos → Empresas</strong>.
                  </div>
                ) : (
                  <select
                    className={newTicketSelectClass}
                    value={form.selectedContactNumber}
                    onChange={(e) => form.onSelectContact(e.target.value)}
                  >
                    <option value="">— Selecione o solicitante —</option>
                    {form.linkedContacts.map((c) => (
                      <option key={c.number} value={c.number}>
                        {c.name || 'Sem nome'} ({c.number})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {form.selectedContactNumber && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">CPF do solicitante *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={`${newTicketInputClass} font-mono`}
                      value={form.formSolicitanteCpf}
                      onChange={(e) => form.setFormSolicitanteCpf(e.target.value)}
                      placeholder="000.000.000-00"
                    />
                    <p className="text-[10px] text-slate-500">Gravado no perfil do contato. Pode actualizar aqui se ainda não tiver.</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">E-mail do solicitante *</label>
                    <input
                      type="email"
                      className={newTicketInputClass}
                      value={form.formEmail}
                      onChange={(e) => form.setFormEmail(e.target.value)}
                      onBlur={(e) => form.setFormEmail(e.target.value.trim().toLowerCase())}
                      placeholder="nome@empresa.pt"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <NewTicketCatalogSelect
              label={CATALOG_CATEGORY_LABELS.MARCA}
              ready={form.catalogReady}
              value={form.formMarca}
              options={form.catalog?.MARCA || []}
              onChange={form.setFormMarca}
            />
            <NewTicketCatalogSelect
              label={CATALOG_CATEGORY_LABELS.MODELO}
              ready={form.catalogReady}
              value={form.formModelo}
              options={form.catalog?.MODELO || []}
              onChange={form.setFormModelo}
            />
          </div>
          <div className="flex gap-4">
            <NewTicketCatalogSelect
              label={CATALOG_CATEGORY_LABELS.CUSTOMER_TYPE}
              ready={form.catalogReady}
              value={form.formCustomerType}
              options={form.catalog?.CUSTOMER_TYPE || []}
              onChange={form.setFormCustomerType}
            />
            <NewTicketCatalogSelect
              label={CATALOG_CATEGORY_LABELS.TICKET_TYPE}
              ready={form.catalogReady}
              value={form.formTicketType}
              options={form.catalog?.TICKET_TYPE || []}
              onChange={form.setFormTicketType}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-6 pt-0 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 h-10 px-4 py-2 border border-slate-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void form.handleCreateTicket()}
            disabled={form.isSubmitting || form.catalogLoading || !form.catalogReady}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 h-10 px-4 py-2 disabled:opacity-50"
          >
            {form.isSubmitting ? 'A criar...' : 'Criar OS'}
          </button>
        </div>
      </div>
    </div>
  );
}
