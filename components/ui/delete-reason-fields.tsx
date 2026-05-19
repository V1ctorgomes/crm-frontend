'use client';

import React from 'react';
import {
  crmUserIsDeveloper,
  MAX_DELETE_REASON_LENGTH,
  MIN_DELETE_REASON_LENGTH,
} from '@/lib/delete-reason-policy';

type DeleteReasonFieldsProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
};

/** Campo de motivo obrigatório para eliminações (omitido para papel DEVELOPER). */
export function DeleteReasonFields({ value, onChange, id = 'delete-reason' }: DeleteReasonFieldsProps) {
  if (crmUserIsDeveloper()) return null;

  const trimmedLen = value.trim().length;
  const metMin = trimmedLen >= MIN_DELETE_REASON_LENGTH;
  const overMax = trimmedLen > MAX_DELETE_REASON_LENGTH;

  return (
    <div className="mt-4 w-full text-left">
      <label htmlFor={id} className="block text-xs font-medium text-slate-600 mb-1.5">
        Motivo da eliminação <span className="text-red-600">*</span>
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        maxLength={MAX_DELETE_REASON_LENGTH}
        placeholder="Descreva por que está a eliminar este registo."
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-brand-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-600 resize-y min-h-[72px]"
      />
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 mt-1.5">
        <p className="text-[11px] text-slate-500">
          Mínimo <strong className="text-slate-700">{MIN_DELETE_REASON_LENGTH}</strong>, máximo{' '}
          <strong className="text-slate-700">{MAX_DELETE_REASON_LENGTH}</strong> caracteres.
        </p>
        <p
          className={`text-[11px] font-medium tabular-nums ${
            overMax ? 'text-red-600' : metMin ? 'text-emerald-600' : 'text-amber-700'
          }`}
          aria-live="polite"
        >
          {trimmedLen}/{MIN_DELETE_REASON_LENGTH}
          {overMax ? ` (máx. ${MAX_DELETE_REASON_LENGTH})` : ''}
        </p>
      </div>
    </div>
  );
}
