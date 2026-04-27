import React from 'react';

interface ToastProps {
  toast: { type: 'success' | 'error'; message: string } | null;
}

export function Toast({ toast }: ToastProps) {
  if (!toast) return null;

  return (
    <div className="fixed top-4 right-4 md:top-8 md:right-8 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300">
      <div className="px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border bg-white border-slate-200">
        <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="font-medium text-sm text-slate-800">{toast.message}</span>
      </div>
    </div>
  );
}