import React from 'react';
import { Contact } from './ContactsTable';

interface DeleteContactModalProps {
  contact: Contact;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteContactModal({ contact, onClose, onConfirm }: DeleteContactModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col" onMouseDown={e => e.stopPropagation()}>
        <div className="flex flex-col space-y-2 p-6 pb-4">
          <h3 className="font-semibold tracking-tight text-lg text-slate-900">Remover Contacto?</h3>
          <p className="text-sm text-slate-500">
            Tem a certeza que pretende eliminar <b>{contact.name || contact.number}</b>? Esta ação removerá o contacto permanentemente.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 p-6 pt-0">
          <button onClick={onClose} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 h-10 px-4 py-2">
            Cancelar
          </button>
          <button onClick={onConfirm} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700 h-10 px-4 py-2 shadow-sm">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}