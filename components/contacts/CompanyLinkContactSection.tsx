'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import type { AvailableContact } from './use-company-details-modal';

interface CompanyLinkContactSectionProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  candidates: AvailableContact[];
  linking: boolean;
  onLink: (number: string) => void;
}

export function CompanyLinkContactSection({
  searchTerm,
  setSearchTerm,
  candidates,
  linking,
  onLink,
}: CompanyLinkContactSectionProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-brand-950">Vincular contato</h4>
      </div>
      <div className="relative">
        <input
          type="text"
          placeholder="Procurar contato por nome ou número..."
          className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-md max-h-[240px] overflow-y-auto">
            {candidates.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-500">
                Nenhum contato encontrado para «{searchTerm}».
              </div>
            ) : (
              candidates.map((c) => (
                <button
                  key={c.number}
                  disabled={linking}
                  onClick={() => {
                    setSearchTerm('');
                    void onLink(c.number);
                  }}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-brand-50/50 transition-colors w-full text-left disabled:opacity-60"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden">
                    {c.profilePictureUrl ? (
                      <img src={c.profilePictureUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                    ) : (
                      (c.name || '?').substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium text-brand-950 truncate">{c.name || 'Sem nome'}</span>
                    <span className="text-[11px] text-slate-500 font-mono truncate">{c.number}</span>
                  </div>
                  <Plus className="w-4 h-4 text-brand-600" />
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <p className="text-[11px] text-slate-500">
        Apenas contatos já cadastrados via WhatsApp aparecem; novos contatos são criados automaticamente quando mandam mensagem.
      </p>
    </section>
  );
}
