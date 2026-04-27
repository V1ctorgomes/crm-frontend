import React from 'react';

interface ToastProps {
  type: 'success' | 'error';
  message: string;
}

export function Toast({ type, message }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 md:top-8 md:right-8 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300">
      <div className="px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border bg-white border-slate-200">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          {type === 'success' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <span className="font-medium text-sm text-slate-800">{message}</span>
      </div>
    </div>
  );
}