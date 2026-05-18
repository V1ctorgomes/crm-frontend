'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Link2Off, Plus } from 'lucide-react';
import { apiRequest, apiDelete } from '@/lib/api-client';
import { formatCnpjInput, type Company } from '@/lib/companies';
import { DeleteConfirmModal } from '@/components/arquivos/DeleteConfirmModal';

interface LinkedContact {
  number: string;
  name: string | null;
  email: string | null;
  profilePictureUrl: string | null;
  contactKind: string | null;
}

interface AvailableContact {
  number: string;
  name?: string | null;
  profilePictureUrl?: string;
}

interface CompanyDetailsModalProps {
  company: Company;
  allContacts: AvailableContact[];
  onClose: () => void;
  onChanged: () => void;
  onShowFeedback: (type: 'success' | 'error', message: string) => void;
}

export function CompanyDetailsModal({
  company,
  allContacts,
  onClose,
  onChanged,
  onShowFeedback,
}: CompanyDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [linked, setLinked] = useState<LinkedContact[]>([]);
  const [ticketCount, setTicketCount] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [linking, setLinking] = useState(false);
  const [unlinkConfirm, setUnlinkConfirm] = useState<{ number: string; label: string } | null>(null);

  const loadDetails = async () => {
    setLoading(true);
    setTicketCount(null);
    try {
      const data = await apiRequest<{ contacts?: LinkedContact[]; ticketCount?: number }>(`/companies/${company.id}`);
      setLinked(data?.contacts || []);
      setTicketCount(typeof data?.ticketCount === 'number' ? data.ticketCount : null);
    } catch {
      onShowFeedback('error', 'Não foi possível carregar os contatos vinculados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetails();
  }, [company.id]);

  const linkedSet = useMemo(() => new Set(linked.map((c) => c.number)), [linked]);

  const candidates = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return allContacts
      .filter((c) => !linkedSet.has(c.number))
      .filter((c) => {
        if (!term) return true;
        return (
          (c.name || '').toLowerCase().includes(term) ||
          c.number.toLowerCase().includes(term)
        );
      })
      .slice(0, 8);
  }, [allContacts, linkedSet, searchTerm]);

  const handleLink = async (number: string) => {
    setLinking(true);
    try {
      await apiRequest(`/companies/${company.id}/contacts/${encodeURIComponent(number)}`, { method: 'POST' });
      await loadDetails();
      onChanged();
      onShowFeedback('success', 'Contato vinculado à empresa.');
    } catch (err) {
      onShowFeedback('error', err instanceof Error ? err.message : 'Erro ao vincular contato.');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (number: string, deleteReason?: string) => {
    setLinking(true);
    try {
      await apiDelete(`/companies/${company.id}/contacts/${encodeURIComponent(number)}`, deleteReason);
      setLinked((prev) => prev.filter((c) => c.number !== number));
      onChanged();
      onShowFeedback('success', 'Contato desvinculado.');
    } catch (err) {
      onShowFeedback('error', err instanceof Error ? err.message : 'Erro ao desvincular contato.');
    } finally {
      setLinking(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold tracking-tight text-lg text-brand-950 truncate">{company.legalName}</h3>
            <p className="text-sm text-slate-500 truncate">
              {company.tradeName ? <span className="mr-2">{company.tradeName}</span> : null}
              <span className="font-mono text-[12px]">{formatCnpjInput(company.cnpj)}</span>
            </p>
            {ticketCount != null && ticketCount > 0 ? (
              <p className="mt-2 text-xs text-amber-900 bg-amber-50 border border-amber-200/80 rounded-md px-2.5 py-1.5 leading-snug">
                {ticketCount === 1
                  ? '1 ordem de serviço está vinculada a esta empresa — não é possível eliminá-la até remover ou alterar a empresa nessa OS.'
                  : `${ticketCount} ordens de serviço estão vinculadas — eliminação bloqueada até não existir nenhuma OS com esta empresa.`}
              </p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors text-2xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
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
                          void handleLink(c.number);
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
                          <span className="text-sm font-medium text-brand-950 truncate">
                            {c.name || 'Sem nome'}
                          </span>
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
                        onClick={() => setUnlinkConfirm({ number: c.number, label: c.name || c.number })}
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
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-brand-950 h-10 px-4 py-2"
          >
            Fechar
          </button>
        </div>
      </div>

      {unlinkConfirm && (
        <DeleteConfirmModal
          title="Desvincular contato?"
          message={`O contato «${unlinkConfirm.label}» deixará de estar associado a ${company.legalName}.`}
          onClose={() => setUnlinkConfirm(null)}
          onConfirm={async (deleteReason?: string) => {
            await handleUnlink(unlinkConfirm.number, deleteReason);
            setUnlinkConfirm(null);
          }}
        />
      )}
    </div>
  );
}
