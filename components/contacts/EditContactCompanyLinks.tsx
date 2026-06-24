'use client';

import { Building2, Link2Off, Plus } from 'lucide-react';
import { formatCnpjInput, type Company } from '@/lib/companies';

export interface EditContactCompanyLinksProps {
  linkedCompanies: Company[];
  companySearch: string;
  setCompanySearch: (val: string) => void;
  candidates: Company[];
  linkBusy: boolean;
  onLinkCompany: (companyId: string) => void | Promise<void>;
  onRequestCreateCompany: (initialLegalName?: string) => void;
  onRequestUnlink: (company: Company) => void;
}

export function EditContactCompanyLinks({
  linkedCompanies,
  companySearch,
  setCompanySearch,
  candidates,
  linkBusy,
  onLinkCompany,
  onRequestCreateCompany,
  onRequestUnlink,
}: EditContactCompanyLinksProps) {
  return (
    <div className="border-t border-slate-100 pt-4 space-y-3">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-brand-600" />
        <h4 className="text-sm font-semibold text-brand-950">Empresas vinculadas</h4>
        <span className="ml-1 inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
          {linkedCompanies.length}
        </span>
      </div>

      {linkedCompanies.length === 0 ? (
        <p className="text-xs text-slate-500">Este contato ainda não tem empresas vinculadas.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-md border border-slate-200 overflow-hidden">
          {linkedCompanies.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-md bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold text-brand-950 truncate">{c.legalName}</span>
                <span className="text-[11px] text-slate-500 font-mono truncate">
                  {c.tradeName ? `${c.tradeName} · ` : ''}
                  {formatCnpjInput(c.cnpj)}
                </span>
              </div>
              <button
                disabled={linkBusy}
                onClick={() => onRequestUnlink(c)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition-colors disabled:opacity-60"
              >
                <Link2Off className="w-3.5 h-3.5" /> Desvincular
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600">Vincular nova empresa</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Procurar empresa por nome ou CNPJ..."
            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
          />
          {companySearch && (
            <div className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-md max-h-[260px] overflow-y-auto">
              {candidates.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-500 flex items-center justify-between gap-3">
                  <span>Nenhuma empresa encontrada para «{companySearch}».</span>
                  <button
                    onClick={() => {
                      onRequestCreateCompany(companySearch);
                      setCompanySearch('');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
                  >
                    <Plus className="w-3 h-3" /> Cadastrar
                  </button>
                </div>
              ) : (
                <>
                  {candidates.map((c) => (
                    <button
                      key={c.id}
                      disabled={linkBusy}
                      onClick={() => {
                        setCompanySearch('');
                        void onLinkCompany(c.id);
                      }}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-brand-50/50 transition-colors w-full text-left disabled:opacity-60"
                    >
                      <div className="w-8 h-8 rounded-md bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium text-brand-950 truncate">{c.legalName}</span>
                        <span className="text-[11px] text-slate-500 font-mono truncate">
                          {c.tradeName ? `${c.tradeName} · ` : ''}
                          {formatCnpjInput(c.cnpj)}
                        </span>
                      </div>
                      <Plus className="w-4 h-4 text-brand-600" />
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      onRequestCreateCompany(companySearch);
                      setCompanySearch('');
                    }}
                    className="flex items-center gap-2 px-3 py-2 border-t border-slate-100 w-full text-left text-xs font-semibold text-brand-700 hover:bg-brand-50/50"
                  >
                    <Plus className="w-3.5 h-3.5" /> Cadastrar nova empresa «{companySearch}»
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <p className="text-[10px] text-slate-500">
          Um contato pode estar vinculado a várias empresas; a OS pergunta qual está a solicitar.
        </p>
      </div>
    </div>
  );
}
