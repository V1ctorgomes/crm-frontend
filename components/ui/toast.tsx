'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ToastProps {
  type: 'success' | 'error';
  message: string;
  /** Se omitido: "Sucesso!" ou "Erro" */
  title?: string;
  /** Duração visível e do auto-fechar (ms) */
  durationMs?: number;
  onDismiss: () => void;
}

export function Toast({
  type,
  message,
  title,
  durationMs = 4500,
  onDismiss,
}: ToastProps) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    const t = window.setTimeout(() => dismissRef.current(), durationMs);
    return () => window.clearTimeout(t);
  }, [durationMs]);

  const displayTitle =
    title ?? (type === 'success' ? 'Sucesso!' : 'Erro');

  const isSuccess = type === 'success';

  return (
    <div
      className="fixed top-4 right-4 z-[9999] max-w-[min(100vw-2rem,26rem)] w-[min(100%-2rem,26rem)] md:top-8 md:right-8 animate-in slide-in-from-top-3 fade-in duration-300"
      role="status"
      aria-live="polite"
    >
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-900/10">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-2.5 top-2.5 z-10 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Fechar notificação"
        >
          <X className="h-4 w-4" strokeWidth={2.25} />
        </button>

        <div className="flex gap-3 p-4 pr-11">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              isSuccess ? 'bg-emerald-50' : 'bg-red-50'
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${
                isSuccess ? 'bg-emerald-600' : 'bg-red-600'
              }`}
            >
              {isSuccess ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p
              className={`text-sm font-bold leading-tight ${
                isSuccess ? 'text-emerald-950' : 'text-red-950'
              }`}
            >
              {displayTitle}
            </p>
            <p
              className={`mt-1 text-sm font-medium leading-snug ${
                isSuccess ? 'text-emerald-900/90' : 'text-red-900/90'
              }`}
            >
              {message}
            </p>
          </div>
        </div>

        <div className="h-1 w-full bg-slate-100">
          <div
            className={`crm-toast-progress h-full ${
              isSuccess ? 'crm-toast-progress--success' : 'crm-toast-progress--error'
            }`}
            style={
              {
                '--toast-duration': `${durationMs}ms`,
              } as React.CSSProperties
            }
          />
        </div>
      </div>
    </div>
  );
}
