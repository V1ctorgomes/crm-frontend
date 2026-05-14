import React from 'react';
import { Loader2 } from 'lucide-react';
import { formatCpfCnpjInput } from '@/lib/ticket-form-validation';
import { CATALOG_CATEGORY_LABELS } from '@/lib/ticket-catalog-types';
import type { TicketEditFormBag } from './use-ticket-edit-form';

const INPUT =
  'flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600';
const SELECT =
  'flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-600 disabled:bg-slate-100';

/** Modo edição da coluna lateral: inputs/selects ligados ao hook + acções guardar/cancelar. */
export function TicketSidebarEditForm({ bag }: { bag: TicketEditFormBag }) {
  return (
    <div className="flex flex-col gap-3">
      {bag.catalogLoading && <p className="text-xs text-slate-500">A carregar catálogo…</p>}
      {!bag.catalogLoading && !bag.catalogReady && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          O catálogo de OS está incompleto. Peça a um developer para configurar as listas antes de guardar.
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600">Nome completo *</label>
        <input
          type="text"
          className={INPUT}
          value={bag.nome}
          onChange={(e) => bag.setNome(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600">E-mail *</label>
        <input
          type="email"
          className={INPUT}
          value={bag.email}
          onChange={(e) => bag.setEmail(e.target.value)}
          onBlur={(e) => bag.setEmail(e.target.value.trim().toLowerCase())}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600">CPF ou CNPJ *</label>
        <input
          type="text"
          className={`${INPUT} font-mono`}
          value={bag.cpf}
          onChange={(e) => bag.setCpf(formatCpfCnpjInput(e.target.value))}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 pt-1">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">{CATALOG_CATEGORY_LABELS.MARCA} *</label>
          <select disabled={!bag.catalogReady} className={SELECT} value={bag.marca} onChange={(e) => bag.setMarca(e.target.value)}>
            <option value="">— Selecione —</option>
            {(bag.catalog?.MARCA || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">{CATALOG_CATEGORY_LABELS.MODELO} *</label>
          <select disabled={!bag.catalogReady} className={SELECT} value={bag.modelo} onChange={(e) => bag.setModelo(e.target.value)}>
            <option value="">— Selecione —</option>
            {(bag.catalog?.MODELO || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">{CATALOG_CATEGORY_LABELS.CUSTOMER_TYPE} *</label>
          <select
            disabled={!bag.catalogReady}
            className={SELECT}
            value={bag.customerType}
            onChange={(e) => bag.setCustomerType(e.target.value)}
          >
            <option value="">— Selecione —</option>
            {(bag.catalog?.CUSTOMER_TYPE || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">{CATALOG_CATEGORY_LABELS.TICKET_TYPE} *</label>
          <select
            disabled={!bag.catalogReady}
            className={SELECT}
            value={bag.ticketType}
            onChange={(e) => bag.setTicketType(e.target.value)}
          >
            <option value="">— Selecione —</option>
            {(bag.catalog?.TICKET_TYPE || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={bag.cancel}
          disabled={bag.saving}
          className="flex-1 py-2 rounded-md text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void bag.save()}
          disabled={bag.saving || !bag.catalogReady}
          className="flex-1 py-2 rounded-md text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {bag.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Guardar
        </button>
      </div>
    </div>
  );
}
