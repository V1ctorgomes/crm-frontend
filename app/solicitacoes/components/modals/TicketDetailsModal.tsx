import React, { useState, useRef } from 'react';
import { Ticket } from '@/types';
import { X, Calendar, CheckCircle2, Circle, Clock, Trash2, File, UploadCloud } from 'lucide-react';

interface Props {
  ticket: Ticket | null;
  onClose: () => void;
  baseUrl: string;
  onUpdate: () => void;
  onOpenCloseTicketModal: () => void;
  showFeedback: (type: 'success'|'error', msg: string) => void;
}

export function TicketDetailsModal({ ticket, onClose, baseUrl, onUpdate, onOpenCloseTicketModal, showFeedback }: Props) {
  const [activeTab, setActiveTab] = useState<'notes'|'files'|'tasks'>('tasks');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!ticket) return null;

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !newTaskDate) return;
    try {
      await fetch(`${baseUrl}/tickets/${ticket.id}/tasks`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ title: newTaskTitle, dueDate: new Date(newTaskDate).toISOString() }) });
      setNewTaskTitle(''); setNewTaskDate(''); onUpdate(); showFeedback('success', 'Lembrete agendado!');
    } catch(err) { showFeedback('error', 'Erro ao agendar.'); }
  };

  const handleToggleTask = async (taskId: string, current: boolean) => {
    await fetch(`${baseUrl}/tickets/tasks/${taskId}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ isCompleted: !current }) });
    onUpdate();
  };

  const handleDeleteTask = async (taskId: string) => {
    await fetch(`${baseUrl}/tickets/tasks/${taskId}`, { method: 'DELETE' });
    onUpdate(); showFeedback('success', 'Lembrete apagado.');
  };

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    await fetch(`${baseUrl}/tickets/${ticket.id}/notes`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ text: newNoteText }) });
    setNewNoteText(''); onUpdate(); showFeedback('success', 'Nota adicionada.');
  };

  const handleDeleteNote = async (id: string) => {
    await fetch(`${baseUrl}/tickets/notes/${id}`, { method: 'DELETE' });
    onUpdate(); showFeedback('success', 'Nota apagada.');
  };

  const uploadFile = async () => {
    if (!pendingFile) return;
    setIsUploading(true);
    const fd = new FormData(); fd.append('file', pendingFile);
    await fetch(`${baseUrl}/tickets/${ticket.id}/files`, { method: 'POST', body: fd });
    setPendingFile(null); onUpdate(); showFeedback('success', 'Arquivo enviado.');
    setIsUploading(false);
  };

  const deleteFile = async (id: string) => {
    await fetch(`${baseUrl}/tickets/files/${id}`, { method: 'DELETE' });
    onUpdate(); showFeedback('success', 'Arquivo apagado.');
  };

  const formatSize = (bytes: number) => bytes < 1048576 ? (bytes/1024).toFixed(1)+' KB' : (bytes/1048576).toFixed(1)+' MB';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl h-[85vh] flex overflow-hidden border border-slate-200" onClick={e => e.stopPropagation()}>
        
        {/* Esquerda: Cliente */}
        <div className="w-[300px] bg-slate-50 border-r flex flex-col hidden md:flex">
          <div className="p-6 flex flex-col items-center text-center border-b">
            {ticket.contact?.profilePictureUrl ? <img src={ticket.contact.profilePictureUrl} className="w-20 h-20 rounded-full mb-3 object-cover" alt=""/> : <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-xl text-slate-400 font-bold mb-3 border">{(ticket.contact?.name||'?').substring(0,2)}</div>}
            <h3 className="font-semibold text-lg">{ticket.contact?.name || 'Sem Nome'}</h3>
            <span className="text-xs bg-white px-2 rounded border mt-1 font-mono text-slate-500">{ticket.contactNumber}</span>
          </div>
          <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4 text-sm text-slate-800">
            <div><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">E-mail</p><p>{ticket.contact?.email||'--'}</p></div>
            <div><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">CPF/CNPJ</p><p>{ticket.contact?.cnpj||'--'}</p></div>
            <div className="pt-4 border-t border-slate-200 flex flex-col gap-4">
              {ticket.ticketType && <div><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Tipo de OS</p><p className="font-medium text-blue-600">{ticket.ticketType}</p></div>}
              {ticket.marca && <div><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Marca</p><p>{ticket.marca}</p></div>}
              {ticket.modelo && <div><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Modelo</p><p>{ticket.modelo}</p></div>}
            </div>
          </div>
          <div className="p-4 bg-white border-t"><button onClick={onOpenCloseTicketModal} className="w-full bg-slate-900 text-white h-10 rounded-md text-sm font-medium hover:bg-slate-800">Encerrar Solicitação</button></div>
        </div>

        {/* Direita: Abas */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="px-6 pt-4 border-b flex justify-between items-end">
            <div className="flex gap-6">
              {['tasks','notes','files'].map(t => (
                <button key={t} onClick={() => setActiveTab(t as any)} className={`pb-3 text-sm font-medium flex gap-2 border-b-2 ${activeTab === t ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500'}`}>
                  {t === 'tasks' ? 'Lembretes' : t === 'notes' ? 'Notas' : 'Anexos'}
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100">{t==='tasks'?ticket.tasks?.filter(x=>!x.isCompleted).length||0:t==='files'?(ticket.files?.length||0):''}</span>
                </button>
              ))}
            </div>
            <button onClick={onClose} className="mb-2 text-slate-400"><X className="w-5 h-5"/></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            {/* TAREFAS */}
            {activeTab === 'tasks' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 flex flex-col gap-3">
                  {(ticket.tasks||[]).map(t => (
                    <div key={t.id} className={`bg-white p-4 rounded-lg border flex gap-3 ${t.isCompleted?'opacity-60':''}`}>
                      <button onClick={()=>handleToggleTask(t.id, t.isCompleted)} className={t.isCompleted?'text-green-500':'text-slate-300'}>{t.isCompleted?<CheckCircle2/>:<Circle/>}</button>
                      <div className="flex-1"><h4 className={`text-sm font-medium ${t.isCompleted?'line-through':''}`}>{t.title}</h4><span className="text-xs text-slate-400 flex items-center gap-1 mt-1"><Clock className="w-3 h-3"/> {new Date(t.dueDate).toLocaleString()}</span></div>
                      <button onClick={()=>handleDeleteTask(t.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2"><input type="text" className="flex-1 h-10 px-3 border rounded-md text-sm" placeholder="Ex: Ligar..." value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)}/><input type="datetime-local" className="h-10 px-3 border rounded-md text-sm" value={newTaskDate} onChange={e=>setNewTaskDate(e.target.value)}/><button onClick={handleAddTask} className="h-10 px-4 bg-slate-900 text-white rounded-md text-sm">Agendar</button></div>
              </div>
            )}
            
            {/* NOTAS */}
            {activeTab === 'notes' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 flex flex-col gap-3">
                  {(ticket.notes||[]).map(n => (
                    <div key={n.id} className="bg-white p-4 rounded-lg border relative group"><button onClick={()=>handleDeleteNote(n.id)} className="absolute right-2 top-2 text-slate-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4"/></button><span className="text-[10px] text-slate-400 block mb-1">{new Date(n.createdAt).toLocaleString()}</span><p className="text-sm">{n.text}</p></div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2"><input type="text" className="flex-1 h-10 px-3 border rounded-md text-sm" placeholder="Nova nota..." value={newNoteText} onChange={e=>setNewNoteText(e.target.value)}/><button onClick={handleAddNote} className="h-10 px-4 bg-slate-900 text-white rounded-md text-sm">Salvar</button></div>
              </div>
            )}

            {/* FILES */}
            {activeTab === 'files' && (
              <div className="flex flex-col h-full">
                <input type="file" ref={fileInputRef} onChange={e=>setPendingFile(e.target.files?.[0]||null)} className="hidden" />
                {pendingFile ? (
                  <div className="bg-white p-4 rounded-lg border border-blue-200 flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">{pendingFile.name}</span>
                    <div className="flex gap-2"><button onClick={()=>setPendingFile(null)} className="text-sm px-3 py-1 border rounded">Cancelar</button><button onClick={uploadFile} className="bg-slate-900 text-white text-sm px-3 py-1 rounded">{isUploading?'Enviando...':'Upload'}</button></div>
                  </div>
                ) : (
                  <button onClick={()=>fileInputRef.current?.click()} className="w-full bg-white border-2 border-dashed border-slate-300 p-4 rounded-lg text-sm font-medium text-slate-600 mb-4 hover:bg-blue-50">Anexar Ficheiro</button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {(ticket.files||[]).map(f => (
                    <div key={f.id} className="bg-white border p-3 rounded-lg flex items-center gap-3">
                      <File className="w-6 h-6 text-slate-400 shrink-0"/>
                      <div className="flex-1 min-w-0"><p className="text-xs font-semibold truncate">{f.fileName}</p><p className="text-[10px] text-slate-400">{formatSize(f.size)}</p></div>
                      <a href={f.fileUrl} target="_blank" className="p-1.5 hover:bg-slate-100 rounded text-blue-600"><UploadCloud className="w-4 h-4"/></a>
                      <button onClick={()=>deleteFile(f.id)} className="p-1.5 hover:bg-slate-100 rounded text-red-600"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}