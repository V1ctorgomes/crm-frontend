'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
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

type LookupPayload = { legalName: string; tradeName: string | null; cnpj: string };

export function CompanyFormModal({ initial, isSaving, onClose, onSubmit, defaultCnpj, defaultLegalName }: CompanyFormModalProps) {
  const [legalName, setLegalName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const lastFilledDigitsRef = useRef('');
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (initial) {
      setLegalName(initial.legalName || '');
      setTradeName(initial.tradeName || '');
      setCnpj(formatCnpjInput(initial.cnpj || ''));
      lastFilledDigitsRef.current = onlyDigits(initial.cnpj || '');
    } else {
      setLegalName(defaultLegalName || '');
      setTradeName('');
      setCnpj(formatCnpjInput(defaultCnpj || ''));
      lastFilledDigitsRef.current = '';
    }
    setError(null);
  }, [initial, defaultCnpj, defaultLegalName]);

  const fillFromBrasilApi = useCallback(async (digits: string) => {
    if (digits.length !== 14 || !isValidCnpj(digits)) return;
    if (fetchingRef.current || lastFilledDigitsRef.current === digits) return;

    fetchingRef.current = true;
    setLookupLoading(true);
    setError(null);
    try {
      const data = await apiRequest<LookupPayload>(`/companies/lookup/cnpj/${encodeURIComponent(digits)}`);
      if (!data) {
        throw new Error('Resposta vazia da consulta de CNPJ.');
      }
      setLegalName(data.legalName);
      setTradeName(data.tradeName?.trim() ? data.tradeName : '');
      setCnpj(formatCnpjInput(data.cnpj));
      lastFilledDigitsRef.current = onlyDigits(data.cnpj);
    } catch (e) {
      lastFilledDigitsRef.current = '';
      const msg = e instanceof Error ? e.message : 'Não foi possível consultar o CNPJ.';
      setError(msg);
    } finally {
      setLookupLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  /** Ao abrir cadastro com CNPJ já preenchido (ex.: fluxo WhatsApp), consulta logo que possível. */
  useEffect(() => {
    if (initial) return;
    const d = onlyDigits(defaultCnpj || '');
    if (d.length !== 14 || !isValidCnpj(d)) return;
    void fillFromBrasilApi(d);
  }, [initial, defaultCnpj, fillFromBrasilApi]);

  const handleCnpjBlur = () => {
    const digits = onlyDigits(cnpj);
    void fillFromBrasilApi(digits);
  };

  const handleSubmit = () => {
    const ln = legalName.trim();
    const tn = tradeName.trim();
    const digits = onlyDigits(cnpj);
    if (digits.length !== 14) return setError('O CNPJ deve ter 14 dígitos.');
    if (!isValidCnpj(digits)) return setError('CNPJ inválido (dígitos verificadores incorrectos).');
    if (ln.length < 2) return setError('Indique a Razão Social (mínimo 2 caracteres).');
    setError(null);
    void onSubmit({ legalName: ln, tradeName: tn === '' ? null : tn, cnpj: digits });
  };

  const creating = !initial;

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
              : 'Digite o CNPJ com 14 dígitos válidos — Razão Social e Nome Fantasia são preenchidos automaticamente pela consulta nacional.'}
          </p>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">
              CNPJ <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="00.000.000/0000-00"
                disabled={lookupLoading}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 disabled:bg-slate-50"
                value={cnpj}
                onChange={(e) => {
                  setCnpj(formatCnpjInput(e.target.value));
                  lastFilledDigitsRef.current = '';
                }}
                onBlur={handleCnpjBlur}
              />
              {lookupLoading && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500">
              {creating
                ? 'Ao sair do campo (tecla Tab ou clicar fora), os dados da empresa são carregados automaticamente.'
                : 'Alterou o CNPJ? Saia do campo para voltar a consultar.'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">
              Razão Social <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              autoComplete="organization"
              placeholder="Preenchido pela consulta ou edite manualmente"
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
              placeholder="Opcional — preenchido quando disponível na base"
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
            />
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
            disabled={isSaving || lookupLoading}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-brand-600 text-white hover:bg-brand-700 h-10 px-4 py-2 disabled:opacity-50"
          >
            {isSaving ? 'A guardar…' : initial ? 'Guardar' : 'Cadastrar Empresa'}
          </button>
        </div>
      </div>
    </div>
  );
}
