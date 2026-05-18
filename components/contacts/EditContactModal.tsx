'use client';

import React, { useMemo, useState } from 'react';
import { Building2, Link2Off, Plus } from 'lucide-react';
import { CONTACT_KIND_OPTIONS, type ContactKind } from '@/lib/contact-kind';
import { formatCnpjInput, type Company } from '@/lib/companies';

interface EditContactModalProps {
  contactNumber: string;
  contactName: string;
  editName: string;
  setEditName: (val: string) => void;
  editEmail: string;
  setEditEmail: (val: string) => void;
  editCnpj: string;
  setEditCnpj: (val: string) => void;
  editContactKind: ContactKind;
  setEditContactKind: (val: ContactKind) => void;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;

  linkedCompanies: Company[];
  allCompanies: Company[];
  onLinkCompany: (companyId: string) => void | Promise<void>;
  onUnlinkCompany: (companyId: string) => void | Promise<void>;
  onRequestCreateCompany: (initialLegalName?: string) => void;
  linkBusy: boolean;
  /** Grupo WhatsApp — sem e-mail/CPF nem vínculos a empresas neste modal. */
  isWhatsAppGroup?: boolean;
}

export function EditContactModal({
  contactNumber,
  contactName,
  editName,
  setEditName,
  editEmail,
  setEditEmail,
  editCnpj,
  setEditCnpj,
  editContactKind,
  setEditContactKind,
  isSaving,
  onClose,
  onSave,
  linkedCompanies,
  allCompanies,
  onLinkCompany,
  onUnlinkCompany,
  onRequestCreateCompany,
  linkBusy,
  isWhatsAppGroup = false,
}: EditContactModalProps) {
  const [companySearch, setCompanySearch] = useState('');

  const linkedSet = useMemo(() => new Set(linkedCompanies.map((c) => c.id)), [linkedCompanies]);
  const candidates = useMemo(() => {
    const term = companySearch.trim().toLowerCase();
    if (!term) return [];
    return allCompanies
      .filter((c) => !linkedSet.has(c.id))
      .filter((c) =>
        c.legalName.toLowerCase().includes(term) ||
        (c.tradeName || '').toLowerCase().includes(term) ||
        c.cnpj.replace(/\D/g, '').includes(term.replace(/\D/g, '')),
      )
      .slice(0, 6);
  }, [companySearch, allCompanies, linkedSet]);

  return (
    <div
      className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100">
          <h3 className="font-semibold leading-none tracking-tight text-lg">
            {isWhatsAppGroup ? 'Editar grupo' : 'Editar Contato'}
          </h3>
          <p className="text-sm text-slate-500">
            {contactName || (isWhatsAppGroup ? 'Grupo sem nome' : 'Contato sem nome')}{' '}
            <span className="font-mono text-[12px] text-slate-400">· {contactNumber}</span>
          </p>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">
              {isWhatsAppGroup ? 'Nome do grupo' : 'Nome do Contato'}
            </label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          {!isWhatsAppGroup && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-slate-700">Correio Eletrónico</label>
                <input
                  type="email"
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-slate-700">CPF (pessoa física)</label>
                <input
                  type="text"
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                  value={editCnpj}
                  onChange={(e) => setEditCnpj(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Para empresas (CNPJ), use a secção abaixo «Empresas vinculadas».
                </p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label htmlFor="edit-contact-kind" className="text-sm font-medium leading-none text-slate-700">
              {isWhatsAppGroup ? 'Classificação do grupo' : 'Tipo de contato'}
            </label>
            <select
              id="edit-contact-kind"
              value={editContactKind}
              onChange={(e) => setEditContactKind(e.target.value as ContactKind)}
              className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
            >
              {CONTACT_KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">
              {isWhatsAppGroup
                ? 'Indique se este grupo é usado com clientes ou com a equipa interna.'
                : 'Cliente comercial vs colaborador que escreve no mesmo número.'}
            </p>
          </div>

          {!isWhatsAppGroup && (
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
                        onClick={() => void onUnlinkCompany(c.id)}
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
          )}

        </div>

        <div className="flex items-center justify-end gap-2 p-6 pt-0 border-t border-slate-100">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-brand-950 h-10 px-4 py-2"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-brand-600 text-white hover:bg-brand-700 h-10 px-4 py-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                A guardar...
              </>
            ) : (
              'Guardar Dados'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
