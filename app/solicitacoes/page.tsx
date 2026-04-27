'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Toast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { StageColumn } from './components/StageColumn';
import { Contact, Stage, Ticket } from '@/types';
import { Bell, X } from 'lucide-react';

// Modais Extraídos
import { NewTicketModal } from './components/modals/NewTicketModal';
import { CloseTicketModal } from './components/modals/CloseTicketModal';
import { StageManagerModal } from './components/modals/StageManagerModal';
import { TicketDetailsModal } from './components/modals/TicketDetailsModal';

export default function SolicitacoesPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Controlo de Modais
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isStageManagerOpen, setIsStageManagerOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Utilidades globais
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBoardData = async () => {
    try {
      const res = await fetch(`${baseUrl}/tickets/board`);
      if (res.ok) setStages(await res.json());
    } catch (err) {}
  };

  const refreshActiveTicket = async () => {
    await fetchBoardData();
    const res = await fetch(`${baseUrl}/tickets/board`);
    if (res.ok && activeTicket) {
      const allStages: Stage[] = await res.json();
      for (const stage of allStages) {
        const found = stage.tickets.find((t) => t.id === activeTicket.id);
        if (found) { setActiveTicket(found); break; }
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchBoardData();
      try {
        const resContacts = await fetch(`${baseUrl}/whatsapp/contacts`);
        if (resContacts.ok) setContacts(await resContacts.json());
      } catch (err) {}
      setIsLoading(false);
    };
    init();
  }, [baseUrl]);

  // Lógica de Drag & Drop do Kanban
  const handleDragStart = (e: React.DragEvent, ticketId: string, sourceStageId: string) => {
    e.dataTransfer.setData('ticketId', ticketId);
    e.dataTransfer.setData('sourceStageId', sourceStageId);
  };
  
  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('ticketId');
    const sourceStageId = e.dataTransfer.getData('sourceStageId');
    if (sourceStageId === targetStageId) return;

    setStages(prev => {
      const newStages = [...prev];
      const sourceStage = newStages.find(s => s.id === sourceStageId);
      const targetStage = newStages.find(s => s.id === targetStageId);
      if (sourceStage && targetStage) {
        const ticketIndex = sourceStage.tickets.findIndex(t => t.id === ticketId);
        if(ticketIndex !== -1) {
          const [ticket] = sourceStage.tickets.splice(ticketIndex, 1);
          targetStage.tickets.unshift(ticket); 
        }
      }
      return newStages;
    });

    try { await fetch(`${baseUrl}/tickets/${ticketId}/stage`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stageId: targetStageId }) }); } 
    catch (err) { fetchBoardData(); }
  };

  const handleCloseOS = async (resolution: string, reason: string) => {
    if (!activeTicket) return;
    try {
      await fetch(`${baseUrl}/tickets/${activeTicket.id}/archive`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isArchived: true, resolution, resolutionReason: reason }) });
      setActiveTicket(null); setIsCloseModalOpen(false); fetchBoardData();
      showFeedback('success', 'OS encerrada e enviada para o Histórico.');
    } catch (err) { showFeedback('error', 'Erro ao processar OS.'); }
  };

  const filteredStages = stages.map(stage => ({
    ...stage, tickets: stage.tickets.filter(t => !searchTerm || t.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || t.contactNumber.includes(searchTerm) || t.ticketType?.toLowerCase().includes(searchTerm.toLowerCase()))
  }));

  const pendingTasks = stages.flatMap(s => s.tickets).flatMap(t => t.tasks ? t.tasks.map(task => ({ ...task, ticket: t })) : []).filter(task => !task.isCompleted && new Date(task.dueDate) <= new Date(new Date().setHours(23, 59, 59, 999)));

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative">
        <Toast toast={toast} />

        <header className="px-6 pt-8 pb-4 flex flex-col xl:flex-row justify-between gap-6 shrink-0 z-10">
          <div><h1 className="text-2xl font-bold">Painel Kanban</h1><p className="text-slate-500 text-sm">Gira as Ordens de Serviço.</p></div>
          <div className="flex items-center gap-3">
            <input type="text" placeholder="Pesquisar..." className="h-10 px-3 border rounded-md text-sm outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="h-10 w-10 border rounded-md flex items-center justify-center relative hover:bg-slate-50"><Bell className="w-4 h-4"/>{pendingTasks.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{pendingTasks.length}</span>}</button>
            <button onClick={() => setIsStageManagerOpen(true)} className="h-10 px-4 border rounded-md text-sm font-medium hover:bg-slate-50">Fases</button>
            <button onClick={() => setIsNewModalOpen(true)} className="h-10 px-4 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800">Nova OS</button>
          </div>
        </header>

        <div className="flex-1 overflow-x-auto p-6 flex gap-5 items-start">
          {isLoading ? ( <div className="m-auto w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"/> ) : (
            filteredStages.map((stage) => (
              <StageColumn key={stage.id} stage={stage} searchTerm={searchTerm} onDragOver={e => e.preventDefault()} onDrop={handleDrop} onDragStart={handleDragStart} onTicketClick={(t) => setActiveTicket(t)} />
            ))
          )}
        </div>
      </main>

      {/* RENDERIZAÇÃO DOS MODAIS */}
      <NewTicketModal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} contacts={contacts} stages={stages} baseUrl={baseUrl} onSuccess={(msg) => { showFeedback('success', msg); fetchBoardData(); }} onError={(msg) => showFeedback('error', msg)} />
      <StageManagerModal isOpen={isStageManagerOpen} onClose={() => setIsStageManagerOpen(false)} baseUrl={baseUrl} onSuccess={fetchBoardData} onError={(msg) => showFeedback('error', msg)} />
      <TicketDetailsModal ticket={activeTicket} onClose={() => setActiveTicket(null)} baseUrl={baseUrl} onUpdate={refreshActiveTicket} showFeedback={showFeedback} onOpenCloseTicketModal={() => setIsCloseModalOpen(true)} />
      <CloseTicketModal isOpen={isCloseModalOpen} ticket={activeTicket} onClose={() => setIsCloseModalOpen(false)} onConfirm={handleCloseOS} />
    </div>
  );
}