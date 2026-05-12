'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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

const EXIT_ANIM_MS = 360;

export function Toast({
  type,
  message,
  title,
  durationMs = 4500,
  onDismiss,
}: ToastProps) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  const shellRef = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);
  const autoCloseRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const exitFallbackRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const runDismiss = useCallback(() => {
    dismissRef.current();
  }, []);

  const requestDismiss = useCallback(() => {
    if (autoCloseRef.current) {
      window.clearTimeout(autoCloseRef.current);
      autoCloseRef.current = null;
    }
    setLeaving((prev) => {
      if (prev) return prev;
      return true;
    });
  }, []);

  useEffect(() => {
    autoCloseRef.current = window.setTimeout(requestDismiss, durationMs);
    return () => {
      if (autoCloseRef.current) window.clearTimeout(autoCloseRef.current);
    };
  }, [durationMs, requestDismiss]);

  useEffect(() => {
    if (!leaving) return;

    const shell = shellRef.current;
    const cleanupExit = () => {
      if (exitFallbackRef.current) {
        window.clearTimeout(exitFallbackRef.current);
        exitFallbackRef.current = null;
      }
    };

    const onAnimEnd = (e: AnimationEvent) => {
      if (e.target !== shell) return;
      if (!String(e.animationName || '').includes('crm-toast-exit')) return;
      cleanupExit();
      shell.removeEventListener('animationend', onAnimEnd);
      runDismiss();
    };

    shell?.addEventListener('animationend', onAnimEnd);
    exitFallbackRef.current = window.setTimeout(() => {
      shell?.removeEventListener('animationend', onAnimEnd);
      runDismiss();
    }, EXIT_ANIM_MS + 80);

    return () => {
      cleanupExit();
      shell?.removeEventListener('animationend', onAnimEnd);
    };
  }, [leaving, runDismiss]);

  const displayTitle =
    title ?? (type === 'success' ? 'Sucesso!' : 'Erro');

  const isSuccess = type === 'success';

  return (
    <div
      className="fixed top-3 right-3 z-[9999] max-w-[min(100vw-1.5rem,20rem)] w-[min(100%-1.5rem,20rem)] md:top-6 md:right-6"
      role="status"
      aria-live="polite"
    >
      <div
        ref={shellRef}
        className={`crm-toast-shell ${
          leaving ? 'crm-toast-shell--leave' : 'crm-toast-shell--enter'
        }`}
      >
        <div className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md shadow-slate-900/8">
          <button
            type="button"
            onClick={requestDismiss}
            className="absolute right-1.5 top-1.5 z-10 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fechar notificação"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.25} />
          </button>

          <div className="flex gap-2.5 p-3 pr-9">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                isSuccess ? 'bg-emerald-50' : 'bg-red-50'
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-white ${
                  isSuccess ? 'bg-emerald-600' : 'bg-red-600'
                }`}
              >
                {isSuccess ? (
                  <svg
                    className="h-3.5 w-3.5"
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
                    className="h-3.5 w-3.5"
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
            <div className="min-w-0 flex-1 pt-px">
              <p
                className={`text-xs font-bold leading-tight ${
                  isSuccess ? 'text-emerald-950' : 'text-red-950'
                }`}
              >
                {displayTitle}
              </p>
              <p
                className={`mt-0.5 text-[11px] font-medium leading-snug ${
                  isSuccess ? 'text-emerald-900/90' : 'text-red-900/90'
                }`}
              >
                {message}
              </p>
            </div>
          </div>

          <div className="h-0.5 w-full bg-slate-100">
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
    </div>
  );
}
