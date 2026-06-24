'use client';

import React from 'react';
import { Link2Off } from 'lucide-react';
import type { LinkedContact } from './use-company-details-modal';

interface CompanyLinkedContactsListProps {
  loading: boolean;
  linked: LinkedContact[];
  linking: boolean;
  onUnlinkRequest: (number: string, label: string) => void;
}

export function CompanyLinkedContactsList({
  loading,
  linked,
  linking,
  onUnlinkRequest,
}: CompanyLinkedContactsListProps) {
  return (
    <section className="space-y-2">
      <h4 className="text-sm font-semibold text-brand-950">
        Contatos vinculados{' '}
        <span className="ml-1 inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
          {linked.length}
        </span>
      </h4>
      <div className="rounded-md border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-sm text-slate-500">A carregar…</div>
        ) : linked.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            Esta empresa ainda não tem contatos vinculados.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {linked.map((c) => (
              <li key={c.number} className="flex items-center gap-3 px-3 py-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden">
                  {c.profilePictureUrl ? (
                    <img src={c.profilePictureUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                  ) : (
                    (c.name || '?').substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold text-brand-950 truncate">{c.name || 'Sem nome'}</span>
                  <span className="text-[11px] text-slate-500 font-mono truncate">{c.number}</span>
                </div>
                <button
                  disabled={linking}
                  onClick={() => onUnlinkRequest(c.number, c.name || c.number)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition-colors disabled:opacity-60"
                >
                  <Link2Off className="w-3.5 h-3.5" />
                  Desvincular
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
