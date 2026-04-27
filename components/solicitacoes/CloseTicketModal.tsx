import React, { useState } from 'react';

interface CloseTicketModalProps {
  onClose: () => void;
  onConfirm: (resolution: 'SUCCESS' | 'CANCELLED', reason: string) => void;
}

export function CloseTicketModal({ onClose, onConfirm }: CloseTicketModalProps) {
  const [closeResolution, setCloseResolution] = useState<'SUCCESS' | 'CANCELLED'>('SUCCESS');
  const [closeReason, setCloseReason] = useState('');

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200" onMouseDown={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex flex-col space-y-1.5">
          <h3 className="font-semibold leading-none tracking-tight text-lg">Encerrar Solicitação</h3>
        </div>
        <div className="p-6 flex flex-col gap-5">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-900">Desfecho do atendimento</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setCloseResolution('SUCCESS')} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${closeResolution === 'SUCCESS' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500'}`}>
                <span className="text-sm font-medium">Resolvido (Ganho)</span>
              </button>
              <button onClick={() => setCloseResolution('CANCELLED')} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${closeResolution === 'CANCELLED' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500'}`}>
                <span className="text-sm font-medium">Cancelado (Perdido)</span>
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Observações Finais</label>
            <textarea className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" value={closeReason} onChange={e => setCloseReason(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-6 pt-0 bg-slate-50 border-t border-slate-100 mt-2">
          <button onClick={onClose} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-slate-200 bg-white h-10 px-4 py-2">Cancelar</button>
          <button onClick={() => onConfirm(closeResolution, closeReason)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-slate-900 text-slate-50 h-10 px-4 py-2">Confirmar</button>
        </div>
      </div>
    </div>
  );
}