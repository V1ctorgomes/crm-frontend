import React, { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { Task, Ticket } from './types';

interface KanbanHeaderProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  pendingTasks: Task[];
  /** Ao abrir o painel de lembretes (marca como vistos no servidor local). */
  onRemindersPanelOpened?: () => void;
  onTaskClick: (ticket: Ticket) => void;
  onOpenArchive: () => void;
  onOpenStageManager: () => void;
  onOpenNewTicket: () => void;
}

export function KanbanHeader({
  searchTerm,
  setSearchTerm,
  pendingTasks,
  onRemindersPanelOpened,
  onTaskClick,
  onOpenArchive,
  onOpenStageManager,
  onOpenNewTicket,
}: KanbanHeaderProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const remindersAckForOpenRef = useRef(false);

  useEffect(() => {
    if (isNotificationsOpen && !remindersAckForOpenRef.current) {
      remindersAckForOpenRef.current = true;
      onRemindersPanelOpened?.();
    }
    if (!isNotificationsOpen) remindersAckForOpenRef.current = false;
  }, [isNotificationsOpen, onRemindersPanelOpened]);

  return (
    <header className="px-6 md:px-8 pt-8 md:pt-10 pb-4 flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-950">Painel Kanban</h1>
        <p className="text-slate-500 text-sm mt-1">Acompanhe e gira as Ordens de Serviço ao longo do funil.</p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
        <div className="bg-white border border-slate-200 rounded-md flex items-center px-3 h-10 w-full sm:w-[250px] shadow-sm focus-within:ring-2 focus-within:ring-brand-600/20 focus-within:border-brand-600 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 shrink-0 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
          <input 
            type="text" 
            placeholder="Pesquisar tickets..." 
            className="bg-transparent border-none outline-none w-full text-sm font-medium text-brand-950 placeholder:text-slate-400 placeholder:font-normal"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
            className={`h-10 w-10 bg-white border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 transition-colors flex items-center justify-center shadow-sm shrink-0 relative ${isNotificationsOpen ? 'ring-2 ring-brand-600/20 border-brand-600' : ''}`}
          >
            <Bell className="w-4 h-4" />
            {pendingTasks.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-sm border border-white tabular-nums animate-in zoom-in leading-none">
                {pendingTasks.length > 99 ? '99+' : pendingTasks.length}
              </span>
            )}
          </button>

          <button onClick={onOpenArchive} className="h-10 px-4 bg-white border border-slate-200 text-slate-600 font-medium rounded-md hover:bg-slate-50 transition-colors text-sm flex items-center gap-2 shadow-sm shrink-0 flex-1 sm:flex-none justify-center">
            Histórico
          </button>
          <button onClick={onOpenStageManager} className="h-10 px-4 bg-white border border-slate-200 text-slate-600 font-medium rounded-md hover:bg-slate-50 transition-colors text-sm flex items-center gap-2 shadow-sm shrink-0 flex-1 sm:flex-none justify-center">
            Fases
          </button>
          <button onClick={onOpenNewTicket} className="h-10 px-4 bg-brand-600 text-white font-medium rounded-md hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2 text-sm shrink-0 flex-1 sm:flex-none justify-center">
            Nova OS
          </button>
        </div>

        {isNotificationsOpen && (
          <div className="absolute top-[80px] right-6 md:right-8 w-[320px] bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-brand-950 text-sm">Lembretes para Hoje</h3>
              <button onClick={() => setIsNotificationsOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2">
              {pendingTasks.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">Nenhum lembrete pendente para hoje. Tudo em dia!</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {pendingTasks.map(task => {
                    const isOverdue = new Date(task.dueDate) < new Date();
                    return (
                      <div 
                        key={task.id} 
                        onClick={() => { if(task.ticket) onTaskClick(task.ticket); setIsNotificationsOpen(false); }}
                        className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100 flex flex-col gap-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium text-slate-800 text-sm line-clamp-1">{task.title}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'}`}>
                            {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 truncate">OS-{task.ticket?.id.split('-')[0].toUpperCase()} • {task.ticket?.contact?.name || task.ticket?.contactNumber}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}