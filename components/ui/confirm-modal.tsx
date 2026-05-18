'use client';

import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { canConfirmDelete, crmUserIsDeveloper } from '@/lib/delete-reason-policy';
import { DeleteReasonFields } from '@/components/ui/delete-reason-fields';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: (deleteReason?: string) => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmModal({ title, message, onConfirm, onClose }: ConfirmModalProps) {
  const [reason, setReason] = useState('');
  const skipReason = crmUserIsDeveloper();

  useEffect(() => {
    setReason('');
  }, [title, message]);

  const canConfirm = canConfirmDelete(reason);

  const handleConfirm = () => {
    if (!canConfirm) return;
    void onConfirm(skipReason ? undefined : reason.trim());
  };

  return (
    <div
      className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 max-h-[90vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center overflow-y-auto">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-brand-950 mb-1">{title}</h3>
          <p className="text-sm text-slate-500">{message}</p>
          <DeleteReasonFields value={reason} onChange={setReason} id="confirm-modal-delete-reason" />
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 h-10 px-4"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700 h-10 px-4 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
