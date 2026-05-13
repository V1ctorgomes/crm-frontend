import React, { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import type { PasswordResetRequestRow } from './types';

interface PasswordResetRequestsPanelProps {
  requests: PasswordResetRequestRow[];
  onCompleted: () => void;
  showFeedback: (type: 'success' | 'error', message: string) => void;
}

export function PasswordResetRequestsPanel({
  requests,
  onCompleted,
  showFeedback,
}: PasswordResetRequestsPanelProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [saving, setSaving] = useState(false);

  const closeModal = () => {
    setOpenId(null);
    setPw1('');
    setPw2('');
  };

  const submit = async () => {
    if (!openId) return;
    if (pw1.length < 8) {
      showFeedback('error', 'A palavra-passe deve ter pelo menos 8 caracteres.');
      return;
    }
    if (pw1 !== pw2) {
      showFeedback('error', 'As palavras-passe não coincidem.');
      return;
    }
    setSaving(true);
    try {
      await apiRequest(`/users/password-reset-requests/${openId}/set-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword: pw1 }),
      });
      showFeedback('success', 'Nova palavra-passe guardada. Informe o utilizador.');
      closeModal();
      onCompleted();
    } catch (e: unknown) {
      showFeedback('error', e instanceof Error ? e.message : 'Erro ao guardar.');
    } finally {
      setSaving(false);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="mb-4 rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-5 text-center text-sm text-slate-500">
        Nenhum pedido de nova palavra-passe em aberto.
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50/90 shadow-sm">
        <div className="flex items-start gap-3 border-b border-sky-200/80 bg-sky-100/60 px-4 py-3 sm:px-5">
          <KeyRound className="h-5 w-5 text-sky-800 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-sky-950">Palavra-passe esquecida</h2>
            <p className="text-xs text-sky-900/85 mt-0.5 leading-snug">
              O utilizador pediu ajuda no ecrã de login. Defina uma nova palavra-passe e comunique-lha por um canal seguro.
            </p>
          </div>
        </div>
        <ul className="divide-y divide-sky-100">
          {requests.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 px-4 py-4 sm:px-5 bg-white/90 min-w-0">
              <div className="min-w-0 w-full">
                <p className="font-semibold text-brand-950 break-words">{r.user.name}</p>
                <p className="text-xs text-slate-600 break-all">{r.user.email}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Pedido em{' '}
                  {r.createdAt
                    ? new Date(r.createdAt).toLocaleString('pt-PT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpenId(r.id);
                  setPw1('');
                  setPw2('');
                }}
                className="inline-flex h-10 w-full max-w-md items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 text-xs font-semibold text-white hover:bg-sky-800 transition-colors"
              >
                <KeyRound className="h-3.5 w-3.5 shrink-0" />
                Definir nova palavra-passe
              </button>
            </li>
          ))}
        </ul>
      </div>

      {openId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-brand-950">Nova palavra-passe</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">Mínimo 8 caracteres. O utilizador usará esta senha no próximo login.</p>
            <div className="space-y-3">
              <input
                type="password"
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                placeholder="Nova palavra-passe"
                value={pw1}
                onChange={(e) => setPw1(e.target.value)}
                autoComplete="new-password"
              />
              <input
                type="password"
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                placeholder="Repetir palavra-passe"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="h-9 px-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={saving}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
