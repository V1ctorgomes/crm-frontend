import React from 'react';
import type { Ticket } from '../types';

/** Avatar, nome e número do contacto da OS, mostrados no topo da coluna esquerda. */
export function TicketSidebarHeader({ ticket }: { ticket: Ticket }) {
  return (
    <div className="p-6 flex flex-col items-center text-center border-b border-slate-200 shrink-0">
      {ticket.contact?.profilePictureUrl ? (
        <img
          src={ticket.contact.profilePictureUrl}
          referrerPolicy="no-referrer"
          className="w-20 h-20 rounded-full object-cover shadow-sm border border-slate-200 mb-3"
          alt="Perfil"
        />
      ) : (
        <div className="w-20 h-20 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-xl text-slate-400 shadow-sm mb-3">
          {(ticket.contact?.name || '?').substring(0, 2).toUpperCase()}
        </div>
      )}
      <h3 className="font-semibold text-lg text-brand-950 break-all">{ticket.contact?.name || 'Sem nome'}</h3>
      <span className="text-slate-500 font-mono text-xs mt-1 bg-white px-2 py-0.5 rounded border border-slate-200">
        {ticket.contactNumber}
      </span>
    </div>
  );
}
