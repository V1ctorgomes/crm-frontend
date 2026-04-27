'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  CheckCircle2, Circle, Clock, Trash2, Calendar, Bell, X
} from 'lucide-react';

interface Contact { 
  number: string; 
  name: string; 
  profilePictureUrl?: string; 
  email?: string; 
  cnpj?: string; 
}

interface Note { id: string; text: string; createdAt: string; }
interface Task { id: string; title: string; dueDate: string; isCompleted: boolean; createdAt: string; }

interface TicketFile {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  description?: string;
  createdAt: string;
}

interface Stage { 
  id: string; 
  name: string; 
  color: string; 
  order: number; 
  isActive: boolean; 
  tickets: Ticket[]; 
}

interface Ticket { 
  id: string; 
  contactNumber: string; 
  contact?: Contact; 
  marca: string | null; 
  modelo: string | null; 
  customerType: string | null;
  createdAt: string; 
  updatedAt: string;
  notes?: Note[]; 
  tasks?: Task[]; // NOVO
  files?: TicketFile[];
  isArchived: boolean; 
  resolution?: string; 
  resolutionReason?: string; 
  stage?: Stage; 
}

const PREDEFINED_COLORS = ['#94a3b8', '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#c084fc', '#fb923c', '#f472b6', '#2dd4bf', '#fbbf24'];

