'use client';

import React, { useEffect, useState } from 'react';
import { canConfirmDelete, crmUserIsDeveloper } from '@/lib/delete-reason-policy';
import { DeleteReasonFields } from '@/components/ui/delete-reason-fields';

type DeleteChatModalProps = {
  onClose: () => void;
  onConfirm: (deleteReason?: string) => void | Promise<void>;
};

/** Confirmação de apagar toda a conversa actualmente aberta. */
export function DeleteChatModal({ onClose, onConfirm }: DeleteChatModalProps) {
  const [reason, setReason] = useState('');
  const skipReason = crmUserIsDeveloper();

  useEffect(() => {
    setReason('');
  }, []);

  const canConfirm = canConfirmDelete(reason);

  const handleConfirm = () => {
    if (!canConfirm) return;
    void onConfirm(skipReason ? undefined : reason.trim());
  };

  return (
    <div
      className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center overflow-y-auto">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-brand-950 mb-2">Excluir Conversa?</h3>
          <p className="text-sm text-slate-500">
            Tem a certeza que deseja apagar todas as mensagens desta conversa? Esta ação é irreversível.
          </p>
          <DeleteReasonFields value={reason} onChange={setReason} id="wa-delete-chat-reason" />
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-10 rounded-md font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 bg-white transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="bg-red-600 text-white px-4 h-10 rounded-md font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
