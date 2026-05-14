import React from 'react';
import { Pencil } from 'lucide-react';
import type { Ticket } from '../types';

interface TicketSidebarInfoProps {
  ticket: Ticket;
  onEdit: () => void;
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 block">{label}</label>
      <p className={`text-sm text-slate-800 break-all${mono ? ' font-mono' : ''}`}>{value}</p>
    </div>
  );
}

/** Modo leitura da coluna lateral: dados do contacto + campos da OS + botão «Editar». */
export function TicketSidebarInfo({ ticket, onEdit }: TicketSidebarInfoProps) {
  const hasOsFields = !!(ticket.marca || ticket.modelo || ticket.customerType || ticket.ticketType);

  return (
    <>
      <div className="flex flex-col gap-4">
        <Field label="E-mail" value={ticket.contact?.email || '--'} />
        <Field label="CPF / CNPJ" value={ticket.contact?.cnpj || '--'} mono />
      </div>

      {hasOsFields && (
        <div className="pt-4 border-t border-slate-200 flex flex-col gap-4">
          {ticket.ticketType && <Field label="Tipo de Solicitação" value={ticket.ticketType} />}
          {ticket.customerType && <Field label="Tipo de Cliente" value={ticket.customerType} />}
          {ticket.marca && <Field label="Marca" value={ticket.marca} />}
          {ticket.modelo && <Field label="Modelo" value={ticket.modelo} />}
        </div>
      )}

      {!ticket.isArchived && (
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md text-sm font-medium border border-slate-200 bg-white text-brand-800 hover:bg-brand-50 transition-colors"
        >
          <Pencil className="w-4 h-4" />
          Editar solicitação
        </button>
      )}
    </>
  );
}
