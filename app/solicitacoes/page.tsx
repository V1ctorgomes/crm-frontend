'use client';

import React, { useState, useEffect } from 'react';
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
  isArchived: boolean; 
  stage?: Stage; 
}

const PREDEFINED_COLORS = ['#e2e8f0', '#fecaca', '#fef08a', '#bbf7d0', '#bfdbfe', '#e9d5ff', '#fed7aa', '#fbcfe8', '#99f6e4', '#fde68a'];

export default function SolicitacoesPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // NOVO: Barra de Pesquisa
  const [searchTerm, setSearchTerm] = useState('');

  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  // Estados Form Solicitação
  const [selectedContactNumber, setSelectedContactNumber] = useState('');
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [newNoteText, setNewNoteText] = useState('');

  // Estados Gestão de Fases
  const [isStageManagerOpen, setIsStageManagerOpen] = useState(false);
  const [allStages, setAllStages] = useState<Stage[]>([]);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState(PREDEFINED_COLORS[0]);

  // Estados Arquivados
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
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const contact = contacts.find(c => c.number === selectedContactNumber);
    if (contact) { setFormNome(contact.name || ''); setFormEmail(contact.email || ''); setFormCpf(contact.cnpj || ''); }
  }, [selectedContactNumber, contacts]);

  // ==========================================
  // LÓGICA DE DRAG & DROP
  // ==========================================
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
        const [ticket] = sourceStage.tickets.splice(ticketIndex, 1);
        targetStage.tickets.unshift(ticket); 
      }
      return newStages;
    });

    try { await fetch(`${baseUrl}/tickets/${ticketId}/stage`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stageId: targetStageId }) }); } 
    catch (err) { fetchData(); }
  };

  // ==========================================
  // TICKETS & NOTAS
  // ==========================================
  const handleCreateTicket = async () => {
    if (!selectedContactNumber || stages.length === 0) return alert("Selecione um contato e garanta que existe uma fase ativa.");
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
      if (res.ok) {
        setNewNoteText(''); fetchData();
        const note: Note = await res.json();
        setActiveTicket(prev => prev ? { ...prev, notes: [note, ...(prev.notes || [])] } : prev);
      }
    } catch (err) {}
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Tem a certeza que deseja apagar esta nota?")) return;
    try {
      const res = await fetch(`${baseUrl}/tickets/notes/${noteId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        setActiveTicket(prev => prev ? { ...prev, notes: prev.notes?.filter(n => n.id !== noteId) } : prev);
      }
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

  // ==========================================
  // GESTÃO DE FASES
  // ==========================================
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
    if (!confirm("Tem a certeza que deseja apagar esta fase permanentemente?")) return;
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

  // ==========================================
  // ARQUIVADOS
  // ==========================================
  const openArchivedModal = async () => {
    setIsArchivedModalOpen(true);
    const res = await fetch(`${baseUrl}/tickets/archived`);
    if (res.ok) setArchivedTickets(await res.json());
  };

  // ==========================================
  // FILTRO (PESQUISA)
  // ==========================================
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

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f5f7] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[80px] md:pt-0 h-full relative overflow-hidden">
        
        {/* HEADER */}
        <header className="px-6 py-5 bg-white border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Painel de Solicitações</h1>
            <p className="text-slate-500 text-sm mt-1">Acompanhe e gira os pedidos dos seus clientes.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="bg-slate-50 border border-slate-200 rounded-xl flex items-center px-4 h-10 w-full md:w-[250px] shadow-sm focus-within:border-[#1FA84A] transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input 
                type="text" 
                placeholder="Pesquisar tickets..." 
                className="bg-transparent border-none outline-none w-full pl-2 text-sm text-slate-700"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <button onClick={openArchivedModal} className="h-10 px-4 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
              Arquivados
            </button>
            <button onClick={openStageManager} className="h-10 px-4 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg>
              Fases
            </button>
            <button onClick={() => setIsNewTicketModalOpen(true)} className="h-10 px-4 bg-[#1FA84A] text-white font-bold rounded-lg hover:bg-green-600 transition-colors shadow-sm flex items-center gap-2 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Nova Solicitação
            </button>
          </div>
        </header>

        {/* BOARD KANBAN */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <div className="flex h-full gap-6 items-start w-max pb-4">
            {isLoading ? (
              <div className="w-full flex justify-center p-10"><div className="w-8 h-8 border-4 border-[#1FA84A] border-t-transparent rounded-full animate-spin"></div></div>
            ) : filteredStages.length === 0 ? (
              <div className="text-slate-400 p-10">Nenhuma fase configurada ou encontrada.</div>
            ) : (
              filteredStages.map((stage) => (
                <div 
                  key={stage.id} 
                  className="w-[320px] bg-slate-200/50 rounded-xl flex flex-col max-h-full border border-slate-200/60 overflow-hidden"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <div className="p-4 flex justify-between items-center shrink-0" style={{ backgroundColor: stage.color }}>
                    <h3 className="font-bold text-slate-800 mix-blend-multiply">{stage.name}</h3>
                    <span className="bg-white/80 text-slate-800 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                      {stage.tickets.length}
                    </span>
                  </div>
                  
                  <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3">
                    {stage.tickets.length === 0 && searchTerm ? (
                      <p className="text-xs text-slate-400 text-center mt-2">Nenhum resultado na fase.</p>
                    ) : (
                      stage.tickets.map((ticket) => (
                        <div 
                          key={ticket.id} draggable onDragStart={(e) => handleDragStart(e, ticket.id, stage.id)} onClick={() => setActiveTicket(ticket)}
                          className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-[#1FA84A] transition-all w-full overflow-hidden"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md font-mono">{ticket.contactNumber}</span>
                            {(ticket.notes || []).length > 0 && <span className="text-xs text-slate-400 font-bold">{(ticket.notes || []).length} notas</span>}
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm mb-1 break-all w-full">{ticket.contact?.name || 'Sem nome'}</h4>
                          {(ticket.marca || ticket.modelo) && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {ticket.marca && <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[11px] font-bold px-2 py-0.5 rounded-full break-all max-w-full">{ticket.marca}</span>}
                              {ticket.modelo && <span className="bg-purple-50 text-purple-600 border border-purple-100 text-[11px] font-bold px-2 py-0.5 rounded-full break-all max-w-full">{ticket.modelo}</span>}
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

      {/* ================= MODAIS ================= */}
      
      {/* 1. GESTÃO DE FASES */}
      {isStageManagerOpen && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4" onClick={() => setIsStageManagerOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-slate-800">Gerenciar Fases</h3>
              <button onClick={() => setIsStageManagerOpen(false)} className="text-slate-400 hover:text-slate-600"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="p-6 border-b border-slate-100 shrink-0">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Criar Nova Fase</h4>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome</label>
                  <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" value={newStageName} onChange={e => setNewStageName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Cor</label>
                  <div className="flex gap-2">
                    {PREDEFINED_COLORS.map(c => (
                      <button key={c} onClick={() => setNewStageColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${newStageColor === c ? 'border-slate-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <button onClick={handleCreateStage} className="bg-[#1FA84A] text-white px-4 py-2.5 rounded-lg font-bold text-sm h-[40px] w-full md:w-auto">Adicionar</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Ordem, Status e Exclusão</h4>
              {allStages.map((stage, index) => (
                <div key={stage.id} className={`flex items-center justify-between p-3 rounded-xl border ${stage.isActive ? 'border-slate-200 bg-white' : 'border-red-100 bg-red-50 opacity-70'}`}>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => handleReorder(index, 'up')} disabled={index===0} className="text-slate-400 hover:text-black disabled:opacity-20"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M14.77 12.79a.75.75 0 0 1-1.06-.02L10 8.832 6.29 12.77a.75.75 0 1 1-1.08-1.04l4.25-4.5a.75.75 0 0 1 1.08 0l4.25 4.5a.75.75 0 0 1-.02 1.06Z" clipRule="evenodd" /></svg></button>
                      <button onClick={() => handleReorder(index, 'down')} disabled={index===allStages.length-1} className="text-slate-400 hover:text-black disabled:opacity-20"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" /></svg></button>
                    </div>
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: stage.color }}></div>
                    <span className="font-bold text-slate-700 text-sm">{stage.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleToggleStageActive(stage.id, stage.isActive)} 
                      className={`text-xs font-bold px-3 py-1.5 rounded-md ${stage.isActive ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                      {stage.isActive ? 'Desativar' : 'Ativar'}
                    </button>
                    <button 
                      onClick={() => handleDeleteStage(stage.id)} 
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                      title="Apagar Fase"
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

      {/* 2. ARQUIVADOS */}
      {isArchivedModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4" onClick={() => setIsArchivedModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-slate-800">Solicitações Arquivadas</h3>
              <button onClick={() => setIsArchivedModalOpen(false)} className="text-slate-400 hover:text-slate-600"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {archivedTickets.length === 0 ? (
                 <p className="text-center text-slate-400 mt-10">Não há tickets arquivados.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {archivedTickets.map(t => (
                    <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 w-full overflow-hidden">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-500">{t.stage?.name || 'Fase'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(t.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 break-all w-full">{t.contact?.name || t.contactNumber}</h4>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-1 break-all">{t.marca} {t.modelo}</p>
                      <button onClick={() => handleToggleArchive(t.id, false)} className="mt-4 w-full bg-slate-100 text-slate-700 py-2 rounded-lg text-xs font-bold hover:bg-slate-200">Restaurar para o Kanban</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. NOVA SOLICITAÇÃO */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4" onClick={() => setIsNewTicketModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Nova Solicitação</h3>
              <button onClick={() => setIsNewTicketModalOpen(false)} className="text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Contato</label>
                <select className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none" value={selectedContactNumber} onChange={(e) => setSelectedContactNumber(e.target.value)}>
                  <option value="">-- Selecione --</option>
                  {contacts.map(c => <option key={c.number} value={c.number}>{c.name || 'Sem nome'} ({c.number})</option>)}
                </select>
              </div>
              {selectedContactNumber && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-3">
                  <input type="text" placeholder="Nome" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" value={formNome} onChange={e => setFormNome(e.target.value)} />
                  <input type="email" placeholder="E-mail" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                  <input type="text" placeholder="CPF / CNPJ" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" value={formCpf} onChange={e => setFormCpf(e.target.value)} />
                </div>
              )}
              <div className="flex gap-3">
                <div className="flex-1"><label className="block text-sm font-bold text-slate-700 mb-1">Marca</label><input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" value={formMarca} onChange={e => setFormMarca(e.target.value)} /></div>
                <div className="flex-1"><label className="block text-sm font-bold text-slate-700 mb-1">Modelo</label><input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" value={formModelo} onChange={e => setFormModelo(e.target.value)} /></div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsNewTicketModalOpen(false)} className="px-4 py-2 font-bold text-slate-500">Cancelar</button>
              <button onClick={handleCreateTicket} className="bg-[#1FA84A] text-white px-6 py-2 rounded-lg font-bold">Criar Solicitação</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. DETALHES E NOTAS */}
      {activeTicket && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4" onClick={() => setActiveTicket(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="w-[300px] bg-slate-50 border-r border-slate-200 flex flex-col">
              <div className="p-6 border-b border-slate-200 flex items-center gap-4">
                {activeTicket.contact?.profilePictureUrl ? (
                  <img src={activeTicket.contact.profilePictureUrl} className="w-14 h-14 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xl text-slate-500">{(activeTicket.contact?.name || '?').substring(0, 2)}</div>
                )}
                <div className="w-full overflow-hidden">
                  <h3 className="font-bold text-slate-800 break-all">{activeTicket.contact?.name || 'Sem nome'}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{activeTicket.contactNumber}</p>
                </div>
              </div>
              <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
                <div><label className="text-[11px] font-bold text-slate-400 uppercase">E-mail</label><p className="text-sm font-medium break-all">{activeTicket.contact?.email || '—'}</p></div>
                <div><label className="text-[11px] font-bold text-slate-400 uppercase">CPF / CNPJ</label><p className="text-sm font-medium break-all">{activeTicket.contact?.cnpj || '—'}</p></div>
                <hr className="border-slate-200" />
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Aparelho</label>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {activeTicket.marca && <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-xs break-all max-w-full">{activeTicket.marca}</span>}
                    {activeTicket.modelo && <span className="bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded text-xs break-all max-w-full">{activeTicket.modelo}</span>}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 bg-white">
                 <button onClick={() => handleToggleArchive(activeTicket.id, true)} className="w-full flex items-center justify-center gap-2 text-amber-600 bg-amber-50 hover:bg-amber-100 py-2.5 rounded-lg text-sm font-bold transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
                    Arquivar Solicitação
                 </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-white w-full overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-lg text-slate-800">Notas</h3>
                <button onClick={() => setActiveTicket(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
                {(activeTicket.notes || []).map(note => (
                  <div key={note.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4 group w-full flex flex-col">
                    <div className="flex justify-between items-start mb-2 w-full">
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                      <button onClick={() => handleDeleteNote(note.id)} className="w-6 h-6 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                      </button>
                    </div>
                    {/* Aqui está a chave mágica: break-all e w-full para garantir a quebra exata! */}
                    <p className="text-slate-700 text-sm whitespace-pre-wrap break-all w-full leading-relaxed">{note.text}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-100 bg-white">
                <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none resize-none h-[80px]" placeholder="Escreva uma nova atualização..." value={newNoteText} onChange={e => setNewNoteText(e.target.value)} />
                <div className="flex justify-end mt-2">
                  <button onClick={handleAddNote} disabled={!newNoteText.trim()} className="bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-50">Adicionar Nota</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}