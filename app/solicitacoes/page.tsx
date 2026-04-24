'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';

interface Contact { 
  number: string; 
  name: string; 
  profilePictureUrl?: string; 
  email?: string; 
  cnpj?: string; 
}

interface Note { 
  id: string; 
  text: string; 
  createdAt: string; 
}

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
  createdAt: string; 
  updatedAt: string;
  notes?: Note[]; 
  files?: TicketFile[];
  isArchived: boolean; 
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
  
  const [activeTab, setActiveTab] = useState<'notes' | 'files'>('notes');

  const [selectedContactNumber, setSelectedContactNumber] = useState('');
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [newNoteText, setNewNoteText] = useState('');

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isStageManagerOpen, setIsStageManagerOpen] = useState(false);
  const [allStages, setAllStages] = useState<Stage[]>([]);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState(PREDEFINED_COLORS[0]);

  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);
  const [archivedTickets, setArchivedTickets] = useState<Ticket[]>([]);

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  const fetchData = async () => {
    try {
      const [boardRes, contactsRes] = await Promise.all([
        fetch(`${baseUrl}/tickets/board`),
        fetch(`${baseUrl}/whatsapp/contacts`)
      ]);
      if (boardRes.ok) setStages(await boardRes.json());
      if (contactsRes.ok) setContacts(await contactsRes.json());
      
      if (activeTicket) {
        const board = await boardRes.json();
        let foundTicket = null;
        for (const stage of board) {
          const found = stage.tickets.find((t: Ticket) => t.id === activeTicket.id);
          if (found) { foundTicket = found; break; }
        }
        if (foundTicket) setActiveTicket(foundTicket);
      }
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
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
      fetchData(); 
    }
  };

  const handleCreateTicket = async () => {
    if (!selectedContactNumber || stages.length === 0) return alert("Selecione um cliente e garanta que existe uma fase ativa no funil.");
    const body = { contactNumber: selectedContactNumber, nome: formNome, email: formEmail, cpf: formCpf, marca: formMarca, modelo: formModelo, stageId: stages[0].id };
    try {
      const res = await fetch(`${baseUrl}/tickets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { setIsNewTicketModalOpen(false); setFormMarca(''); setFormModelo(''); setSelectedContactNumber(''); fetchData(); }
    } catch (err) { console.error(err); }
  };

  const handleAddNote = async () => {
    if (!newNoteText.trim() || !activeTicket) return;
    try {
      const res = await fetch(`${baseUrl}/tickets/${activeTicket.id}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: newNoteText }) });
      if (res.ok) { setNewNoteText(''); fetchData(); }
    } catch (err) {}
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Tem a certeza que deseja apagar esta nota?")) return;
    try {
      const res = await fetch(`${baseUrl}/tickets/notes/${noteId}`, { method: 'DELETE' });
      if (res.ok) { fetchData(); }
    } catch (err) { console.error(err); }
  };

  const handleToggleArchive = async (ticketId: string, archive: boolean) => {
    try {
      await fetch(`${baseUrl}/tickets/${ticketId}/archive`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isArchived: archive }) });
      setActiveTicket(null); 
      fetchData();
      if (!archive) openArchivedModal(); 
    } catch (err) {}
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { alert("Arquivo muito grande (máx 15MB)."); return; }
    setPendingFile(file);
    setFileDescription('');
  };

  const confirmUploadFile = async () => {
    if (!pendingFile || !activeTicket) return;
    setIsUploadingFile(true);
    const formData = new FormData();
    formData.append('file', pendingFile);
    if (fileDescription.trim()) formData.append('description', fileDescription.trim());

    try {
      const res = await fetch(`${baseUrl}/tickets/${activeTicket.id}/files`, { method: 'POST', body: formData });
      if (res.ok) {
        setPendingFile(null); setFileDescription(''); fetchData();
      } else { alert("Erro ao enviar ficheiro."); }
    } catch (error) { alert("Erro de conexão."); } 
    finally { setIsUploadingFile(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Tem a certeza que deseja apagar este ficheiro?")) return;
    try {
      const res = await fetch(`${baseUrl}/tickets/files/${fileId}`, { method: 'DELETE' });
      if (res.ok) { fetchData(); }
    } catch (error) { console.error(error); }
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
      if (res.ok) { setNewStageName(''); setNewStageColor(PREDEFINED_COLORS[0]); openStageManager(); fetchData(); }
    } catch (err) {}
  };

  const handleToggleStageActive = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`${baseUrl}/tickets/stages/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !currentStatus }) });
      openStageManager(); fetchData();
    } catch (err) {}
  };

  const handleDeleteStage = async (id: string) => {
    if (!confirm("⚠️ Tem a certeza que deseja apagar esta fase permanentemente?")) return;
    try {
      const res = await fetch(`${baseUrl}/tickets/stages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        openStageManager(); fetchData();
      } else {
        const data = await res.json();
        alert(data.message || "Erro ao apagar fase.");
      }
    } catch (err) { console.error(err); }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const newStages = [...allStages];
    if (direction === 'up' && index > 0) {
      [newStages[index - 1], newStages[index]] = [newStages[index], newStages[index - 1]];
    } else if (direction === 'down' && index < newStages.length - 1) {
      [newStages[index + 1], newStages[index]] = [newStages[index], newStages[index + 1]];
    } else return;

    const payload = newStages.map((s, i) => ({ id: s.id, order: i + 1 }));
    setAllStages(newStages); 

    try {
      await fetch(`${baseUrl}/tickets/stages/reorder`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stages: payload }) });
      fetchData();
    } catch (err) {}
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
        t.modelo?.toLowerCase().includes(lowerSearch)
      );
    })
  }));

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f6] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden">
        
        {/* CABEÇALHO INTEGRADO (SEM FUNDO BRANCO / SEM SER FIXO) */}
        <header className="px-6 md:px-10 pt-8 md:pt-10 pb-4 flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125-1.125-1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gestão de Atendimento</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Painel Kanban</h1>
            <p className="text-slate-500 mt-1 font-medium">Acompanhe e gira as Ordens de Serviço (OS) ao longo do funil.</p>
          </div>
          
          {/* BARRA DE BOTÕES HORIZONTAL */}
          <div className="flex flex-row items-center gap-3 overflow-x-auto no-scrollbar pb-2 xl:pb-0 w-full xl:w-auto">
            {/* Barra de Pesquisa */}
            <div className="bg-white border border-slate-200/80 rounded-2xl flex items-center px-4 h-11 min-w-[220px] shadow-sm focus-within:border-[#1FA84A] focus-within:ring-4 focus-within:ring-[#1FA84A]/10 transition-all shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-400 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
              <input 
                type="text" 
                placeholder="Pesquisar tickets..." 
                className="bg-transparent border-none outline-none w-full pl-3 text-sm font-medium text-slate-700 placeholder:text-slate-400"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Botões de Ação (Sempre um ao lado do outro) */}
            <button onClick={openArchivedModal} className="h-11 px-5 bg-white border border-slate-200/80 text-slate-600 font-bold rounded-2xl hover:border-slate-300 hover:text-slate-800 transition-colors text-sm flex items-center gap-2 shadow-sm shrink-0 whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
              Arquivados
            </button>
            <button onClick={openStageManager} className="h-11 px-5 bg-white border border-slate-200/80 text-slate-600 font-bold rounded-2xl hover:border-slate-300 hover:text-slate-800 transition-colors text-sm flex items-center gap-2 shadow-sm shrink-0 whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg>
              Fases
            </button>
            <button onClick={() => setIsNewTicketModalOpen(true)} className="h-11 px-6 bg-[#1FA84A] text-white font-bold rounded-2xl hover:bg-green-600 hover:shadow-lg transition-all shadow-md flex items-center gap-2 text-sm shrink-0 whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Nova OS
            </button>
          </div>
        </header>

        {/* ================= QUADRO KANBAN ================= */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 md:px-10">
          <div className="flex h-full gap-6 items-start w-max pb-4 animate-in fade-in duration-700">
            {isLoading ? (
              <div className="w-[calc(100vw-300px)] flex justify-center items-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-[#1FA84A] border-t-transparent rounded-full animate-spin shadow-sm"></div>
                  <span className="text-slate-500 font-bold text-sm">A carregar funil...</span>
                </div>
              </div>
            ) : filteredStages.length === 0 ? (
              <div className="w-[calc(100vw-300px)] flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>
                </div>
                <h4 className="font-bold text-slate-700 text-lg">Funil Vazio</h4>
                <p className="text-sm text-slate-500 mt-1">Configure as suas fases de atendimento para começar.</p>
              </div>
            ) : (
              filteredStages.map((stage) => (
                <div 
                  key={stage.id} 
                  className="w-[340px] bg-slate-200/50 rounded-2xl flex flex-col max-h-full border border-slate-200/80 shadow-sm overflow-hidden"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <div className="h-1.5 w-full" style={{ backgroundColor: stage.color }}></div>
                  
                  <div className="px-5 py-4 flex justify-between items-center shrink-0 bg-white/60 backdrop-blur-sm border-b border-slate-200/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }}></div>
                      <h3 className="font-extrabold text-slate-800 uppercase tracking-wide text-sm">{stage.name}</h3>
                    </div>
                    <span className="bg-white text-slate-600 text-xs font-bold px-2.5 py-0.5 rounded-md border border-slate-200/60 shadow-sm">
                      {stage.tickets.length}
                    </span>
                  </div>
                  
                  <div className="p-4 flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-4 no-scrollbar">
                    {stage.tickets.length === 0 && searchTerm ? (
                      <p className="text-xs text-slate-400 text-center mt-4 font-medium">Nenhum resultado nesta fase.</p>
                    ) : (
                      stage.tickets.map((ticket) => (
                        <div 
                          key={ticket.id} 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, ticket.id, stage.id)} 
                          onClick={() => {setActiveTicket(ticket); setActiveTab('notes');}}
                          className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-[#1FA84A] hover:shadow-md transition-all w-full overflow-hidden group"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-extrabold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded font-mono tracking-wider">OS-{ticket.id.split('-')[0].toUpperCase()}</span>
                            <div className="flex gap-2">
                              {(ticket.files || []).length > 0 && (
                                <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z" clipRule="evenodd" /></svg>
                                  {ticket.files!.length}
                                </span>
                              )}
                              {(ticket.notes || []).length > 0 && (
                                <span className="text-[10px] text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 001.28.53l3.58-3.579a22.54 22.54 0 004.14-.46 3.25 3.25 0 002.43-2.903V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zm0 7a1 1 0 100-2 1 1 0 000 2zM8 8a1 1 0 11-2 0 1 1 0 012 0zm5 1a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                                  {ticket.notes!.length}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                               {ticket.contact?.profilePictureUrl ? (
                                  <img src={ticket.contact.profilePictureUrl} className="w-full h-full rounded-full object-cover" alt="" />
                               ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-400"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                               )}
                            </div>
                            <h4 className="font-extrabold text-slate-800 text-sm break-all group-hover:text-[#1FA84A] transition-colors">{ticket.contact?.name || ticket.contactNumber}</h4>
                          </div>

                          {(ticket.marca || ticket.modelo) && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {ticket.marca && <span className="bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded break-all uppercase tracking-wide">{ticket.marca}</span>}
                              {ticket.modelo && <span className="bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded break-all uppercase tracking-wide">{ticket.modelo}</span>}
                            </div>
                          )}
                        </div>
                      ))
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-b from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e8f6ea] text-[#1FA84A] rounded-xl flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </div>
                <h3 className="font-extrabold text-xl text-slate-800">Nova Solicitação (OS)</h3>
              </div>
              <button onClick={() => setIsNewTicketModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-8 flex flex-col gap-5 bg-white">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Cliente / Contato</label>
                <div className="relative">
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 outline-none focus:bg-white focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all appearance-none cursor-pointer" 
                    value={selectedContactNumber} 
                    onChange={(e) => setSelectedContactNumber(e.target.value)}
                  >
                    <option value="">-- Selecione o cliente na base --</option>
                    {contacts.map(c => <option key={c.number} value={c.number}>{c.name || 'Sem nome'} ({c.number})</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
              
              {selectedContactNumber && (
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detalhes do Registo</h4>
                  <input type="text" placeholder="Nome Completo" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#1FA84A] shadow-sm transition-colors" value={formNome} onChange={e => setFormNome(e.target.value)} />
                  <input type="email" placeholder="Endereço de E-mail" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#1FA84A] shadow-sm transition-colors" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                  <input type="text" placeholder="CPF / CNPJ" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-mono outline-none focus:border-[#1FA84A] shadow-sm transition-colors" value={formCpf} onChange={e => setFormCpf(e.target.value)} />
                </div>
              )}
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Marca</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:bg-white focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all" value={formMarca} onChange={e => setFormMarca(e.target.value)} placeholder="Ex: Apple" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Modelo</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:bg-white focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all" value={formModelo} onChange={e => setFormModelo(e.target.value)} placeholder="Ex: iPhone 13" />
                </div>
              </div>
            </div>
            
            <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button onClick={() => setIsNewTicketModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200/50 transition-colors text-sm">Cancelar</button>
              <button onClick={handleCreateTicket} className="bg-[#1FA84A] text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:bg-green-600 transition-all text-sm">Criar Solicitação</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DA OS (DETALHES) ================= */}
      {activeTicket && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 md:p-6 lg:p-10 animate-in fade-in duration-200" onClick={() => { setActiveTicket(null); setActiveTab('notes'); }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
            
            {/* Lateral Esquerda: Info do Cliente */}
            <div className="w-[320px] bg-slate-50/80 border-r border-slate-200 flex flex-col shrink-0 hidden md:flex relative">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-200/50 to-transparent"></div>
              
              <div className="p-8 pt-10 flex flex-col items-center text-center relative z-10 border-b border-slate-200/80">
                {activeTicket.contact?.profilePictureUrl ? (
                  <img src={activeTicket.contact.profilePictureUrl} className="w-24 h-24 rounded-full object-cover shadow-md border-4 border-white mb-4" alt="Perfil" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-slate-100 flex items-center justify-center font-black text-3xl text-slate-400 shadow-md mb-4">
                    {(activeTicket.contact?.name || '?').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <h3 className="font-extrabold text-xl text-slate-800 break-all leading-tight">{activeTicket.contact?.name || 'Sem nome'}</h3>
                <span className="bg-white border border-slate-200 text-slate-600 font-mono text-[11px] font-bold px-3 py-1 rounded-full mt-3 shadow-sm">
                  {activeTicket.contactNumber}
                </span>
              </div>
              
              <div className="p-8 flex-1 overflow-y-auto flex flex-col gap-6">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" /><path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" /></svg> E-mail</label>
                    <p className="text-sm font-semibold text-slate-700 break-all">{activeTicket.contact?.email || 'Não informado'}</p>
                  </div>
                  <div className="w-full h-px bg-slate-100"></div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M2.5 3A1.5 1.5 0 001 4.5v4A1.5 1.5 0 002.5 10h15A1.5 1.5 0 0019 8.5v-4A1.5 1.5 0 0017.5 3h-15zm4 3.5a1 1 0 100-2 1 1 0 000 2zm7 0a1 1 0 100-2 1 1 0 000 2zM4 11.5a1 1 0 00-1 1v4a1 1 0 001 1h12a1 1 0 001-1v-4a1 1 0 00-1-1H4z" clipRule="evenodd" /></svg> CPF / CNPJ</label>
                    <p className="text-sm font-semibold text-slate-700 font-mono break-all">{activeTicket.contact?.cnpj || 'Não informado'}</p>
                  </div>
                </div>

                {(activeTicket.marca || activeTicket.modelo) && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Informações do Aparelho</label>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                      {activeTicket.marca && (
                        <div><span className="text-[10px] text-slate-400 uppercase">Marca</span><p className="font-bold text-slate-700 text-sm">{activeTicket.marca}</p></div>
                      )}
                      {activeTicket.modelo && (
                        <div><span className="text-[10px] text-slate-400 uppercase">Modelo</span><p className="font-bold text-slate-700 text-sm">{activeTicket.modelo}</p></div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-white border-t border-slate-200/80">
                 <button onClick={() => handleToggleArchive(activeTicket.id, true)} className="w-full flex items-center justify-center gap-2 text-amber-700 bg-amber-50 border border-amber-100 hover:bg-amber-500 hover:text-white py-3 rounded-xl text-sm font-bold transition-all shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
                    Arquivar OS
                 </button>
              </div>
            </div>

            {/* Painel Principal (Abas da OS) */}
            <div className="flex-1 flex flex-col bg-white w-full overflow-hidden">
              
              <div className="px-8 border-b border-slate-200 flex justify-between items-end shrink-0 bg-white pt-6">
                <div className="flex gap-8">
                  <button 
                    onClick={() => setActiveTab('notes')} 
                    className={`pb-4 font-bold border-b-[3px] text-sm transition-all ${activeTab === 'notes' ? 'border-[#1FA84A] text-[#1FA84A]' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
                  >
                    Notas Internas
                  </button>
                  <button 
                    onClick={() => setActiveTab('files')} 
                    className={`pb-4 font-bold border-b-[3px] text-sm transition-all flex items-center gap-2 ${activeTab === 'files' ? 'border-[#1FA84A] text-[#1FA84A]' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
                  >
                    Anexos & Documentos
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'files' ? 'bg-[#e8f6ea] text-[#1FA84A]' : 'bg-slate-100 text-slate-500'}`}>{(activeTicket.files || []).length}</span>
                  </button>
                </div>
                <button onClick={() => { setActiveTicket(null); setActiveTab('notes'); }} className="mb-3 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
              </div>

              {activeTab === 'notes' ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8f9fa]">
                  <div className="flex-1 p-8 overflow-y-auto">
                    {(activeTicket.notes || []).length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
                         <p className="font-bold text-lg">Sem notas internas.</p>
                         <p className="text-sm mt-1">Utilize este espaço para registar informações sobre o atendimento.</p>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-6">
                      {(activeTicket.notes || []).map(note => (
                        <div key={note.id} className="bg-white p-5 rounded-2xl rounded-tl-sm border border-slate-200 shadow-sm group w-[85%] flex flex-col relative">
                          <div className="flex justify-between items-center mb-3 border-b border-slate-50 pb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clipRule="evenodd" /></svg></div>
                              <span className="text-xs font-bold text-slate-500">{new Date(note.createdAt).toLocaleString('pt-PT')}</span>
                            </div>
                            <button onClick={() => handleDeleteNote(note.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
                          </div>
                          <p className="text-slate-700 text-[15px] whitespace-pre-wrap break-all leading-relaxed">{note.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-6 bg-white border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] shrink-0">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-[#1FA84A] focus-within:ring-4 focus-within:ring-[#1FA84A]/10 transition-all overflow-hidden flex flex-col">
                      <textarea 
                        className="w-full bg-transparent p-4 text-sm outline-none resize-none h-[100px] text-slate-700 placeholder:text-slate-400" 
                        placeholder="Escreva uma nova nota sobre este atendimento..." 
                        value={newNoteText} 
                        onChange={e => setNewNoteText(e.target.value)} 
                      />
                      <div className="p-3 bg-white border-t border-slate-100 flex justify-end">
                        <button 
                          onClick={handleAddNote} 
                          disabled={!newNoteText.trim()} 
                          className="bg-[#1FA84A] text-white px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-green-600 transition-colors shadow-sm flex items-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.925A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.896 28.896 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.289Z" /></svg>
                          Adicionar Nota
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col bg-[#f8f9fa] p-8 overflow-y-auto">
                  
                  {/* UPLOAD DE ARQUIVOS DENTRO DA OS (Design Igual a ArquivosPage) */}
                  {pendingFile ? (
                    <div className="bg-white border border-[#1FA84A]/30 shadow-md rounded-2xl p-6 flex flex-col lg:flex-row gap-6 items-center mb-8 animate-in fade-in">
                      <div className="flex-1 flex items-center gap-4 w-full">
                        <div className="w-14 h-14 bg-[#e8f6ea] text-[#1FA84A] rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                        </div>
                        <div className="overflow-hidden flex-1">
                          <h4 className="font-extrabold text-slate-800 text-base truncate">{pendingFile.name}</h4>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">{formatSize(pendingFile.size)}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 w-full">
                        <input 
                          type="text" 
                          placeholder="Adicionar legenda descritiva (Opcional)" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-[#1FA84A]/10 focus:border-[#1FA84A] transition-all"
                          value={fileDescription}
                          onChange={e => setFileDescription(e.target.value)}
                          autoFocus
                        />
                      </div>
                      
                      <div className="flex gap-3 w-full lg:w-auto">
                        <button onClick={() => { setPendingFile(null); setFileDescription(''); if(fileInputRef.current) fileInputRef.current.value=''; }} className="flex-1 lg:flex-none px-5 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm">Cancelar</button>
                        <button onClick={confirmUploadFile} disabled={isUploadingFile} className="flex-1 lg:flex-none bg-[#1FA84A] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-green-600 shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                          {isUploadingFile ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" /></svg>
                          )}
                          {isUploadingFile ? 'A Enviar...' : 'Fazer Upload'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()} 
                      className="w-full bg-white border-2 border-dashed border-slate-300 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#1FA84A]/50 hover:bg-[#e8f6ea]/30 transition-all mb-8 group"
                    >
                      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                      <div className="w-14 h-14 bg-slate-50 shadow-sm text-slate-400 rounded-full flex items-center justify-center mb-3 group-hover:-translate-y-1 group-hover:text-[#1FA84A] group-hover:bg-white group-hover:shadow-md transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" /></svg>
                      </div>
                      <span className="font-extrabold text-slate-700 text-base group-hover:text-[#1FA84A] transition-colors">Anexar Novo Ficheiro</span>
                      <span className="text-slate-400 text-xs mt-1">Imagens, PDFs ou Documentos Técnicos</span>
                    </div>
                  )}

                  {/* LISTA DE ARQUIVOS */}
                  {(activeTicket.files || []).length === 0 && !pendingFile ? (
                     <div className="flex flex-col items-center justify-center py-10 opacity-70">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-20 h-20 text-slate-300 mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                       <p className="text-slate-500 font-bold">Sem anexos ainda.</p>
                     </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                      {(activeTicket.files || []).map(file => (
                        <div key={file.id} className="bg-white border border-slate-200/80 rounded-2xl flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all group overflow-hidden">
                          
                          <div className="p-5 flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner border border-white/50 ${file.mimeType.includes('image') ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-500' : file.mimeType.includes('pdf') ? 'bg-gradient-to-br from-red-100 to-red-50 text-red-500' : 'bg-gradient-to-br from-slate-200 to-slate-100 text-slate-600'}`}>
                               {file.mimeType.includes('image') ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" /></svg>
                                : file.mimeType.includes('pdf') ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" /><path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" /></svg>
                                : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M19.5 21a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-5.379a.75.75 0 0 1-.53-.22L11.47 3.66A2.25 2.25 0 0 0 9.879 3H4.5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h15Z" clipRule="evenodd" /></svg>}
                            </div>
                            <div className="flex-1 min-w-0 pr-8">
                              <h4 className="font-bold text-xs text-slate-800 truncate" title={file.fileName}>{file.fileName}</h4>
                              <div className="flex items-center gap-2 mt-0.5 mb-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{file.mimeType.split('/')[1] || 'DOC'}</span>
                                <span className="text-[10px] text-slate-400">•</span>
                                <span className="text-[10px] text-slate-400 font-mono">{formatSize(file.size)}</span>
                              </div>
                              {file.description && (
                                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 leading-snug line-clamp-3" title={file.description}>
                                  {file.description}
                                </p>
                              )}
                            </div>
                            
                            {/* Ações (Abrir / Deletar) */}
                            <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-1">
                               <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg></a>
                               <button onClick={() => handleDeleteFile(file.id)} className="w-7 h-7 rounded bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
                            </div>
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

      {/* ================= MODAL GESTOR DE FASES ================= */}
      {isStageManagerOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsStageManagerOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-slate-800">Fases do Funil</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Gestão do Kanban</p>
                </div>
              </div>
              <button onClick={() => setIsStageManagerOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-8 border-b border-slate-100 shrink-0 bg-white">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Adicionar Nova Fase</h4>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="flex-1 w-full">
                  <input type="text" placeholder="Nome da Fase (Ex: Em Análise)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:bg-white focus:border-[#1FA84A] focus:ring-4 focus:ring-[#1FA84A]/10 transition-all font-medium text-slate-700" value={newStageName} onChange={e => setNewStageName(e.target.value)} />
                </div>
                <div className="flex gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shrink-0">
                  {PREDEFINED_COLORS.map(c => (
                    <button key={c} onClick={() => setNewStageColor(c)} className={`w-8 h-8 rounded-full border-2 transition-transform ${newStageColor === c ? 'border-white ring-2 ring-slate-400 scale-110 shadow-sm' : 'border-transparent hover:scale-110'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
                <button onClick={handleCreateStage} className="bg-[#1FA84A] text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-green-600 transition-colors shadow-md hover:shadow-lg shrink-0 w-full sm:w-auto">Adicionar</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-3 bg-slate-50/50">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ordem e Exclusão</h4>
              {allStages.map((stage, index) => (
                <div key={stage.id} className={`flex items-center justify-between p-4 rounded-2xl border bg-white shadow-sm transition-opacity ${stage.isActive ? 'border-slate-200' : 'border-red-100 bg-red-50/50 opacity-60'}`}>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1 bg-slate-50 rounded-lg p-1 border border-slate-100">
                      <button onClick={() => handleReorder(index, 'up')} disabled={index===0} className="text-slate-400 hover:text-slate-800 disabled:opacity-20 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M14.77 12.79a.75.75 0 0 1-1.06-.02L10 8.832 6.29 12.77a.75.75 0 1 1-1.08-1.04l4.25-4.5a.75.75 0 0 1 1.08 0l4.25 4.5a.75.75 0 0 1-.02 1.06Z" clipRule="evenodd" /></svg></button>
                      <button onClick={() => handleReorder(index, 'down')} disabled={index===allStages.length-1} className="text-slate-400 hover:text-slate-800 disabled:opacity-20 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" /></svg></button>
                    </div>
                    <div className="w-5 h-5 rounded-md shadow-sm border border-black/5" style={{ backgroundColor: stage.color }}></div>
                    <span className="font-extrabold text-slate-800 text-sm tracking-wide">{stage.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleToggleStageActive(stage.id, stage.isActive)} 
                      className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${stage.isActive ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                      {stage.isActive ? 'Desativar' : 'Ativar'}
                    </button>
                    <button 
                      onClick={() => handleDeleteStage(stage.id)} 
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DE ARQUIVADOS ================= */}
      {isArchivedModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsArchivedModalOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-b from-slate-50 to-white shrink-0">
               <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-slate-800">Solicitações Arquivadas</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Histórico do Kanban</p>
                </div>
              </div>
              <button onClick={() => setIsArchivedModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fa]">
              {archivedTickets.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
                    <p className="font-bold text-lg">Nenhuma OS arquivada.</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {archivedTickets.map(t => (
                    <div key={t.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 w-full overflow-hidden flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 uppercase tracking-widest">{t.stage?.name || 'Fase'}</span>
                        <span className="text-[10px] font-bold text-slate-400 font-mono bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">{new Date(t.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-800 break-all w-full text-base">{t.contact?.name || t.contactNumber}</h4>
                      <p className="text-xs font-semibold text-slate-500 mt-1 line-clamp-1 break-all uppercase tracking-wider">{t.marca} {t.modelo}</p>
                      
                      <button onClick={() => handleToggleArchive(t.id, false)} className="mt-auto pt-4 flex items-center justify-center gap-2 w-full bg-blue-50 text-blue-600 py-3 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                        Restaurar OS
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}