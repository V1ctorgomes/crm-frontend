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

interface Ticket {
  id: string;
  contactNumber: string;
  contact?: Contact; // Blindado para o TypeScript
  marca: string | null;
  modelo: string | null;
  createdAt: string;
  notes?: Note[]; // Blindado para o TypeScript
}

interface Stage {
  id: string;
  name: string;
  order: number;
  tickets: Ticket[];
}

export default function SolicitacoesPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isNewStageModalOpen, setIsNewStageModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  const [selectedContactNumber, setSelectedContactNumber] = useState('');
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formModelo, setFormModelo] = useState('');
  
  const [newStageName, setNewStageName] = useState('');
  const [newNoteText, setNewNoteText] = useState('');

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  const fetchData = async () => {
    try {
      const [boardRes, contactsRes] = await Promise.all([
        fetch(`${baseUrl}/tickets/board`),
        fetch(`${baseUrl}/whatsapp/contacts`)
      ]);
      
      if (boardRes.ok) setStages(await boardRes.json());
      if (contactsRes.ok) setContacts(await contactsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const contact = contacts.find(c => c.number === selectedContactNumber);
    if (contact) {
      setFormNome(contact.name || '');
      setFormEmail(contact.email || '');
      setFormCpf(contact.cnpj || '');
    }
  }, [selectedContactNumber, contacts]);

  const handleDragStart = (e: React.DragEvent, ticketId: string, sourceStageId: string) => {
    e.dataTransfer.setData('ticketId', ticketId);
    e.dataTransfer.setData('sourceStageId', sourceStageId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('ticketId');
    const sourceStageId = e.dataTransfer.getData('sourceStageId');

    if (sourceStageId === targetStageId) return;

    setStages(prevStages => {
      const newStages = [...prevStages];
      const sourceStage = newStages.find(s => s.id === sourceStageId);
      const targetStage = newStages.find(s => s.id === targetStageId);
      
      if (sourceStage && targetStage) {
        const ticketIndex = sourceStage.tickets.findIndex(t => t.id === ticketId);
        const [ticket] = sourceStage.tickets.splice(ticketIndex, 1);
        targetStage.tickets.unshift(ticket); 
      }
      return newStages;
    });

    try {
      await fetch(`${baseUrl}/tickets/${ticketId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId: targetStageId })
      });
    } catch (err) {
      console.error('Falha ao mover ticket', err);
      fetchData(); 
    }
  };

  const handleCreateTicket = async () => {
    if (!selectedContactNumber || stages.length === 0) return alert("Selecione um contato e garanta que existe uma fase.");
    
    const body = {
      contactNumber: selectedContactNumber,
      nome: formNome,
      email: formEmail,
      cpf: formCpf,
      marca: formMarca,
      modelo: formModelo,
      stageId: stages[0].id
    };

    try {
      const res = await fetch(`${baseUrl}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setIsNewTicketModalOpen(false);
        setFormMarca(''); setFormModelo(''); setSelectedContactNumber('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteText.trim() || !activeTicket) return;
    try {
      const res = await fetch(`${baseUrl}/tickets/${activeTicket.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newNoteText })
      });
      if (res.ok) {
        setNewNoteText('');
        fetchData();
        const note = await res.json();
        setActiveTicket(prev => prev ? { ...prev, notes: [note, ...(prev.notes || [])] } : prev);
      }
    } catch (err) { console.error(err); }
  };

  const handleCreateStage = async () => {
    if (!newStageName.trim()) return;
    try {
      const res = await fetch(`${baseUrl}/tickets/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStageName })
      });
      if (res.ok) {
        setNewStageName('');
        setIsNewStageModalOpen(false);
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f5f7] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[80px] md:pt-0 h-full relative overflow-hidden">
        
        <header className="px-8 py-6 bg-white border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Painel de Solicitações</h1>
            <p className="text-slate-500 text-sm mt-1">Acompanhe e gira os pedidos dos seus clientes.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsNewStageModalOpen(true)} className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors text-sm">
              + Nova Fase
            </button>
            <button onClick={() => setIsNewTicketModalOpen(true)} className="px-4 py-2 bg-[#1FA84A] text-white font-bold rounded-lg hover:bg-green-600 transition-colors shadow-sm flex items-center gap-2 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Nova Solicitação
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <div className="flex h-full gap-6 items-start w-max pb-4">
            
            {isLoading ? (
              <div className="w-full flex justify-center p-10"><div className="w-8 h-8 border-4 border-[#1FA84A] border-t-transparent rounded-full animate-spin"></div></div>
            ) : stages.length === 0 ? (
              <div className="text-slate-400 p-10">Nenhuma fase configurada. Clique em "+ Nova Fase".</div>
            ) : (
              stages.map((stage) => (
                <div 
                  key={stage.id} 
                  className="w-[320px] bg-slate-200/50 rounded-xl flex flex-col max-h-full border border-slate-200/60"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <div className="p-4 border-b border-slate-200/50 flex justify-between items-center bg-slate-100 rounded-t-xl shrink-0">
                    <h3 className="font-bold text-slate-700">{stage.name}</h3>
                    <span className="bg-white text-slate-500 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                      {stage.tickets.length}
                    </span>
                  </div>
                  
                  <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3">
                    {stage.tickets.map((ticket) => (
                      <div 
                        key={ticket.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ticket.id, stage.id)}
                        onClick={() => setActiveTicket(ticket)}
                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-[#1FA84A] hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md font-mono">{ticket.contactNumber}</span>
                          <div className="flex gap-1">
                            {(ticket.notes || []).length > 0 && (
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 0 0 1.28.53l3.58-3.579a22.281 22.281 0 0 0 4.14-.325C16.007 13.245 17 11.986 17 10.574V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0 0 10 2ZM6.75 6a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 2.5a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5h-3.5Z" clipRule="evenodd" /></svg> 
                                {(ticket.notes || []).length}
                              </span>
                            )}
                          </div>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">{ticket.contact?.name || 'Sem nome'}</h4>
                        
                        {(ticket.marca || ticket.modelo) && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {ticket.marca && <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[11px] font-bold px-2 py-0.5 rounded-full">{ticket.marca}</span>}
                            {ticket.modelo && <span className="bg-purple-50 text-purple-600 border border-purple-100 text-[11px] font-bold px-2 py-0.5 rounded-full">{ticket.modelo}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {isNewTicketModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4" onClick={() => setIsNewTicketModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Nova Solicitação</h3>
              <button onClick={() => setIsNewTicketModalOpen(false)} className="text-slate-400 hover:text-slate-600"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Contato (Obrigatório)</label>
                <select 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#1FA84A] shadow-sm"
                  value={selectedContactNumber}
                  onChange={(e) => setSelectedContactNumber(e.target.value)}
                >
                  <option value="">-- Selecione um contato cadastrado --</option>
                  {contacts.map(c => <option key={c.number} value={c.number}>{c.name || 'Sem nome'} ({c.number})</option>)}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Apenas contatos que já interagiram no WhatsApp aparecem aqui.</p>
              </div>

              {selectedContactNumber && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dados do Cliente (Editável)</h4>
                  <input type="text" placeholder="Nome" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" value={formNome} onChange={e => setFormNome(e.target.value)} />
                  <input type="email" placeholder="E-mail" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                  <input type="text" placeholder="CPF / CNPJ" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none font-mono" value={formCpf} onChange={e => setFormCpf(e.target.value)} />
                </div>
              )}

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Marca</label>
                  <input type="text" placeholder="Ex: Apple, Samsung" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1FA84A] shadow-sm" value={formMarca} onChange={e => setFormMarca(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Modelo</label>
                  <input type="text" placeholder="Ex: iPhone 13" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1FA84A] shadow-sm" value={formModelo} onChange={e => setFormModelo(e.target.value)} />
                </div>
              </div>

            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsNewTicketModalOpen(false)} className="px-4 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100">Cancelar</button>
              <button onClick={handleCreateTicket} className="bg-[#1FA84A] text-white px-6 py-2 rounded-lg font-bold hover:bg-green-600 shadow-sm">Criar Solicitação</button>
            </div>
          </div>
        </div>
      )}

      {activeTicket && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 md:p-8" onClick={() => setActiveTicket(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex overflow-hidden" onClick={e => e.stopPropagation()}>
            
            <div className="w-[300px] bg-slate-50 border-r border-slate-200 flex flex-col">
              <div className="p-6 border-b border-slate-200 flex items-center gap-4">
                {activeTicket.contact?.profilePictureUrl ? (
                  <img src={activeTicket.contact?.profilePictureUrl} className="w-14 h-14 rounded-full object-cover shadow-sm" alt="avatar" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xl text-slate-500">{(activeTicket.contact?.name || '?').substring(0, 2).toUpperCase()}</div>
                )}
                <div>
                  <h3 className="font-bold text-slate-800 line-clamp-1">{activeTicket.contact?.name || 'Sem nome'}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{activeTicket.contactNumber}</p>
                </div>
              </div>
              <div className="p-6 flex flex-col gap-6 overflow-y-auto">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">E-mail</label>
                  <p className="text-sm text-slate-700 font-medium">{activeTicket.contact?.email || '—'}</p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">CPF / CNPJ</label>
                  <p className="text-sm text-slate-700 font-medium">{activeTicket.contact?.cnpj || '—'}</p>
                </div>
                <hr className="border-slate-200" />
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Aparelho</label>
                  <div className="mt-2 flex gap-2">
                    {activeTicket.marca ? <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-xs">{activeTicket.marca}</span> : <span className="text-sm text-slate-400">—</span>}
                    {activeTicket.modelo && <span className="bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded text-xs">{activeTicket.modelo}</span>}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Data de Criação</label>
                  <p className="text-sm text-slate-700 font-medium">{new Date(activeTicket.createdAt).toLocaleString('pt-PT')}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-white relative">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-lg text-slate-800">Notas da Solicitação</h3>
                <button onClick={() => setActiveTicket(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
                {(activeTicket.notes || []).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                    <p className="text-sm">Nenhuma nota registada.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {(activeTicket.notes || []).map(note => (
                      <div key={note.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                        <span className="absolute top-4 right-4 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">{new Date(note.createdAt).toLocaleString('pt-PT')}</span>
                        <p className="text-slate-700 text-sm whitespace-pre-wrap pr-24 leading-relaxed">{note.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-[#1FA84A] resize-none h-[100px]"
                  placeholder="Escreva uma nova atualização sobre este pedido..."
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                />
                <div className="flex justify-end mt-2">
                  <button onClick={handleAddNote} disabled={!newNoteText.trim()} className="bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-black disabled:opacity-50 transition-colors shadow-sm">
                    Adicionar Nota
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {isNewStageModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4" onClick={() => setIsNewStageModalOpen(false)}>
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="font-bold text-lg text-slate-800 mb-4">Nova Fase (Coluna)</h3>
                <input type="text" placeholder="Nome da Fase (ex: Orçamento)" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#1FA84A]" value={newStageName} onChange={e => setNewStageName(e.target.value)} autoFocus />
              </div>
              <div className="px-6 py-4 bg-slate-50 flex justify-end gap-2 border-t border-slate-100">
                <button onClick={() => setIsNewStageModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button>
                <button onClick={handleCreateStage} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black">Criar Fase</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}