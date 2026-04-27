import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Ticket } from './types';

interface ArchivedTicketsModalProps {
  baseUrl: string;
  onClose: () => void;
  onRestoreSuccess: () => void;
  showFeedback: (type: 'success' | 'error', msg: string) => void;
}

export function ArchivedTicketsModal({ baseUrl, onClose, onRestoreSuccess, showFeedback }: ArchivedTicketsModalProps) {
  const [archivedTickets, setArchivedTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    const fetchArchived = async () => {
      const res = await fetch(`${baseUrl}/tickets/archived`);
      if (res.ok) setArchivedTickets(await res.json());
    };
    fetchArchived();
  }, [baseUrl]);

  const handleRestore = async (ticketId: string) => {
    try {
      await fetch(`${baseUrl}/tickets/${ticketId}/archive`, { 
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ isArchived: false }) 
      });
      setArchivedTickets(prev => prev.filter(t => t.id !== ticketId));
      onRestoreSuccess();
      showFeedback('success', 'OS restaurada para o funil.');
    } catch (err) { 
      showFeedback('error', 'Erro ao processar OS.'); 
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200" onMouseDown={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
           <div className="flex flex-col space-y-1.5">
              <h3 className="font-semibold leading-none tracking-tight text-lg">Histórico de Solicitações</h3>
              <p className="text-sm text-slate-500">Registo de OS encerradas (Ganhas ou Canceladas).</p>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {archivedTickets.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p className="font-medium text-sm">Nenhuma OS no histórico.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedTickets.map(t => (
                <div key={t.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 w-full flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${t.resolution === 'SUCCESS' ? 'bg-green-50 text-green-700 border-green-200' : t.resolution === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {t.resolution === 'SUCCESS' ? 'Ganho' : t.resolution === 'CANCELLED' ? 'Cancelado' : 'Encerrado'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{new Date(t.updatedAt).toLocaleDateString()}</span>
                  </div>
                  
                  <h4 className="font-semibold text-slate-900 text-sm truncate">{t.contact?.name || t.contactNumber}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 truncate">
                    {t.ticketType && `[${t.ticketType}] `}{t.customerType && `[${t.customerType}] `} {t.marca} {t.modelo}
                  </p>

                  {t.resolutionReason && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-600 line-clamp-2" title={t.resolutionReason}>
                        <span className="font-semibold text-slate-700">Motivo: </span>{t.resolutionReason}
                      </p>
                    </div>
                  )}
                  
                  <button onClick={() => handleRestore(t.id)} className="mt-4 flex items-center justify-center gap-2 w-full bg-slate-100 text-slate-700 py-2 rounded-md text-xs font-medium hover:bg-slate-200 transition-colors">
                    Restaurar para Funil
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}