export default function SolicitacoesPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  
  const [activeTab, setActiveTab] = useState<'notes' | 'files' | 'tasks'>('notes');

  const [selectedContactNumber, setSelectedContactNumber] = useState('');
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [formCustomerType, setFormCustomerType] = useState('');

  const [newNoteText, setNewNoteText] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isStageManagerOpen, setIsStageManagerOpen] = useState(false);
  const [allStages, setAllStages] = useState<Stage[]>([]);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState(PREDEFINED_COLORS[0]);

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closeResolution, setCloseResolution] = useState<'SUCCESS' | 'CANCELLED'>('SUCCESS');
  const [closeReason, setCloseReason] = useState('');

  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);
  const [archivedTickets, setArchivedTickets] = useState<Ticket[]>([]);

  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; } | null>(null);

  // ESTADO NOTIFICAÇÕES
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBoardData = async () => {
    try {
      const res = await fetch(`${baseUrl}/tickets/board`);
      if (res.ok) {
        const data = await res.json();
        setStages(data);
        return data;
      }
    } catch (err) { console.error(err); }
    return null;
  };

  const fetchContactsData = async () => {
    try {
      const res = await fetch(`${baseUrl}/whatsapp/contacts`);
      if (res.ok) setContacts(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchData = async () => {
    setIsLoading(true);
    await fetchContactsData();
    await fetchBoardData();
    setIsLoading(false);
  };

  const refreshActiveTicket = async () => {
    const boardData = await fetchBoardData();
    if (activeTicket && boardData) {
      let foundTicket = null;
      for (const stage of boardData) {
        const found = stage.tickets.find((t: Ticket) => t.id === activeTicket.id);
        if (found) { foundTicket = found; break; }
      }
      if (foundTicket) setActiveTicket(foundTicket);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const contact = contacts.find(c => c.number === selectedContactNumber);
    if (contact) { setFormNome(contact.name || ''); setFormEmail(contact.email || ''); setFormCpf(contact.cnpj || ''); }
  }, [selectedContactNumber, contacts]);

  const handleDragStart = (e: React.DragEvent, ticketId: string, sourceStageId: string) => {
    e.dataTransfer.setData('ticketId', ticketId);
    e.dataTransfer.setData('sourceStageId', sourceStageId);
  };
  
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  
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

    try { 
      await fetch(`${baseUrl}/tickets/${ticketId}/stage`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stageId: targetStageId }) }); 
    } catch (err) { 
      fetchBoardData(); 
    }
  };

  const handleCreateTicket = async () => {
    if (!selectedContactNumber || stages.length === 0) return showFeedback('error', "Selecione um cliente e garanta que existe uma fase ativa no funil.");
    const body = { 
      contactNumber: selectedContactNumber, 
      nome: formNome, 
      email: formEmail, 
      cpf: formCpf, 
      marca: formMarca, 
      modelo: formModelo, 
      customerType: formCustomerType,
      stageId: stages[0].id 
    };
    try {
      const res = await fetch(`${baseUrl}/tickets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { 
        setIsNewTicketModalOpen(false); 
        setFormMarca(''); setFormModelo(''); setFormCustomerType(''); setSelectedContactNumber(''); 
        await fetchBoardData(); 
        showFeedback('success', 'Ordem de Serviço (OS) criada com sucesso!');
      }
    } catch (err) { showFeedback('error', 'Erro de conexão ao criar OS.'); }
  };

  // --- MÉTODOS DE TAREFAS ---
  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !newTaskDate || !activeTicket) return;
    try {
      const res = await fetch(`${baseUrl}/tickets/${activeTicket.id}/tasks`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ title: newTaskTitle, dueDate: newTaskDate }) 
      });
      if (res.ok) { 
        setNewTaskTitle(''); setNewTaskDate(''); 
        await refreshActiveTicket(); 
        showFeedback('success', 'Lembrete agendado!');
      }
    } catch (err) { showFeedback('error', 'Erro ao agendar lembrete.'); }
  };

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    try {
      await fetch(`${baseUrl}/tickets/tasks/${taskId}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ isCompleted: !isCompleted }) 
      });
      await refreshActiveTicket();
      await fetchBoardData(); // Para atualizar notificações no header
    } catch (err) { showFeedback('error', 'Erro ao atualizar tarefa.'); }
  };

  const handleDeleteTask = (taskId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Apagar Lembrete?",
      message: "Tem a certeza que deseja apagar este lembrete?",
      onConfirm: async () => {
        try {
          await fetch(`${baseUrl}/tickets/tasks/${taskId}`, { method: 'DELETE' });
          await refreshActiveTicket(); 
          await fetchBoardData();
          showFeedback('success', 'Lembrete apagado.'); 
        } catch (err) { showFeedback('error', 'Erro ao apagar.'); }
        setConfirmModal(null);
      }
    });
  };

  // --- NOTAS, FICHEIROS E ARQUIVAMENTO ---
  const handleAddNote = async () => {
    if (!newNoteText.trim() || !activeTicket) return;
    try {
      const res = await fetch(`${baseUrl}/tickets/${activeTicket.id}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: newNoteText }) });
      if (res.ok) { setNewNoteText(''); await refreshActiveTicket(); showFeedback('success', 'Nota adicionada ao histórico!'); }
    } catch (err) { showFeedback('error', 'Erro ao adicionar nota.'); }
  };

  const handleDeleteNote = (noteId: string) => {
    setConfirmModal({
      isOpen: true, title: "Apagar Nota?", message: "Tem a certeza que deseja apagar esta nota? Esta ação é irreversível.",
      onConfirm: async () => {
        try {
          const res = await fetch(`${baseUrl}/tickets/notes/${noteId}`, { method: 'DELETE' });
          if (res.ok) { await refreshActiveTicket(); showFeedback('success', 'Nota apagada.'); }
        } catch (err) { showFeedback('error', 'Erro ao apagar nota.'); }
        setConfirmModal(null);
      }
    });
  };

  const handleToggleArchive = async (ticketId: string, archive: boolean, resolution?: string, reason?: string) => {
    try {
      await fetch(`${baseUrl}/tickets/${ticketId}/archive`, { 
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ isArchived: archive, resolution, resolutionReason: reason }) 
      });
      setActiveTicket(null); setIsCloseModalOpen(false); setCloseReason(''); setCloseResolution('SUCCESS');
      await fetchBoardData();
      if (!archive) { openArchivedModal(); showFeedback('success', 'OS restaurada para o funil.'); } 
      else showFeedback('success', 'OS encerrada e enviada para o Histórico.');
    } catch (err) { showFeedback('error', 'Erro ao processar OS.'); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { showFeedback('error', "Arquivo muito grande (máx 15MB)."); return; }
    setPendingFile(file); setFileDescription('');
  };

  const confirmUploadFile = async () => {
    if (!pendingFile || !activeTicket) return;
    setIsUploadingFile(true);
    const formData = new FormData();
    formData.append('file', pendingFile);
    if (fileDescription.trim()) formData.append('description', fileDescription.trim());

    try {
      const res = await fetch(`${baseUrl}/tickets/${activeTicket.id}/files`, { method: 'POST', body: formData });
      if (res.ok) { setPendingFile(null); setFileDescription(''); await refreshActiveTicket(); showFeedback('success', 'Arquivo anexado com sucesso!'); } 
      else showFeedback('error', "Erro ao enviar ficheiro.");
    } catch (error) { showFeedback('error', "Erro de conexão."); } 
    finally { setIsUploadingFile(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleDeleteFile = (fileId: string) => {
    setConfirmModal({
      isOpen: true, title: "Remover Anexo?", message: "Tem a certeza que deseja apagar este ficheiro? Não poderá ser recuperado.",
      onConfirm: async () => {
        try {
          const res = await fetch(`${baseUrl}/tickets/files/${fileId}`, { method: 'DELETE' });
          if (res.ok) { await refreshActiveTicket(); showFeedback('success', 'Ficheiro removido.'); }
        } catch (error) { showFeedback('error', 'Erro ao remover ficheiro.'); }
        setConfirmModal(null);
      }
    });
  };

  const openStageManager = async () => {
    setIsStageManagerOpen(true);
    const res = await fetch(`${baseUrl}/tickets/stages`);
    if (res.ok) setAllStages(await res.json());
  };

  const handleCreateStage = async () => {
    if (!newStageName.trim()) return;
    try {
      const res = await fetch(`${baseUrl}/tickets/stages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newStageName, color: newStageColor }) });
      if (res.ok) { setNewStageName(''); setNewStageColor(PREDEFINED_COLORS[0]); openStageManager(); fetchBoardData(); showFeedback('success', 'Fase criada com sucesso!'); }
    } catch (err) { showFeedback('error', 'Erro ao criar fase.'); }
  };

  const handleToggleStageActive = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`${baseUrl}/tickets/stages/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !currentStatus }) });
      openStageManager(); fetchBoardData();
    } catch (err) { showFeedback('error', 'Erro ao atualizar fase.'); }
  };

  const handleDeleteStage = (id: string) => {
    setConfirmModal({
      isOpen: true, title: "Apagar Fase?", message: "Tem a certeza que deseja apagar esta fase permanentemente? As suas OS poderão ser afetadas.",
      onConfirm: async () => {
        try {
          const res = await fetch(`${baseUrl}/tickets/stages/${id}`, { method: 'DELETE' });
          if (res.ok) { openStageManager(); fetchBoardData(); showFeedback('success', 'Fase removida permanentemente.'); } 
          else { const data = await res.json(); showFeedback('error', data.message || "Erro ao apagar fase."); }
        } catch (err) { showFeedback('error', 'Erro de conexão.'); }
        setConfirmModal(null);
      }
    });
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const newStages = [...allStages];
    if (direction === 'up' && index > 0) { [newStages[index - 1], newStages[index]] = [newStages[index], newStages[index - 1]]; } 
    else if (direction === 'down' && index < newStages.length - 1) { [newStages[index + 1], newStages[index]] = [newStages[index], newStages[index + 1]]; } 
    else return;

    const payload = newStages.map((s, i) => ({ id: s.id, order: i + 1 }));
    setAllStages(newStages); 
    try {
      await fetch(`${baseUrl}/tickets/stages/reorder`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stages: payload }) });
      fetchBoardData();
    } catch (err) { showFeedback('error', 'Erro ao reordenar fases.'); }
  };

  const openArchivedModal = async () => {
    setIsArchivedModalOpen(true);
    const res = await fetch(`${baseUrl}/tickets/archived`);
    if (res.ok) setArchivedTickets(await res.json());
  };

  const filteredStages = stages.map(stage => ({
    ...stage,
    tickets: stage.tickets.filter(t => {
      if (!searchTerm) return true;
      const lowerSearch = searchTerm.toLowerCase();
      return (
        t.contact?.name?.toLowerCase().includes(lowerSearch) ||
        t.contactNumber.includes(lowerSearch) ||
        t.marca?.toLowerCase().includes(lowerSearch) ||
        t.modelo?.toLowerCase().includes(lowerSearch) ||
        t.customerType?.toLowerCase().includes(lowerSearch)
      );
    })
  }));

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // SISTEMA DE NOTIFICAÇÕES (TAREFAS VENCIDAS OU DE HOJE)
  const pendingTasks = stages.flatMap(s => s.tickets).flatMap(t => t.tasks ? t.tasks.map(task => ({ ...task, ticket: t })) : []).filter(task => {
    if (task.isCompleted) return false;
    const dueDate = new Date(task.dueDate);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return dueDate <= endOfToday;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden">
        
        {toast && (
          <div className="fixed top-4 right-4 md:top-8 md:right-8 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300">
            <div className="px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border bg-white border-slate-200">
              <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium text-sm text-slate-800">{toast.message}</span>
            </div>
          </div>
        )}

        {/* CABEÇALHO DO KANBAN */}
        <header className="px-6 md:px-8 pt-8 md:pt-10 pb-4 flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Painel Kanban</h1>
            <p className="text-slate-500 text-sm mt-1">Acompanhe e gira as Ordens de Serviço ao longo do funil.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="bg-white border border-slate-200 rounded-md flex items-center px-3 h-10 w-full sm:w-[250px] shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 shrink-0 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
              <input 
                type="text" 
                placeholder="Pesquisar tickets..." 
                className="bg-transparent border-none outline-none w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              
              {/* SINO DE NOTIFICAÇÕES */}
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
                className={`h-10 w-10 bg-white border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 transition-colors flex items-center justify-center shadow-sm shrink-0 relative ${isNotificationsOpen ? 'ring-2 ring-blue-500/20 border-blue-500' : ''}`}
              >
                <Bell className="w-4 h-4" />
                {pendingTasks.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-sm border border-white animate-in zoom-in">
                    {pendingTasks.length}
                  </span>
                )}
              </button>

              <button onClick={openArchivedModal} className="h-10 px-4 bg-white border border-slate-200 text-slate-600 font-medium rounded-md hover:bg-slate-50 transition-colors text-sm flex items-center gap-2 shadow-sm shrink-0 flex-1 sm:flex-none justify-center">
                Histórico
              </button>
              <button onClick={openStageManager} className="h-10 px-4 bg-white border border-slate-200 text-slate-600 font-medium rounded-md hover:bg-slate-50 transition-colors text-sm flex items-center gap-2 shadow-sm shrink-0 flex-1 sm:flex-none justify-center">
                Fases
              </button>
              <button onClick={() => setIsNewTicketModalOpen(true)} className="h-10 px-4 bg-slate-900 text-white font-medium rounded-md hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2 text-sm shrink-0 flex-1 sm:flex-none justify-center">
                Nova OS
              </button>
            </div>

            {/* DROPDOWN DE NOTIFICAÇÕES */}
            {isNotificationsOpen && (
              <div className="absolute top-[80px] right-6 md:right-8 w-[320px] bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-900 text-sm">Lembretes para Hoje</h3>
                  <button onClick={() => setIsNotificationsOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2">
                  {pendingTasks.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">Nenhum lembrete pendente para hoje. Tudo em dia! 🎉</div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {pendingTasks.map(task => {
                        const isOverdue = new Date(task.dueDate) < new Date();
                        return (
                          <div 
                            key={task.id} 
                            onClick={() => { setActiveTicket(task.ticket); setActiveTab('tasks'); setIsNotificationsOpen(false); }}
                            className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100 flex flex-col gap-1"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium text-slate-800 text-sm line-clamp-1">{task.title}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 truncate">OS-{task.ticket.id.split('-')[0].toUpperCase()} • {task.ticket.contact?.name || task.ticket.contactNumber}</span>
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

        {/* ================= QUADRO KANBAN ================= */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 md:px-8">
          <div className="flex h-full gap-5 items-start w-max pb-4 animate-in fade-in duration-700">
            {isLoading ? (
              <div className="w-[calc(100vw-300px)] flex justify-center items-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin shadow-sm"></div>
                  <span className="text-slate-500 font-medium text-sm">A carregar funil...</span>
                </div>
              </div>
            ) : filteredStages.length === 0 ? (
              <div className="w-[calc(100vw-300px)] flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>
                </div>
                <h4 className="font-semibold text-slate-900 text-lg">Funil Vazio</h4>
                <p className="text-sm text-slate-500 mt-1">Configure as suas fases de atendimento para começar.</p>
              </div>
            ) : (
              filteredStages.map((stage) => (
                <div 
                  key={stage.id} 
                  className="w-[320px] bg-slate-100/50 rounded-xl flex flex-col max-h-full border border-slate-200 shadow-sm overflow-hidden"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <div className="h-1 w-full" style={{ backgroundColor: stage.color }}></div>
                  
                  <div className="px-4 py-3 flex justify-between items-center shrink-0 bg-white border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }}></div>
                      <h3 className="font-semibold text-slate-800 text-sm">{stage.name}</h3>
                    </div>
                    <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-md border border-slate-200">
                      {stage.tickets.length}
                    </span>
                  </div>
                  
                  <div className="p-3 flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-3 no-scrollbar">
                    {stage.tickets.length === 0 && searchTerm ? (
                      <p className="text-xs text-slate-400 text-center mt-4 font-medium">Nenhum resultado nesta fase.</p>
                    ) : (
                      stage.tickets.map((ticket) => {
                        const pendingTicketTasks = ticket.tasks?.filter(t => !t.isCompleted) || [];
                        const hasOverdue = pendingTicketTasks.some(t => new Date(t.dueDate) < new Date());

                        return (
                        <div 
                          key={ticket.id} 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, ticket.id, stage.id)} 
                          onClick={() => {setActiveTicket(ticket); setActiveTab('tasks');}}
                          className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors w-full overflow-hidden group"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded font-mono">OS-{ticket.id.split('-')[0].toUpperCase()}</span>
                            <div className="flex gap-1.5">
                              {pendingTicketTasks.length > 0 && (
                                <span className={`text-[10px] ${hasOverdue ? 'text-red-600 bg-red-50 border-red-100' : 'text-blue-600 bg-blue-50 border-blue-100'} border px-1.5 py-0.5 rounded font-medium flex items-center gap-1`}>
                                  <Clock className="w-3 h-3" />
                                  {pendingTicketTasks.length}
                                </span>
                              )}
                              {(ticket.files || []).length > 0 && (
                                <span className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                                  Anexo
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                               {ticket.contact?.profilePictureUrl ? (
                                  <img src={ticket.contact.profilePictureUrl} referrerPolicy="no-referrer" className="w-full h-full rounded-full object-cover" alt="" />
                               ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-slate-400"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                               )}
                            </div>
                            <h4 className="font-semibold text-slate-800 text-sm truncate">{ticket.contact?.name || ticket.contactNumber}</h4>
                          </div>

                          {(ticket.marca || ticket.modelo || ticket.customerType) && (
                            <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-100">
                              {ticket.customerType && <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded truncate">{ticket.customerType}</span>}
                              {ticket.marca && <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded truncate">{ticket.marca}</span>}
                              {ticket.modelo && <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded truncate">{ticket.modelo}</span>}
                            </div>
                          )}
                        </div>
                      )})
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* ================= MODAL NOVA SOLICITAÇÃO ================= */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsNewTicketModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100">
              <h3 className="font-semibold leading-none tracking-tight text-lg">Nova Solicitação (OS)</h3>
              <p className="text-sm text-slate-500">Crie uma nova Ordem de Serviço e insira no funil.</p>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-slate-700">Cliente / Contato</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900" 
                  value={selectedContactNumber} 
                  onChange={(e) => setSelectedContactNumber(e.target.value)}
                >
                  <option value="">-- Selecione o cliente --</option>
                  {contacts.map(c => <option key={c.number} value={c.number}>{c.name || 'Sem nome'} ({c.number})</option>)}
                </select>
              </div>
              
              {selectedContactNumber && (
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-col gap-3">
                  <input type="text" placeholder="Nome Completo" className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={formNome} onChange={e => setFormNome(e.target.value)} />
                  <input type="email" placeholder="Endereço de E-mail" className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                  <input type="text" placeholder="CPF / CNPJ" className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={formCpf} onChange={e => setFormCpf(e.target.value)} />
                </div>
              )}
              
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium leading-none text-slate-700">Marca</label>
                  <input type="text" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={formMarca} onChange={e => setFormMarca(e.target.value)} placeholder="Ex: Apple" />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium leading-none text-slate-700">Modelo</label>
                  <input type="text" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={formModelo} onChange={e => setFormModelo(e.target.value)} placeholder="Ex: iPhone 13" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-slate-700">Tipo de Cliente (Opcional)</label>
                <input type="text" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={formCustomerType} onChange={e => setFormCustomerType(e.target.value)} placeholder="Ex: Revenda" />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 p-6 pt-0">
              <button onClick={() => setIsNewTicketModalOpen(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 h-10 px-4 py-2 border border-slate-200">Cancelar</button>
              <button onClick={handleCreateTicket} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-10 px-4 py-2">Criar OS</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DA OS (DETALHES) ================= */}
      {activeTicket && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => { setActiveTicket(null); setActiveTab('tasks'); }}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl h-[85vh] flex overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200" onClick={e => e.stopPropagation()}>
            
            {/* Lateral Esquerda: Info do Cliente */}
            <div className="w-[300px] bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 hidden md:flex">
              <div className="p-6 flex flex-col items-center text-center border-b border-slate-200">
                {activeTicket.contact?.profilePictureUrl ? (
                  <img src={activeTicket.contact.profilePictureUrl} referrerPolicy="no-referrer" className="w-20 h-20 rounded-full object-cover shadow-sm border border-slate-200 mb-3" alt="Perfil" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-xl text-slate-400 shadow-sm mb-3">
                    {(activeTicket.contact?.name || '?').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <h3 className="font-semibold text-lg text-slate-900 break-all">{activeTicket.contact?.name || 'Sem nome'}</h3>
                <span className="text-slate-500 font-mono text-xs mt-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {activeTicket.contactNumber}
                </span>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-5">
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 block">E-mail</label>
                    <p className="text-sm text-slate-800 break-all">{activeTicket.contact?.email || '--'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 block">CPF / CNPJ</label>
                    <p className="text-sm text-slate-800 font-mono break-all">{activeTicket.contact?.cnpj || '--'}</p>
                  </div>
                </div>

                {(activeTicket.marca || activeTicket.modelo || activeTicket.customerType) && (
                  <div className="pt-4 border-t border-slate-200 flex flex-col gap-4">
                    {activeTicket.customerType && (
                      <div><label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 block">Tipo de Cliente</label><p className="text-sm text-slate-800">{activeTicket.customerType}</p></div>
                    )}
                    {activeTicket.marca && (
                      <div><label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 block">Marca</label><p className="text-sm text-slate-800">{activeTicket.marca}</p></div>
                    )}
                    {activeTicket.modelo && (
                      <div><label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 block">Modelo</label><p className="text-sm text-slate-800">{activeTicket.modelo}</p></div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-200 bg-white">
                 <button 
                   onClick={() => setIsCloseModalOpen(true)} 
                   className="w-full flex items-center justify-center gap-2 text-slate-50 bg-slate-900 hover:bg-slate-800 py-2.5 rounded-md text-sm font-medium transition-colors"
                 >
                    Encerrar Solicitação
                 </button>
              </div>
            </div>

            {/* Painel Principal (Abas da OS) */}
            <div className="flex-1 flex flex-col bg-white w-full overflow-hidden">
              
              <div className="px-6 border-b border-slate-200 flex justify-between items-end shrink-0 pt-4">
                <div className="flex gap-6">
                  {/* NOVA ABA DE TAREFAS */}
                  <button 
                    onClick={() => setActiveTab('tasks')} 
                    className={`pb-3 font-medium text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'tasks' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                  >
                    Lembretes
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'tasks' ? 'bg-slate-100 text-slate-900' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                      {activeTicket.tasks?.filter(t => !t.isCompleted).length || 0}
                    </span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('notes')} 
                    className={`pb-3 font-medium text-sm transition-all border-b-2 ${activeTab === 'notes' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                  >
                    Notas Internas
                  </button>
                  <button 
                    onClick={() => setActiveTab('files')} 
                    className={`pb-3 font-medium text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'files' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                  >
                    Anexos
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'files' ? 'bg-slate-100 text-slate-900' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>{(activeTicket.files || []).length}</span>
                  </button>
                </div>
                <button onClick={() => { setActiveTicket(null); setActiveTab('tasks'); }} className="mb-2 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
              </div>

              {/* CONTEÚDO DA ABA TAREFAS */}
              {activeTab === 'tasks' ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
                  <div className="flex-1 p-6 overflow-y-auto">
                    {(activeTicket.tasks || []).length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                         <Calendar className="w-10 h-10 mb-2 opacity-50" />
                         <p className="text-sm font-medium">Sem agendamentos para esta OS.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {(activeTicket.tasks || []).map(task => {
                           const isOverdue = new Date(task.dueDate) < new Date() && !task.isCompleted;
                           return (
                             <div key={task.id} className={`bg-white p-4 rounded-lg border shadow-sm group flex items-start gap-4 transition-all ${task.isCompleted ? 'border-slate-200 opacity-60' : isOverdue ? 'border-red-200' : 'border-slate-200 hover:border-blue-300'}`}>
                               <button onClick={() => handleToggleTask(task.id, task.isCompleted)} className={`mt-0.5 shrink-0 ${task.isCompleted ? 'text-green-500' : 'text-slate-300 hover:text-blue-500'}`}>
                                 {task.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                               </button>
                               <div className="flex-1 min-w-0">
                                 <h4 className={`text-sm font-medium ${task.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{task.title}</h4>
                                 <div className="flex items-center gap-2 mt-1">
                                   <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`} />
                                   <span className={`text-[11px] font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                                     {new Date(task.dueDate).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                     {isOverdue ? ' (Atrasado)' : ''}
                                   </span>
                                 </div>
                               </div>
                               <button onClick={() => handleDeleteTask(task.id)} className="text-slate-400 hover:text-red-500 p-2 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </div>
                           );
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input 
                        type="text" 
                        placeholder="O que precisa ser feito? (Ex: Ligar ao cliente)" 
                        className="flex-1 h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                        value={newTaskTitle} 
                        onChange={e => setNewTaskTitle(e.target.value)} 
                      />
                      <input 
                        type="datetime-local" 
                        className="sm:w-[200px] h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                        value={newTaskDate} 
                        onChange={e => setNewTaskDate(e.target.value)} 
                      />
                      <button onClick={handleAddTask} disabled={!newTaskTitle.trim() || !newTaskDate} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-10 px-6 disabled:opacity-50">
                        Agendar
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'notes' ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <div className="flex-1 p-6 overflow-y-auto">
                    {(activeTicket.notes || []).length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                         <p className="text-sm font-medium">Nenhuma nota adicionada.</p>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-4">
                      {(activeTicket.notes || []).map(note => (
                        <div key={note.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm group w-[90%] flex flex-col relative">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[11px] font-medium text-slate-500">{new Date(note.createdAt).toLocaleString('pt-PT')}</span>
                            <button onClick={() => handleDeleteNote(note.id)} className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                          </div>
                          <p className="text-slate-700 text-sm whitespace-pre-wrap break-all">{note.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
                    <div className="flex flex-col gap-2">
                      <textarea 
                        className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" 
                        placeholder="Escreva uma nota..." 
                        value={newNoteText} 
                        onChange={e => setNewNoteText(e.target.value)} 
                      />
                      <div className="flex justify-end">
                        <button onClick={handleAddNote} disabled={!newNoteText.trim()} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-9 px-4 py-2 disabled:opacity-50">
                          Adicionar Nota
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-slate-50/50">
                  
                  {pendingFile ? (
                    <div className="bg-white border border-blue-200 shadow-sm rounded-lg p-5 flex flex-col gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-medium text-slate-800 text-sm truncate">{pendingFile.name}</h4>
                          <span className="text-[11px] text-slate-500">{formatSize(pendingFile.size)}</span>
                        </div>
                      </div>
                      
                      <input 
                        type="text" 
                        placeholder="Legenda (Opcional)" 
                        className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        value={fileDescription}
                        onChange={e => setFileDescription(e.target.value)}
                        autoFocus
                      />
                      
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setPendingFile(null); setFileDescription(''); if(fileInputRef.current) fileInputRef.current.value=''; }} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 h-9 px-4 border border-slate-200">Cancelar</button>
                        <button onClick={confirmUploadFile} disabled={isUploadingFile} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-9 px-4">
                          {isUploadingFile ? 'Enviando...' : 'Upload'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => fileInputRef.current?.click()} className="w-full bg-white border border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors mb-6">
                      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                      <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" /></svg>
                      </div>
                      <span className="font-medium text-slate-700 text-sm">Anexar Ficheiro</span>
                    </div>
                  )}

                  {(activeTicket.files || []).length === 0 && !pendingFile ? (
                     <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                       <p className="text-sm font-medium">Sem anexos.</p>
                     </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {(activeTicket.files || []).map(file => (
                        <div key={file.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-3 group relative shadow-sm">
                          <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 border border-slate-100 ${file.mimeType.includes('image') ? 'bg-blue-50 text-blue-600' : file.mimeType.includes('pdf') ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                             {file.mimeType.includes('image') ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>}
                          </div>
                          <div className="flex-1 min-w-0 pr-6">
                            <h4 className="font-medium text-xs text-slate-800 truncate">{file.fileName}</h4>
                            <div className="text-[11px] text-slate-500 mt-0.5 mb-1">{formatSize(file.size)}</div>
                            {file.description && <p className="text-xs text-slate-600 line-clamp-2">{file.description}</p>}
                          </div>
                          <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg></a>
                             <button onClick={() => handleDeleteFile(file.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= NOVO MODAL DE ENCERRAMENTO DE OS ================= */}
      {isCloseModalOpen && activeTicket && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsCloseModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex flex-col space-y-1.5">
              <h3 className="font-semibold leading-none tracking-tight text-lg">Encerrar Solicitação</h3>
              <p className="text-sm text-slate-500">A OS será removida do Kanban e guardada no histórico.</p>
            </div>
            
            <div className="p-6 flex flex-col gap-5">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-900">Qual foi o desfecho deste atendimento?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setCloseResolution('SUCCESS')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${closeResolution === 'SUCCESS' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 hover:border-green-200 hover:bg-slate-50 text-slate-500'}`}
                  >
                    <span className="text-sm font-medium">Resolvido (Ganho)</span>
                  </button>
                  <button 
                    onClick={() => setCloseResolution('CANCELLED')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${closeResolution === 'CANCELLED' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 hover:border-red-200 hover:bg-slate-50 text-slate-500'}`}
                  >
                    <span className="text-sm font-medium">Cancelado (Perdido)</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Motivo / Observações Finais</label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" 
                  placeholder={closeResolution === 'SUCCESS' ? 'Ex: Equipamento reparado e entregue...' : 'Ex: Cliente não aprovou o orçamento...'}
                  value={closeReason}
                  onChange={e => setCloseReason(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 p-6 pt-0 bg-slate-50 border-t border-slate-100 mt-2">
              <button onClick={() => setIsCloseModalOpen(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 border border-slate-200 bg-white h-10 px-4 py-2">
                Cancelar
              </button>
              <button 
                onClick={() => handleToggleArchive(activeTicket.id, true, closeResolution, closeReason)} 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-10 px-4 py-2 shadow-sm"
              >
                Confirmar Encerramento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL GESTOR DE FASES ================= */}
      {isStageManagerOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsStageManagerOpen(false)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100">
              <h3 className="font-semibold leading-none tracking-tight text-lg">Fases do Funil</h3>
              <p className="text-sm text-slate-500">Adicione, ordene ou remova as colunas do Kanban.</p>
            </div>
            
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="text" placeholder="Nova Fase (Ex: Em Análise)" className="flex-1 flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={newStageName} onChange={e => setNewStageName(e.target.value)} />
                <div className="flex items-center gap-1.5 bg-white px-3 border border-slate-200 rounded-md">
                  {PREDEFINED_COLORS.map(c => (
                    <button key={c} onClick={() => setNewStageColor(c)} className={`w-5 h-5 rounded-full transition-all ${newStageColor === c ? 'ring-2 ring-offset-1 ring-slate-400' : 'opacity-70 hover:opacity-100'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
                <button onClick={handleCreateStage} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-10 px-4">Adicionar</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2 bg-white">
              {allStages.map((stage, index) => (
                <div key={stage.id} className={`flex items-center justify-between p-3 rounded-md border ${stage.isActive ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => handleReorder(index, 'up')} disabled={index===0} className="text-slate-400 hover:text-slate-800 disabled:opacity-30"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M14.77 12.79a.75.75 0 0 1-1.06-.02L10 8.832 6.29 12.77a.75.75 0 1 1-1.08-1.04l4.25-4.5a.75.75 0 0 1 1.08 0l4.25 4.5a.75.75 0 0 1-.02 1.06Z" clipRule="evenodd" /></svg></button>
                      <button onClick={() => handleReorder(index, 'down')} disabled={index===allStages.length-1} className="text-slate-400 hover:text-slate-800 disabled:opacity-30"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" /></svg></button>
                    </div>
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: stage.color }}></div>
                    <span className="font-medium text-slate-800 text-sm">{stage.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggleStageActive(stage.id, stage.isActive)} className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded">
                      {stage.isActive ? 'Desativar' : 'Ativar'}
                    </button>
                    <button onClick={() => handleDeleteStage(stage.id)} className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
               <button onClick={() => setIsStageManagerOpen(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 h-9 px-4">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL HISTÓRICO (ARQUIVADOS) ================= */}
      {isArchivedModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsArchivedModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
               <div className="flex flex-col space-y-1.5">
                  <h3 className="font-semibold leading-none tracking-tight text-lg">Histórico de Solicitações</h3>
                  <p className="text-sm text-slate-500">Registo de OS encerradas (Ganhas ou Canceladas).</p>
               </div>
               <button onClick={() => setIsArchivedModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
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
                        {t.customerType && `[${t.customerType}] `} {t.marca} {t.modelo}
                      </p>

                      {t.resolutionReason && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-xs text-slate-600 line-clamp-2" title={t.resolutionReason}>
                            <span className="font-semibold text-slate-700">Motivo: </span>{t.resolutionReason}
                          </p>
                        </div>
                      )}
                      
                      <button onClick={() => handleToggleArchive(t.id, false)} className="mt-4 flex items-center justify-center gap-2 w-full bg-slate-100 text-slate-700 py-2 rounded-md text-xs font-medium hover:bg-slate-200 transition-colors">
                        Restaurar para Funil
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO GERAL */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setConfirmModal(null)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{confirmModal.title}</h3>
              <p className="text-sm text-slate-500">{confirmModal.message}</p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button onClick={() => setConfirmModal(null)} className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 h-10 px-4">Cancelar</button>
              <button onClick={confirmModal.onConfirm} className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700 h-10 px-4">Confirmar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}