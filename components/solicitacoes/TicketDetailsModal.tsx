import React, { useState, useRef } from 'react';
import { Clock, Trash2, Calendar, CheckCircle2, Circle, X } from 'lucide-react';
import { Ticket } from './types';

interface TicketDetailsModalProps {
  ticket: Ticket;
  baseUrl: string;
  initialTab?: 'tasks' | 'notes' | 'files';
  onClose: () => void;
  onTicketUpdated: () => void;
  onCloseTicketRequest: () => void;
  showFeedback: (type: 'success' | 'error', msg: string) => void;
  setConfirmModal: (modal: any) => void;
}

export function TicketDetailsModal({ 
  ticket, baseUrl, initialTab = 'tasks', onClose, onTicketUpdated, onCloseTicketRequest, showFeedback, setConfirmModal 
}: TicketDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'notes' | 'files' | 'tasks'>(initialTab);
  
  // Estados Locais de Formulários
  const [newNoteText, setNewNoteText] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  
  // Estados de Upload
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Funções Internas de CRUD
  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !newTaskDate) return;
    const dateWithTimezone = new Date(newTaskDate).toISOString();
    try {
      const res = await fetch(`${baseUrl}/tickets/${ticket.id}/tasks`, { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTaskTitle, dueDate: dateWithTimezone }) 
      });
      if (res.ok) { setNewTaskTitle(''); setNewTaskDate(''); onTicketUpdated(); showFeedback('success', 'Lembrete agendado!'); }
    } catch (err) { showFeedback('error', 'Erro ao agendar lembrete.'); }
  };

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    try {
      await fetch(`${baseUrl}/tickets/tasks/${taskId}`, { 
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isCompleted: !isCompleted }) 
      });
      onTicketUpdated(); 
    } catch (err) { showFeedback('error', 'Erro ao atualizar tarefa.'); }
  };

  const handleDeleteTask = (taskId: string) => {
    setConfirmModal({
      title: "Apagar Lembrete?", message: "Tem a certeza que deseja apagar este lembrete?",
      onConfirm: async () => {
        try {
          await fetch(`${baseUrl}/tickets/tasks/${taskId}`, { method: 'DELETE' });
          onTicketUpdated(); showFeedback('success', 'Lembrete apagado.'); 
        } catch (err) { showFeedback('error', 'Erro ao apagar.'); }
        setConfirmModal(null);
      },
      onClose: () => setConfirmModal(null)
    });
  };

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    try {
      const res = await fetch(`${baseUrl}/tickets/${ticket.id}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: newNoteText }) });
      if (res.ok) { setNewNoteText(''); onTicketUpdated(); showFeedback('success', 'Nota adicionada ao histórico!'); }
    } catch (err) { showFeedback('error', 'Erro ao adicionar nota.'); }
  };

  const handleDeleteNote = (noteId: string) => {
    setConfirmModal({
      title: "Apagar Nota?", message: "Tem a certeza que deseja apagar esta nota? Esta ação é irreversível.",
      onConfirm: async () => {
        try {
          const res = await fetch(`${baseUrl}/tickets/notes/${noteId}`, { method: 'DELETE' });
          if (res.ok) { onTicketUpdated(); showFeedback('success', 'Nota apagada.'); }
        } catch (err) { showFeedback('error', 'Erro ao apagar nota.'); }
        setConfirmModal(null);
      },
      onClose: () => setConfirmModal(null)
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { showFeedback('error', "Arquivo muito grande (máx 15MB)."); return; }
    setPendingFile(file); setFileDescription('');
  };

  const confirmUploadFile = async () => {
    if (!pendingFile) return;
    setIsUploadingFile(true);
    const formData = new FormData();
    formData.append('file', pendingFile);
    if (fileDescription.trim()) formData.append('description', fileDescription.trim());

    try {
      const res = await fetch(`${baseUrl}/tickets/${ticket.id}/files`, { method: 'POST', body: formData });
      if (res.ok) { setPendingFile(null); setFileDescription(''); onTicketUpdated(); showFeedback('success', 'Arquivo anexado com sucesso!'); } 
      else showFeedback('error', "Erro ao enviar ficheiro.");
    } catch (error) { showFeedback('error', "Erro de conexão."); } 
    finally { setIsUploadingFile(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleDeleteFile = (fileId: string) => {
    setConfirmModal({
      title: "Remover Anexo?", message: "Tem a certeza que deseja apagar este ficheiro? Não poderá ser recuperado.",
      onConfirm: async () => {
        try {
          const res = await fetch(`${baseUrl}/tickets/files/${fileId}`, { method: 'DELETE' });
          if (res.ok) { onTicketUpdated(); showFeedback('success', 'Ficheiro removido.'); }
        } catch (error) { showFeedback('error', 'Erro ao remover ficheiro.'); }
        setConfirmModal(null);
      },
      onClose: () => setConfirmModal(null)
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl h-[85vh] flex overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200" onMouseDown={e => e.stopPropagation()}>
        
        {/* Lateral Esquerda */}
        <div className="w-[300px] bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 hidden md:flex">
          <div className="p-6 flex flex-col items-center text-center border-b border-slate-200">
            {ticket.contact?.profilePictureUrl ? (
              <img src={ticket.contact.profilePictureUrl} referrerPolicy="no-referrer" className="w-20 h-20 rounded-full object-cover shadow-sm border border-slate-200 mb-3" alt="Perfil" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-xl text-slate-400 shadow-sm mb-3">
                {(ticket.contact?.name || '?').substring(0, 2).toUpperCase()}
              </div>
            )}
            <h3 className="font-semibold text-lg text-slate-900 break-all">{ticket.contact?.name || 'Sem nome'}</h3>
            <span className="text-slate-500 font-mono text-xs mt-1 bg-white px-2 py-0.5 rounded border border-slate-200">
              {ticket.contactNumber}
            </span>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-5">
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 block">E-mail</label>
                <p className="text-sm text-slate-800 break-all">{ticket.contact?.email || '--'}</p>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 block">CPF / CNPJ</label>
                <p className="text-sm text-slate-800 font-mono break-all">{ticket.contact?.cnpj || '--'}</p>
              </div>
            </div>

            {(ticket.marca || ticket.modelo || ticket.customerType || ticket.ticketType) && (
              <div className="pt-4 border-t border-slate-200 flex flex-col gap-4">
                {ticket.ticketType && (
                  <div><label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 block">Tipo de Solicitação</label><p className="text-sm text-slate-800 font-medium">{ticket.ticketType}</p></div>
                )}
                {ticket.customerType && (
                  <div><label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 block">Tipo de Cliente</label><p className="text-sm text-slate-800">{ticket.customerType}</p></div>
                )}
                {ticket.marca && (
                  <div><label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 block">Marca</label><p className="text-sm text-slate-800">{ticket.marca}</p></div>
                )}
                {ticket.modelo && (
                  <div><label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1 block">Modelo</label><p className="text-sm text-slate-800">{ticket.modelo}</p></div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 bg-white">
             <button onClick={onCloseTicketRequest} className="w-full flex items-center justify-center gap-2 text-slate-50 bg-slate-900 hover:bg-slate-800 py-2.5 rounded-md text-sm font-medium transition-colors">
                Encerrar Solicitação
             </button>
          </div>
        </div>

        {/* Painel Principal (Abas) */}
        <div className="flex-1 flex flex-col bg-white w-full overflow-hidden">
          <div className="px-6 border-b border-slate-200 flex justify-between items-end shrink-0 pt-4">
            <div className="flex gap-6">
              <button onClick={() => setActiveTab('tasks')} className={`pb-3 font-medium text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'tasks' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                Lembretes
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'tasks' ? 'bg-slate-100 text-slate-900' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                  {ticket.tasks?.filter(t => !t.isCompleted).length || 0}
                </span>
              </button>
              <button onClick={() => setActiveTab('notes')} className={`pb-3 font-medium text-sm transition-all border-b-2 ${activeTab === 'notes' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                Notas Internas
              </button>
              <button onClick={() => setActiveTab('files')} className={`pb-3 font-medium text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'files' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                Anexos
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'files' ? 'bg-slate-100 text-slate-900' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>{(ticket.files || []).length}</span>
              </button>
            </div>
            <button onClick={onClose} className="mb-2 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
          </div>

          {activeTab === 'tasks' ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
              <div className="flex-1 p-6 overflow-y-auto">
                {(ticket.tasks || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                     <Calendar className="w-10 h-10 mb-2 opacity-50" />
                     <p className="text-sm font-medium">Sem agendamentos para esta OS.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {(ticket.tasks || []).map(task => {
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
                  <input type="text" placeholder="O que precisa ser feito?" className="flex-1 h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
                  <input type="datetime-local" className="sm:w-[200px] h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500" value={newTaskDate} onChange={e => setNewTaskDate(e.target.value)} />
                  <button onClick={handleAddTask} disabled={!newTaskTitle.trim() || !newTaskDate} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-slate-900 text-slate-50 h-10 px-6 disabled:opacity-50">Agendar</button>
                </div>
              </div>
            </div>
          ) : activeTab === 'notes' ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex-1 p-6 overflow-y-auto">
                {(ticket.notes || []).length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400"><p className="text-sm font-medium">Nenhuma nota adicionada.</p></div>
                )}
                <div className="flex flex-col gap-4">
                  {(ticket.notes || []).map(note => (
                    <div key={note.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm group w-[90%] flex flex-col relative">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-medium text-slate-500">{new Date(note.createdAt).toLocaleString('pt-PT')}</span>
                        <button onClick={() => handleDeleteNote(note.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <p className="text-slate-700 text-sm whitespace-pre-wrap break-all">{note.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
                <div className="flex flex-col gap-2">
                  <textarea className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" placeholder="Escreva uma nota..." value={newNoteText} onChange={e => setNewNoteText(e.target.value)} />
                  <div className="flex justify-end">
                    <button onClick={handleAddNote} disabled={!newNoteText.trim()} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-slate-900 text-slate-50 h-9 px-4 py-2 disabled:opacity-50">Adicionar Nota</button>
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
                  <input type="text" placeholder="Legenda (Opcional)" className="flex h-9 w-full rounded-md border border-slate-300 px-3 py-1 text-sm focus:outline-none" value={fileDescription} onChange={e => setFileDescription(e.target.value)} autoFocus />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setPendingFile(null); setFileDescription(''); if(fileInputRef.current) fileInputRef.current.value=''; }} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-slate-200 h-9 px-4">Cancelar</button>
                    <button onClick={confirmUploadFile} disabled={isUploadingFile} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-slate-900 text-slate-50 h-9 px-4">
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

              {(ticket.files || []).length === 0 && !pendingFile ? (
                 <div className="flex flex-col items-center justify-center py-8 text-slate-400"><p className="text-sm font-medium">Sem anexos.</p></div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {(ticket.files || []).map(file => (
                    <div key={file.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-3 group relative shadow-sm">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 border border-slate-100 ${file.mimeType.includes('image') ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <h4 className="font-medium text-xs text-slate-800 truncate">{file.fileName}</h4>
                        <div className="text-[11px] text-slate-500 mt-0.5 mb-1">{formatSize(file.size)}</div>
                      </div>
                      <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg></a>
                         <button onClick={() => handleDeleteFile(file.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
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
  );
}