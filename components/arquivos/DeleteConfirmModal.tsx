import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmModal({ title, message, onConfirm, onClose }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200" onMouseDown={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
          <p className="text-sm text-slate-500">{message}</p>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
          <button onClick={onClose} className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 h-10 px-4">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700 h-10 px-4">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}