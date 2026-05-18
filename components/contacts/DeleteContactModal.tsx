'use client';

import React, { useEffect, useState } from 'react';
import { Contact } from './ContactsTable';
import { canConfirmDelete, crmUserIsDeveloper } from '@/lib/delete-reason-policy';
import { DeleteReasonFields } from '@/components/ui/delete-reason-fields';

interface DeleteContactModalProps {
  contact: Contact;
  onClose: () => void;
  onConfirm: (deleteReason?: string) => void;
}

export function DeleteContactModal({ contact, onClose, onConfirm }: DeleteContactModalProps) {
  const [reason, setReason] = useState('');
  const skipReason = crmUserIsDeveloper();

  useEffect(() => {
    setReason('');
  }, [contact.number]);

  const canConfirm = canConfirmDelete(reason);

  const handleEliminar = () => {
    if (!canConfirm) return;
    onConfirm(skipReason ? undefined : reason.trim());
  };

  return (
    <div
      className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col space-y-2 p-6 pb-4 overflow-y-auto">
          <h3 className="font-semibold tracking-tight text-lg text-brand-950">Remover Contato?</h3>
          <p className="text-sm text-slate-500">
            Tem a certeza que pretende eliminar <b>{contact.name || contact.number}</b>? Esta ação removerá o contato
            permanentemente.
          </p>
          <DeleteReasonFields value={reason} onChange={setReason} id="delete-contact-reason" />
        </div>
        <div className="flex items-center justify-end gap-2 p-6 pt-0 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-brand-950 h-10 px-4 py-2"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleEliminar}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700 h-10 px-4 py-2 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
