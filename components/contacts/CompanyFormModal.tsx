'use client';

import React, { useEffect, useState } from 'react';
import { formatCnpjInput, isValidCnpj, onlyDigits, type Company } from '@/lib/companies';

interface CompanyFormModalProps {
  initial?: Company | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: { legalName: string; tradeName: string | null; cnpj: string }) => void | Promise<void>;
  /** Preenche CNPJ quando o utilizador chega via "Cadastrar nova empresa para este contacto". */
  defaultCnpj?: string;
  /** Preenche Razão Social quando o atendente vem do termo de busca. */
  defaultLegalName?: string;
}

export function CompanyFormModal({ initial, isSaving, onClose, onSubmit, defaultCnpj, defaultLegalName }: CompanyFormModalProps) {
  const [legalName, setLegalName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setLegalName(initial.legalName || '');
      setTradeName(initial.tradeName || '');
      setCnpj(formatCnpjInput(initial.cnpj || ''));
    } else {
      setLegalName(defaultLegalName || '');
      setTradeName('');
      setCnpj(formatCnpjInput(defaultCnpj || ''));
    }
    setError(null);
  }, [initial, defaultCnpj, defaultLegalName]);

  const handleSubmit = () => {
    const ln = legalName.trim();
    const tn = tradeName.trim();
    const digits = onlyDigits(cnpj);
    if (ln.length < 2) return setError('Indique a Razão Social (mínimo 2 caracteres).');
    if (digits.length !== 14) return setError('O CNPJ deve ter 14 dígitos.');
    if (!isValidCnpj(digits)) return setError('CNPJ inválido (dígitos verificadores incorrectos).');
    setError(null);
    void onSubmit({ legalName: ln, tradeName: tn === '' ? null : tn, cnpj: digits });
  };

  return (
    <div
      className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100">
          <h3 className="font-semibold leading-none tracking-tight text-lg">
            {initial ? 'Editar Empresa' : 'Adicionar Empresa'}
          </h3>
          <p className="text-sm text-slate-500">
            {initial
              ? 'Atualize os dados desta empresa no directório.'
              : 'Cadastre uma empresa para poder vinculá-la a contatos e solicitações.'}
          </p>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">
              Razão Social <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              autoComplete="organization"
              placeholder="Ex.: Empresa Alfa Comércio LTDA"
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">Nome Fantasia</label>
            <input
              type="text"
              autoComplete="organization"
              placeholder="Ex.: Alfa"
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">
              CNPJ <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="00.000.000/0000-00"
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
              value={cnpj}
              onChange={(e) => setCnpj(formatCnpjInput(e.target.value))}
            />
            <p className="text-[10px] text-slate-500">14 dígitos, com validação dos dígitos verificadores.</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-6 pt-0">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-brand-950 h-10 px-4 py-2"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-brand-600 text-white hover:bg-brand-700 h-10 px-4 py-2 disabled:opacity-50"
          >
            {isSaving ? 'A guardar…' : initial ? 'Guardar' : 'Cadastrar Empresa'}
          </button>
        </div>
      </div>
    </div>
  );
}
