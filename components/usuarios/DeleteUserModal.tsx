import React from 'react';
import { User } from './types';

interface DeleteUserModalProps {
  user: User;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteUserModal({ user, onClose, onConfirm }: DeleteUserModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col" onMouseDown={e => e.stopPropagation()}>
        <div className="flex flex-col space-y-2 p-6 pb-4 text-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h3 className="font-semibold tracking-tight text-lg text-slate-900">Remover Membro?</h3>
          <p className="text-sm text-slate-500">
            Tem a certeza que pretende eliminar <b>{user.name}</b> da equipa? Esta ação revogará os seus acessos imediatamente.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 p-6 pt-0 bg-slate-50 border-t border-slate-100 mt-2">
          <button onClick={onClose} className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 border border-slate-200 h-10 px-4 py-2 bg-white">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700 h-10 px-4 py-2 shadow-sm">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}