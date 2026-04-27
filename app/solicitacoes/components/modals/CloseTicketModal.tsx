import React, { useState } from 'react';
import { Ticket } from '@/types';

interface Props {
  isOpen: boolean;
  ticket: Ticket | null;
  onClose: () => void;
  onConfirm: (resolution: string, reason: string) => void;
}

export function CloseTicketModal({ isOpen, ticket, onClose, onConfirm }: Props) {
  const [resolution, setResolution] = useState<'SUCCESS' | 'CANCELLED'>('SUCCESS');
  const [reason, setReason] = useState('');

  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 border border-slate-200" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-semibold text-lg">Encerrar OS-{ticket.id.split('-')[0].toUpperCase()}</h3>
        </div>
        <div className="p-6 flex flex-col gap-5">
          <div className="space-y-3">
            <label className="text-sm font-semibold">Desfecho do atendimento</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setResolution('SUCCESS')} className={`flex flex-col items-center p-3 rounded-lg border-2 ${resolution === 'SUCCESS' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500'}`}><span className="text-sm font-medium">Resolvido (Ganho)</span></button>
              <button onClick={() => setResolution('CANCELLED')} className={`flex flex-col items-center p-3 rounded-lg border-2 ${resolution === 'CANCELLED' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500'}`}><span className="text-sm font-medium">Cancelado (Perdido)</span></button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Observações Finais</label>
            <textarea className="min-h-[80px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none" value={reason} onChange={e => setReason(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-6 pt-0 bg-slate-50 border-t border-slate-100 mt-2">
          <button onClick={onClose} className="h-10 px-4 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-100">Cancelar</button>
          <button onClick={() => onConfirm(resolution, reason)} className="h-10 px-4 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800">Confirmar Encerramento</button>
        </div>
      </div>
    </div>
  );
}