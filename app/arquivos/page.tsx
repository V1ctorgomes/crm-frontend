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
}

interface Ticket {
  id: string;
  contactNumber: string;
  contact?: Contact;
  marca: string | null;
  modelo: string | null;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  stage?: Stage;
  files?: TicketFile[];
}

export default function ArquivosPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Navegação
  const [selectedContactNumber, setSelectedContactNumber] = useState<string | null>(null);
  
  // Pesquisa
  const [folderSearchTerm, setFolderSearchTerm] = useState('');

  // Feedback (Notificações e Modais)
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; } | null>(null);

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAllTickets = async () => {
    setIsLoading(true);
    try {
      const [boardRes, archRes] = await Promise.all([
        fetch(`${baseUrl}/tickets/board`),
        fetch(`${baseUrl}/tickets/archived`)
      ]);
      
      let all: Ticket[] = [];
      if (boardRes.ok) {
        const board = await boardRes.json();
        board.forEach((stage: any) => { all = [...all, ...stage.tickets]; });
      }
      if (archRes.ok) {
        const arch = await archRes.json();
        all = [...all, ...arch];
      }
      setTickets(all);
    } catch (error) {
      showFeedback('error', 'Erro ao carregar a base de arquivos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAllTickets(); }, []);

  const handleDeleteFile = (fileId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Apagar Arquivo?",
      message: "Tem a certeza que deseja apagar permanentemente este ficheiro da nuvem? Esta ação é irreversível.",
      onConfirm: async () => {
        try {
          const res = await fetch(`${baseUrl}/tickets/files/${fileId}`, { method: 'DELETE' });
          if (res.ok) {
            await fetchAllTickets();
            showFeedback('success', 'Ficheiro apagado com sucesso.');
          } else {
            showFeedback('error', 'Erro ao remover ficheiro do servidor.');
          }
        } catch (error) { showFeedback('error', 'Erro de conexão.'); }
        setConfirmModal(null);
      }
    });
  };

  const handleDeleteTicket = (ticketId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir OS?",
      message: "Atenção: Tem certeza que deseja apagar esta OS e todos os seus arquivos permanentemente?",
      onConfirm: async () => {
        try {
          const res = await fetch(`${baseUrl}/tickets/${ticketId}`, { method: 'DELETE' });
          if (res.ok) {
            await fetchAllTickets();
            showFeedback('success', 'OS e arquivos removidos com sucesso.');
          } else {
            showFeedback('error', 'Erro ao remover OS.');
          }
        } catch (error) { showFeedback('error', 'Erro de conexão.'); }
        setConfirmModal(null);
      }
    });
  };

  // Agrupar Tickets por Cliente (Pastas)
  const foldersMap = new Map<string, { contact: Contact, tickets: Ticket[], fileCount: number }>();
  tickets.forEach(t => {
    const cNum = t.contactNumber;
    if (!foldersMap.has(cNum)) {
      foldersMap.set(cNum, { contact: t.contact || { number: cNum, name: cNum }, tickets: [], fileCount: 0 });
    }
    const group = foldersMap.get(cNum)!;
    group.tickets.push(t);
    group.fileCount += (t.files || []).length;
  });

  // Mostrar pastas
  let folders = Array.from(foldersMap.values());

  // Aplicar filtro de pesquisa de pastas
  if (folderSearchTerm.trim() !== '') {
    const term = folderSearchTerm.toLowerCase();
    folders = folders.filter(f => 
      (f.contact.name && f.contact.name.toLowerCase().includes(term)) || 
      f.contact.number.includes(term)
    );
  }

  // Ordenar: pastas com mais arquivos primeiro
  folders.sort((a, b) => b.fileCount - a.fileCount);

  const selectedFolder = selectedContactNumber ? foldersMap.get(selectedContactNumber) : null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f6] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden">
        
        {/* TOAST NOTIFICATION - CANTO SUPERIOR DIREITO */}
        {toast && (
          <div className={`fixed top-10 right-10 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300`}>
            <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-white border-green-100 text-green-700' : 'bg-white border-red-100 text-red-700'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                {toast.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                )}
              </div>
              <span className="font-bold text-sm">{toast.message}</span>
            </div>
          </div>
        )}

        {/* CABEÇALHO */}
        <header className="px-6 md:px-10 pt-8 md:pt-10 pb-4 flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nuvem e Mídia</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestão de Arquivos</h1>
            <p className="text-slate-500 mt-1 font-medium">Documentos, imagens e PDFs anexados às solicitações.</p>
          </div>
          
          {/* BARRA DE PESQUISA (Se estiver na raiz) */}
          {!selectedContactNumber && (
            <div className="flex flex-row items-center gap-3 overflow-x-auto no-scrollbar pb-2 xl:pb-0 w-full xl:w-auto">
              <div className="bg-white border border-slate-200/80 rounded-2xl flex items-center px-4 h-11 min-w-[280px] shadow-sm focus-within:border-[#1FA84A] focus-within:ring-4 focus-within:ring-[#1FA84A]/10 transition-all shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-400 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                <input 
                  type="text" 
                  placeholder="Pesquisar cliente ou número..." 
                  className="bg-transparent border-none outline-none w-full pl-3 text-sm font-medium text-slate-700 placeholder:text-slate-400"
                  value={folderSearchTerm}
                  onChange={e => setFolderSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}
        </header>

        {/* ÁREA PRINCIPAL */}
        <div className="flex-1 overflow-y-auto p-6 md:px-10 pb-20 no-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 mt-10">
              <div className="w-10 h-10 border-4 border-[#1FA84A] border-t-transparent rounded-full animate-spin shadow-sm"></div>
              <span className="text-slate-500 font-bold text-sm">A carregar nuvem...</span>
            </div>
          ) : !selectedContactNumber ? (
            /* ================= VIEW: LISTA DE PASTAS ================= */
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              {folders.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center mt-20">
                  <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>
                  </div>
                  <h4 className="font-bold text-slate-700 text-lg">Nenhuma pasta encontrada</h4>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm">Ainda não existem arquivos associados às OS dos seus clientes.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {folders.map(folder => (
                    <div 
                      key={folder.contact.number} 
                      onClick={() => setSelectedContactNumber(folder.contact.number)}
                      className="bg-white border border-slate-200/80 rounded-3xl p-5 flex flex-col items-center text-center cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-[#1FA84A]/50 transition-all group"
                    >
                      {/* Ícone de Pasta Corrigido (SVG Sólido + Posição Absoluta do Badge) */}
                      <div className="relative mb-4 mt-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-20 h-20 text-cyan-500 drop-shadow-sm group-hover:scale-105 transition-transform duration-300">
                          <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" />
                        </svg>
                        
                        {/* Badge de quantidade com posição corrigida */}
                        {folder.fileCount > 0 && (
                          <div className="absolute -top-1 -right-2 w-7 h-7 bg-[#1FA84A] text-white rounded-full flex items-center justify-center text-[11px] font-black border-2 border-white shadow-sm z-10">
                            {folder.fileCount > 99 ? '99+' : folder.fileCount}
                          </div>
                        )}
                      </div>
                      
                      <h4 className="font-extrabold text-slate-800 text-sm truncate w-full group-hover:text-[#1FA84A] transition-colors" title={folder.contact.name || folder.contact.number}>
                        {folder.contact.name || folder.contact.number}
                      </h4>
                      <span className="text-[11px] font-medium text-slate-400 mt-1 font-mono tracking-tight">{folder.tickets.length} OS Atribuídas</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ================= VIEW: DENTRO DA PASTA ================= */
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <button 
                onClick={() => setSelectedContactNumber(null)} 
                className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold bg-white px-5 py-2.5 border border-slate-200/80 rounded-xl shadow-sm w-fit transition-colors text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                Voltar para Pastas
              </button>

              <div className="flex items-center gap-5 mb-8">
                {selectedFolder?.contact.profilePictureUrl ? (
                  <img src={selectedFolder.contact.profilePictureUrl} referrerPolicy="no-referrer" className="w-16 h-16 rounded-full object-cover shadow-md border border-slate-100" alt="Perfil" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center font-black text-2xl text-slate-500 shadow-sm border border-slate-300">
                    {(selectedFolder?.contact.name || '?').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-black text-slate-800">{selectedFolder?.contact.name || selectedFolder?.contact.number}</h2>
                  <p className="text-sm font-bold text-slate-500 mt-0.5 font-mono">{selectedFolder?.contact.number}</p>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {selectedFolder?.tickets.map(ticket => (
                  <div key={ticket.id} className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                    
                    {/* CABEÇALHO DO CARD DA OS (Com Correção do overlap da lixeira) */}
                    <div className="bg-slate-50/80 border-b border-slate-100 p-5 flex flex-wrap sm:flex-nowrap justify-between items-start sm:items-center gap-4">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <span className="text-xs font-extrabold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm font-mono tracking-widest shrink-0">
                          OS-{ticket.id.split('-')[0].toUpperCase()}
                        </span>
                        
                        {/* Container Flex Seguro para Badges */}
                        <div className="flex flex-wrap gap-2">
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-widest border ${ticket.isArchived ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                            {ticket.isArchived ? 'Arquivada' : 'Ativa no Kanban'}
                          </span>
                          {(ticket.marca || ticket.modelo) && (
                            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">
                              {ticket.marca} {ticket.modelo}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botão de Excluir OS com shrink-0 para nunca ser esmagado */}
                      <button 
                        onClick={() => handleDeleteTicket(ticket.id)} 
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm shrink-0 ml-auto sm:ml-0"
                        title="Apagar OS Inteira"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                      </button>

                    </div>

                    <div className="p-6">
                      {(!ticket.files || ticket.files.length === 0) ? (
                        <p className="text-sm font-bold text-slate-400 text-center py-6">Sem ficheiros associados a esta OS.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                          {ticket.files.map(file => (
                            <div key={file.id} className="bg-slate-50/50 border border-slate-200/80 rounded-2xl flex flex-col hover:shadow-md hover:-translate-y-1 transition-all group overflow-hidden">
                              
                              <div className="p-5 flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner border border-white/50 ${file.mimeType.includes('image') ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-500' : file.mimeType.includes('pdf') ? 'bg-gradient-to-br from-red-100 to-red-50 text-red-500' : 'bg-gradient-to-br from-slate-200 to-slate-100 text-slate-600'}`}>
                                   {file.mimeType.includes('image') ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" /></svg>
                                    : file.mimeType.includes('pdf') ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" /><path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" /></svg>
                                    : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M19.5 21a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-5.379a.75.75 0 0 1-.53-.22L11.47 3.66A2.25 2.25 0 0 0 9.879 3H4.5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h15Z" clipRule="evenodd" /></svg>}
                                </div>
                                
                                {/* FIX BUG OVERFLOW LONG TEXT */}
                                <div className="flex-1 min-w-0 pr-8">
                                  <h4 className="font-bold text-xs text-slate-800 truncate block w-full" title={file.fileName}>{file.fileName}</h4>
                                  <div className="flex items-center gap-2 mt-0.5 mb-1.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{file.mimeType.split('/')[1] || 'DOC'}</span>
                                    <span className="text-[10px] text-slate-400">•</span>
                                    <span className="text-[10px] text-slate-400 font-mono">{formatSize(file.size)}</span>
                                  </div>
                                  {file.description && (
                                    <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 leading-snug line-clamp-3 shadow-sm" title={file.description}>
                                      {file.description}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Ações (Abrir / Deletar) */}
                                <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-1 shadow-sm rounded-md overflow-hidden border border-slate-100">
                                   <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors" title="Descarregar Arquivo"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg></a>
                                   <button onClick={() => handleDeleteFile(file.id)} className="w-8 h-8 bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors" title="Eliminar Arquivo"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE CONFIRMAÇÃO GERAL (TOAST STYLE) */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setConfirmModal(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-8 text-center bg-gradient-to-b from-white to-slate-50">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">{confirmModal.title}</h3>
              <p className="text-[15px] font-medium text-slate-500 leading-relaxed px-2">{confirmModal.message}</p>
            </div>
            <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button onClick={() => setConfirmModal(null)} className="flex-1 px-5 py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm">Cancelar</button>
              <button onClick={confirmModal.onConfirm} className="flex-1 bg-red-500 text-white px-5 py-3.5 rounded-xl font-bold text-sm hover:bg-red-600 transition-all shadow-md">Sim, Confirmar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}