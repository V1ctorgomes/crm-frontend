import React, { useMemo, useState } from 'react';
import {
  TICKET_RESOLUTION_REASON_MAX,
  TICKET_RESOLUTION_REASON_MIN,
  resolutionReasonLabel,
  validateTicketResolutionReason,
} from '@/lib/ticket-resolution-validation';

interface CloseTicketModalProps {
  onClose: () => void;
  onConfirm: (resolution: 'SUCCESS' | 'CANCELLED', reason: string) => void;
}

export function CloseTicketModal({ onClose, onConfirm }: CloseTicketModalProps) {
  const [closeResolution, setCloseResolution] = useState<'SUCCESS' | 'CANCELLED'>('SUCCESS');
  const [closeReason, setCloseReason] = useState('');
  const [touched, setTouched] = useState(false);

  const reasonLabel = resolutionReasonLabel(closeResolution);

  const validation = useMemo(
    () => validateTicketResolutionReason(closeResolution, closeReason),
    [closeResolution, closeReason],
  );

  const charCount = closeReason.length;
  const atMax = charCount >= TICKET_RESOLUTION_REASON_MAX;

  const handleConfirm = () => {
    setTouched(true);
    if (!validation.ok) return;
    onConfirm(closeResolution, validation.trimmed);
  };

  const showError = touched && !validation.ok;

  return (
    <div
      className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex flex-col space-y-1.5">
          <h3 className="font-semibold leading-none tracking-tight text-lg">Encerrar Solicitação</h3>
          <p className="text-sm text-slate-500">
            Informe a justificativa do ganho ou da perda ({TICKET_RESOLUTION_REASON_MIN}–
            {TICKET_RESOLUTION_REASON_MAX} caracteres).
          </p>
        </div>
        <div className="p-6 flex flex-col gap-5">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-brand-950">Desfecho do atendimento</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCloseResolution('SUCCESS');
                  setTouched(false);
                }}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${closeResolution === 'SUCCESS' ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-200 text-slate-500'}`}
              >
                <span className="text-sm font-medium">Resolvido (Ganho)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCloseResolution('CANCELLED');
                  setTouched(false);
                }}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${closeResolution === 'CANCELLED' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500'}`}
              >
                <span className="text-sm font-medium">Cancelado (Perdido)</span>
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="close-ticket-reason" className="text-sm font-medium text-slate-700">
              {reasonLabel} <span className="text-red-600">*</span>
            </label>
            <textarea
              id="close-ticket-reason"
              required
              minLength={TICKET_RESOLUTION_REASON_MIN}
              maxLength={TICKET_RESOLUTION_REASON_MAX}
              aria-invalid={showError}
              aria-describedby="close-ticket-reason-hint close-ticket-reason-count"
              placeholder={
                closeResolution === 'SUCCESS'
                  ? 'Descreva por que a solicitação foi ganha…'
                  : 'Descreva por que a solicitação foi perdida…'
              }
              className={`flex min-h-[100px] w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none ${
                showError
                  ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-300 focus:ring-brand-600/20 focus:border-brand-600'
              }`}
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value.slice(0, TICKET_RESOLUTION_REASON_MAX))}
              onBlur={() => setTouched(true)}
            />
            <div className="flex items-start justify-between gap-2 text-xs">
              <span
                id="close-ticket-reason-hint"
                className={showError ? 'text-red-600 font-medium' : 'text-slate-500'}
              >
                {showError && !validation.ok
                  ? validation.message
                  : `Mínimo ${TICKET_RESOLUTION_REASON_MIN} caracteres.`}
              </span>
              <span
                id="close-ticket-reason-count"
                className={`tabular-nums shrink-0 ${atMax ? 'text-amber-700 font-semibold' : 'text-slate-400'}`}
              >
                {charCount}/{TICKET_RESOLUTION_REASON_MAX}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-6 pt-0 bg-slate-50 border-t border-slate-100 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-slate-200 bg-white h-10 px-4 py-2"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!validation.ok}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-brand-600 text-white hover:bg-brand-700 h-10 px-4 py-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}