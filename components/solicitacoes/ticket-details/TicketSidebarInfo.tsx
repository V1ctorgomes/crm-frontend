import React from 'react';
import { Pencil, UserRound } from 'lucide-react';
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

/** Modo leitura da coluna lateral: empresa em destaque, contato como solicitante e campos da OS. */
export function TicketSidebarInfo({ ticket, onEdit }: TicketSidebarInfoProps) {
  const hasOsFields = !!(ticket.marca || ticket.modelo || ticket.customerType || ticket.ticketType);
  const solicitanteName = ticket.contact?.name || ticket.contactNumber;
  const cpf = ticket.contact?.cnpj || '';

  return (
    <>
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 block">
            Solicitante
          </label>
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
              {ticket.contact?.profilePictureUrl ? (
                <img
                  src={ticket.contact.profilePictureUrl}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <UserRound className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-950 truncate">{solicitanteName}</p>
              <p className="text-[11px] text-slate-500 font-mono truncate">{ticket.contactNumber}</p>
            </div>
          </div>
        </div>

        <Field label="E-mail" value={ticket.contact?.email || '--'} />
        {cpf && cpf.replace(/\D/g, '').length === 11 ? (
          <Field label="CPF" value={cpf} mono />
        ) : null}
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
