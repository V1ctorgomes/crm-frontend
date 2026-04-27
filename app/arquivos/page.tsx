'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Search, FolderTree, ChevronRight, FolderOpen, 
  FileBox, Image as ImageIcon, FileText, File, 
  UploadCloud, ExternalLink, Trash2, AlertTriangle, Loader2 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface TicketFile {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  description?: string;
  createdAt: string;
}

interface TicketFolder {
  id: string;
  marca: string;
  modelo: string;
  createdAt: string;
  isArchived: boolean;
  resolution?: string;
  resolutionReason?: string;
  files: TicketFile[];
}

interface CustomerFolder {
  contact: {
    number: string;
    name: string;
    profilePictureUrl?: string;
  };
  tickets: TicketFolder[];
}

export default function ArquivosPage() {
  const [customerFolders, setCustomerFolders] = useState<CustomerFolder[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerFolder | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketFolder | null>(null);
  
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  const [folderSearchTerm, setFolderSearchTerm] = useState('');

  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const res = await fetch(`${baseUrl}/tickets/folders`);
      if (res.ok) {
        const data = await res.json();
        setCustomerFolders(data);
        
        if (selectedCustomer) {
          const updatedCustomer = data.find((c: CustomerFolder) => c.contact.number === selectedCustomer.contact.number);
          setSelectedCustomer(updatedCustomer || null);
          if (selectedTicket && updatedCustomer) {
            const updatedTicket = updatedCustomer.tickets.find((t: TicketFolder) => t.id === selectedTicket.id);
            setSelectedTicket(updatedTicket || null);
          }
        }
      }
    } catch (error) {
      showFeedback('error', 'Erro ao carregar arquivos da nuvem.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { showFeedback('error', "Arquivo muito grande (máx 15MB)."); return; }
    setPendingFile(file);
    setFileDescription('');
  };

  const confirmUpload = async () => {
    if (!pendingFile || !selectedTicket) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', pendingFile);
    if (fileDescription.trim()) formData.append('description', fileDescription.trim());

    try {
      const res = await fetch(`${baseUrl}/tickets/${selectedTicket.id}/files`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setPendingFile(null);
        setFileDescription('');
        await fetchFolders();
        showFeedback('success', "Arquivo anexado com sucesso!");
      } else {
        showFeedback('error', "Erro ao enviar ficheiro.");
      }
    } catch (error) {
      showFeedback('error', "Erro de conexão ao enviar.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const cancelUpload = () => {
    setPendingFile(null);
    setFileDescription('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteFile = async (fileId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Apagar Arquivo?",
      message: "Tem a certeza que deseja apagar este ficheiro? Ação irreversível.",
      onConfirm: async () => {
        try {
          const res = await fetch(`${baseUrl}/tickets/files/${fileId}`, { method: 'DELETE' });
          if (res.ok) {
            await fetchFolders();
            showFeedback('success', "Ficheiro apagado com sucesso.");
          } else {
            showFeedback('error', "Erro ao apagar ficheiro.");
          }
        } catch (error) {
          showFeedback('error', "Erro de conexão.");
        }
        setConfirmModal(null);
      }
    });
  };

  const handleDeleteTicket = async (ticketId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Solicitação?",
      message: "⚠️ Tem a certeza que deseja EXCLUIR PERMANENTEMENTE esta solicitação e todos os seus ficheiros? Esta ação não pode ser desfeita.",
      onConfirm: async () => {
        try {
          const res = await fetch(`${baseUrl}/tickets/${ticketId}`, { method: 'DELETE' });
          if (res.ok) {
            if (selectedTicket?.id === ticketId) setSelectedTicket(null);
            await fetchFolders();
            showFeedback('success', "OS excluída com sucesso.");
          } else {
            showFeedback('error', "Erro ao excluir a OS.");
          }
        } catch (error) {
          showFeedback('error', "Erro de conexão ao excluir.");
        }
        setConfirmModal(null);
      }
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const filteredFolders = customerFolders.filter(folder => {
    if (!folderSearchTerm) return true;
    const term = folderSearchTerm.toLowerCase();
    return (folder.contact.name && folder.contact.name.toLowerCase().includes(term)) ||
           (folder.contact.number && folder.contact.number.includes(term));
  });

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

        <header className="px-6 md:px-8 pt-8 md:pt-10 pb-6 flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 z-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Arquivos & Anexos</h1>
            <p className="text-slate-500 text-sm mt-1">Faça a gestão dos documentos técnicos e imagens das Ordens de Serviço.</p>
          </div>
          
          {!selectedCustomer && (
            <div className="bg-white border border-slate-200 rounded-md flex items-center px-3 h-10 w-full xl:w-[350px] shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input 
                type="text" 
                placeholder="Procurar por cliente ou número..." 
                className="bg-transparent border-none outline-none w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                value={folderSearchTerm}
                onChange={(e) => setFolderSearchTerm(e.target.value)}
              />
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-12 flex flex-col gap-6 no-scrollbar">
          
          {/* NAVEGAÇÃO DE PASTAS */}
          <nav className="flex items-center gap-2 text-sm font-medium animate-in fade-in duration-500">
            <button 
              onClick={() => { setSelectedCustomer(null); setSelectedTicket(null); setPendingFile(null); setFolderSearchTerm(''); }} 
              className={`flex items-center gap-2 transition-all px-3 py-1.5 rounded-md ${!selectedCustomer ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 bg-white border border-slate-200'}`}
            >
              <FolderTree className="w-4 h-4" />
              Raiz
            </button>
            
            {selectedCustomer && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                <button 
                  onClick={() => { setSelectedTicket(null); setPendingFile(null); }} 
                  className={`flex items-center gap-2 transition-all px-3 py-1.5 rounded-md truncate ${!selectedTicket ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 bg-white border border-slate-200'}`}
                >
                  <FolderOpen className="w-4 h-4 shrink-0" />
                  <span className="truncate">{selectedCustomer.contact.name || selectedCustomer.contact.number}</span>
                </button>
              </>
            )}

            {selectedTicket && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                <span className={`flex items-center gap-2 px-3 py-1.5 rounded-md shadow-sm border shrink-0 ${
                  selectedTicket.resolution === 'SUCCESS' ? 'bg-green-50 text-green-700 border-green-200' : 
                  selectedTicket.resolution === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' : 
                  selectedTicket.isArchived ? 'bg-slate-100 text-slate-700 border-slate-200' : 
                  'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  <FileBox className="w-4 h-4" />
                  OS {selectedTicket.id.split('-')[0].toUpperCase()}
                  {selectedTicket.resolution === 'SUCCESS' ? ' (Ganho)' : selectedTicket.resolution === 'CANCELLED' ? ' (Cancelado)' : selectedTicket.isArchived ? ' (Encerrada)' : ''}
                </span>
              </>
            )}
          </nav>

          {/* VISTA 1: LISTA DE CLIENTES */}
          {!selectedCustomer && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-in fade-in duration-500">
              {filteredFolders.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 border-dashed text-center mt-4">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                    <FolderOpen className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700">Nenhuma pasta encontrada.</h3>
                  <p className="text-slate-500 text-sm mt-1 max-w-sm">Os arquivos anexados nas OS aparecerão aqui.</p>
                </div>
              ) : (
                filteredFolders.map(folder => (
                  <div 
                    key={folder.contact.number} 
                    onClick={() => setSelectedCustomer(folder)} 
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col items-center text-center relative"
                  >
                    <div className="relative mb-4 mt-2">
                      <FolderOpen className="w-20 h-20 text-blue-500/90 group-hover:text-blue-500 transition-colors" strokeWidth={1.2} />
                      <div className="absolute -top-1 -right-1 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
                        {folder.tickets.length} {folder.tickets.length === 1 ? 'OS' : 'OS'}
                      </div>
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm truncate w-full" title={folder.contact.name || folder.contact.number}>
                      {folder.contact.name || folder.contact.number}
                    </h3>
                  </div>
                ))
              )}
            </div>
          )}

          {/* VISTA 2: LISTA DE TICKETS DO CLIENTE */}
          {selectedCustomer && !selectedTicket && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-500">
              {selectedCustomer.tickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  className={`bg-white border ${
                    ticket.resolution === 'SUCCESS' ? 'border-green-200 bg-green-50/30 hover:border-green-400' : 
                    ticket.resolution === 'CANCELLED' ? 'border-red-200 bg-red-50/30 hover:border-red-400' : 
                    ticket.isArchived ? 'border-slate-200 bg-slate-50/50' : 
                    'border-slate-200 hover:border-blue-400'
                  } rounded-xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col relative overflow-hidden cursor-pointer`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-start justify-between gap-3 mb-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center border ${
                        ticket.resolution === 'SUCCESS' ? 'bg-green-100 text-green-600 border-green-200' : 
                        ticket.resolution === 'CANCELLED' ? 'bg-red-100 text-red-600 border-red-200' : 
                        ticket.isArchived ? 'bg-slate-100 text-slate-600 border-slate-200' : 
                        'bg-slate-50 text-slate-600 border-slate-200'
                      } group-hover:scale-105 transition-transform`}>
                        <FileBox className="w-5 h-5" />
                      </div>
                      {ticket.isArchived && (
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest border ${
                          ticket.resolution === 'SUCCESS' ? 'bg-green-100 text-green-700 border-green-200' : 
                          ticket.resolution === 'CANCELLED' ? 'bg-red-100 text-red-700 border-red-200' : 
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {ticket.resolution === 'SUCCESS' ? 'Ganho' : ticket.resolution === 'CANCELLED' ? 'Cancelado' : 'Encerrada'}
                        </span>
                      )}
                    </div>
                    
                    {ticket.isArchived && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteTicket(ticket.id); }}
                        className="w-8 h-8 shrink-0 rounded-md bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100"
                        title="Excluir OS Permanentemente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-base">OS {ticket.id.split('-')[0].toUpperCase()}</h3>
                    <p className="text-xs font-medium text-slate-500 mt-1 truncate">{ticket.marca} {ticket.modelo}</p>
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                      <File className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600">{ticket.files.length} {ticket.files.length === 1 ? 'Anexo' : 'Anexos'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VISTA 3: FICHEIROS E UPLOAD */}
          {selectedTicket && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-500">
              
              {pendingFile ? (
                <div className="bg-white border border-blue-200 shadow-sm rounded-xl p-5 flex flex-col md:flex-row gap-4 items-center mb-2">
                  <div className="flex-1 flex items-center gap-3 w-full">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center shrink-0">
                      <File className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <h4 className="font-semibold text-slate-800 text-sm truncate" title={pendingFile.name}>{pendingFile.name}</h4>
                      <span className="text-[11px] font-medium text-slate-500">{formatSize(pendingFile.size)}</span>
                    </div>
                  </div>
                  <div className="flex-[2] w-full min-w-0">
                    <input 
                      type="text" 
                      placeholder="Adicionar legenda descritiva..." 
                      className="w-full bg-white border border-slate-300 rounded-md px-3 h-10 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors placeholder:text-slate-400"
                      value={fileDescription}
                      onChange={e => setFileDescription(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={cancelUpload} className="flex-1 md:flex-none px-4 h-10 rounded-md font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors text-sm">Cancelar</button>
                    <button onClick={confirmUpload} disabled={isUploading} className="flex-1 md:flex-none bg-slate-900 text-white px-5 h-10 rounded-md font-medium text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-70">
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()} 
                  className="w-full bg-white border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 hover:border-blue-400 transition-colors mb-2 group"
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                  <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3 group-hover:text-blue-600 group-hover:bg-white border border-slate-100 shadow-sm transition-all duration-300">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <span className="font-medium text-slate-700 text-sm group-hover:text-blue-700 transition-colors">Clique para anexar um ficheiro</span>
                </div>
              )}

              {selectedTicket.files.length === 0 && !pendingFile ? (
                 <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 border-dashed">
                   <FileBox className="w-12 h-12 text-slate-300 mb-3" strokeWidth={1} />
                   <p className="text-slate-500 font-medium text-sm">Sem anexos ainda.</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {selectedTicket.files.map(file => (
                    <div key={file.id} className="bg-white border border-slate-200 rounded-xl flex flex-col hover:shadow-md transition-all group overflow-hidden relative">
                      <div className="p-4 flex items-start gap-3">
                        <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center border ${file.mimeType.includes('image') ? 'bg-blue-50 border-blue-100 text-blue-600' : file.mimeType.includes('pdf') ? 'bg-red-50 border-red-100 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                           {file.mimeType.includes('image') ? <ImageIcon className="w-5 h-5" />
                            : file.mimeType.includes('pdf') ? <FileText className="w-5 h-5" />
                            : <File className="w-5 h-5" />}
                        </div>
                        
                        <div className="flex-1 min-w-0 pr-6">
                          <h4 className="font-semibold text-sm text-slate-800 truncate" title={file.fileName}>{file.fileName}</h4>
                          <div className="flex items-center gap-2 mt-0.5 mb-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">{file.mimeType.split('/')[1] || 'DOC'}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{formatSize(file.size)}</span>
                          </div>
                        </div>

                        <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-1 rounded-md">
                           <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Abrir/Descarregar"><ExternalLink className="w-4 h-4" /></a>
                           <button onClick={() => handleDeleteFile(file.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>

                      {file.description && (
                        <div className="px-4 pb-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {file.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
        </div>
      </main>

      {/* MODAL DE CONFIRMAÇÃO GERAL */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setConfirmModal(null)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                <AlertTriangle className="w-6 h-6" />
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