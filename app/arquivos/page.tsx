'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

interface TicketFile {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface Ticket {
  id: string;
  contactNumber: string;
  createdAt: string;
  files?: TicketFile[];
}

export default function ArquivosPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Feedback (Notificações e Modais)
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; } | null>(null);

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${baseUrl}/tickets/files`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (error) {
      showFeedback('error', 'Erro ao carregar a base de arquivos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleDeleteFile = (fileId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Apagar Arquivo?",
      message: "Tem a certeza que deseja apagar permanentemente este ficheiro da nuvem? Esta ação é irreversível.",
      onConfirm: async () => {
        try {
          const res = await fetch(`${baseUrl}/tickets/files/${fileId}`, { method: 'DELETE' });
          if (res.ok) {
            await fetchFiles();
            showFeedback('success', 'Ficheiro apagado com sucesso.');
          } else {
            showFeedback('error', 'Erro ao remover ficheiro do servidor.');
          }
        } catch (error) { showFeedback('error', 'Erro de conexão.'); }
        setConfirmModal(null);
      }
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Coletar todos os arquivos em um único array
  const allFiles: (TicketFile & { ticketId: string; contactNumber: string })[] = [];
  tickets.forEach(ticket => {
    if (ticket.files) {
      ticket.files.forEach(file => {
        allFiles.push({ ...file, ticketId: ticket.id, contactNumber: ticket.contactNumber });
      });
    }
  });

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

        {/* CABEÇALHO DA PÁGINA */}
        <header className="px-6 md:px-10 pt-8 md:pt-10 pb-4 flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nuvem e Mídia</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Banco de Arquivos</h1>
            <p className="text-slate-500 mt-1 font-medium">Documentos, imagens e PDFs anexados às Ordens de Serviço.</p>
          </div>
        </header>

        {/* CONTEÚDO PRINCIPAL (LAYOUT ORIGINAL RESTAURADO) */}
        <div className="flex-1 overflow-y-auto p-6 md:px-10 pb-20 no-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 mt-10">
              <div className="w-10 h-10 border-4 border-[#1FA84A] border-t-transparent rounded-full animate-spin shadow-sm"></div>
              <span className="text-slate-500 font-bold text-sm">A carregar nuvem...</span>
            </div>
          ) : allFiles.length === 0 ? (
            <div className="text-center mt-20 text-slate-500 font-bold">Nenhum arquivo encontrado na base de dados.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {allFiles.map(file => (
                <div key={file.id} className="bg-white border border-slate-200/80 rounded-2xl flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all group overflow-hidden">
                  
                  <div className="p-5 flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner border border-white/50 ${file.mimeType.includes('image') ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-500' : file.mimeType.includes('pdf') ? 'bg-gradient-to-br from-red-100 to-red-50 text-red-500' : 'bg-gradient-to-br from-slate-200 to-slate-100 text-slate-600'}`}>
                       {file.mimeType.includes('image') ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" /></svg>
                        : file.mimeType.includes('pdf') ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" /><path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" /></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M19.5 21a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-5.379a.75.75 0 0 1-.53-.22L11.47 3.66A2.25 2.25 0 0 0 9.879 3H4.5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h15Z" clipRule="evenodd" /></svg>}
                    </div>
                    
                    {/* FIX BUG OVERFLOW LONG TEXT (NOME DO ARQUIVO) */}
                    <div className="flex-1 min-w-0 pr-10 relative">
                      <h4 className="font-bold text-sm text-slate-800 truncate block w-full" title={file.fileName}>{file.fileName}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{file.mimeType.split('/')[1] || 'DOC'}</span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] text-slate-400 font-mono">{formatSize(file.size)}</span>
                      </div>
                      
                      {/* Ações (Abrir / Deletar) - Posição Absoluta Segura */}
                      <div className="absolute right-0 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-1 shadow-sm rounded-md overflow-hidden border border-slate-100">
                         <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors" title="Descarregar Ficheiro"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg></a>
                         <button onClick={() => handleDeleteFile(file.id)} className="w-8 h-8 bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors" title="Eliminar Ficheiro do Servidor"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 mt-auto flex flex-col gap-1.5 rounded-b-2xl">
                    <div className="flex justify-between items-center text-[10px] font-medium text-slate-500">
                      <span className="tracking-tight">Nº de Contacto:</span>
                      <span className="font-bold font-mono tracking-widest text-slate-800">{file.contactNumber}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-medium text-slate-500">
                      <span className="tracking-tight">ID da OS:</span>
                      <span className="font-bold font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">OS-{file.ticketId.split('-')[0].toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE CONFIRMAÇÃO GERAL */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setConfirmModal(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
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