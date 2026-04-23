'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';

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
  isArchived: boolean; // NOVO CAMPO
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
      console.error('Erro ao buscar pastas', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { alert("Arquivo muito grande (máx 15MB)."); return; }
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
      } else {
        alert("Erro ao enviar ficheiro.");
      }
    } catch (error) {
      alert("Erro de conexão.");
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
    if (!confirm("Tem certeza que deseja apagar este ficheiro?")) return;
    
    try {
      const res = await fetch(`${baseUrl}/tickets/files/${fileId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchFolders();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // NOVO: Função para excluir a OS arquivada
  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("⚠️ Tem a certeza que deseja EXCLUIR PERMANENTEMENTE esta solicitação e todos os seus ficheiros? Esta ação não pode ser desfeita.")) return;
    
    try {
      const res = await fetch(`${baseUrl}/tickets/${ticketId}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedTicket?.id === ticketId) setSelectedTicket(null);
        await fetchFolders();
      } else {
        alert("Erro ao excluir a OS.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao excluir.");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full overflow-hidden">
        
        <div className="h-[76px] bg-white border-b border-slate-200 flex items-center px-8 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3 text-slate-600 font-medium">
            <button onClick={() => { setSelectedCustomer(null); setSelectedTicket(null); setPendingFile(null); }} className={`flex items-center gap-2 hover:text-[#1FA84A] transition-colors ${!selectedCustomer ? 'text-[#1FA84A] font-bold' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" /></svg>
              Raiz
            </button>
            
            {selectedCustomer && (
              <>
                <span className="text-slate-300">/</span>
                <button onClick={() => { setSelectedTicket(null); setPendingFile(null); }} className={`hover:text-[#1FA84A] transition-colors ${!selectedTicket ? 'text-[#1FA84A] font-bold' : ''}`}>
                  {selectedCustomer.contact.name || selectedCustomer.contact.number}
                </button>
              </>
            )}

            {selectedTicket && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-[#1FA84A] font-bold">
                  OS {selectedTicket.id.split('-')[0].toUpperCase()} 
                  {selectedTicket.isArchived && " (Arquivada)"}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            
            {!selectedCustomer && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {customerFolders.length === 0 && <div className="col-span-full text-center text-slate-400 py-10">Nenhuma solicitação encontrada.</div>}
                
                {customerFolders.map(folder => (
                  <div key={folder.contact.number} onClick={() => setSelectedCustomer(folder)} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-[#1FA84A]/30 transition-all cursor-pointer group flex flex-col items-center text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-20 h-20 text-yellow-400 group-hover:scale-105 transition-transform drop-shadow-sm mb-4"><path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" /></svg>
                    <h3 className="font-bold text-slate-800 text-[15px] truncate w-full">{folder.contact.name || folder.contact.number}</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">{folder.tickets.length} {folder.tickets.length === 1 ? 'OS' : 'OSs'}</p>
                  </div>
                ))}
              </div>
            )}

            {/* NOVO: Pastas das OS (Com cores e botão excluir para arquivadas) */}
            {selectedCustomer && !selectedTicket && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedCustomer.tickets.map(ticket => (
                  <div 
                    key={ticket.id} 
                    className={`bg-white border ${ticket.isArchived ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 hover:border-blue-400/50'} rounded-2xl p-6 hover:shadow-lg transition-all group flex items-center gap-4 relative overflow-hidden cursor-pointer`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-16 h-16 ${ticket.isArchived ? 'text-amber-400' : 'text-blue-500'} group-hover:scale-105 transition-transform shrink-0`}><path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" /></svg>
                    <div className="flex-1 overflow-hidden pr-10">
                      <h3 className="font-bold text-slate-800 text-sm truncate flex items-center gap-2">
                        OS {ticket.id.split('-')[0].toUpperCase()}
                        {ticket.isArchived && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Arquivada</span>}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 mt-1 truncate">{ticket.marca} {ticket.modelo}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{ticket.files.length} {ticket.files.length === 1 ? 'arquivo' : 'arquivos'}</p>
                    </div>

                    {/* Botão de Excluir APENAS para OS Arquivadas */}
                    {ticket.isArchived && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteTicket(ticket.id); }}
                        className="absolute right-4 w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
                        title="Excluir OS e Arquivos Permanentemente"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedTicket && (
              <div className="flex flex-col h-full gap-6">
                
                {pendingFile ? (
                  <div className="bg-[#e8f6ea] border border-[#1FA84A]/30 rounded-3xl p-6 flex flex-col gap-4 animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#1FA84A] text-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-slate-800 truncate">{pendingFile.name}</h4>
                        <span className="text-xs text-slate-500">{formatSize(pendingFile.size)}</span>
                      </div>
                    </div>
                    
                    <input 
                      type="text" 
                      placeholder="Adicionar nota ou descrição a este arquivo (Opcional)" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1FA84A] shadow-sm"
                      value={fileDescription}
                      onChange={e => setFileDescription(e.target.value)}
                      autoFocus
                    />
                    
                    <div className="flex justify-end gap-3 mt-2">
                      <button onClick={cancelUpload} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200/50 transition-colors text-sm">Cancelar</button>
                      <button onClick={confirmUpload} disabled={isUploading} className="bg-[#1FA84A] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-green-600 shadow-sm transition-colors flex items-center gap-2">
                        {isUploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : null}
                        {isUploading ? 'A Enviar...' : 'Confirmar e Enviar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current?.click()} className="w-full bg-white border-2 border-dashed border-slate-300 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-[#1FA84A] transition-colors group">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                    <div className="w-16 h-16 bg-[#e8f6ea] text-[#1FA84A] rounded-full flex items-center justify-center mb-4 group-hover:-translate-y-1 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>
                    </div>
                    <span className="font-bold text-slate-700 text-lg">Anexar Novo Documento</span>
                    <span className="text-slate-400 text-sm mt-1">Clique para procurar no seu computador</span>
                  </div>
                )}

                <div>
                  <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">Documentos Guardados <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{selectedTicket.files.length}</span></h3>
                  
                  {selectedTicket.files.length === 0 ? (
                     <div className="bg-white border border-slate-100 rounded-2xl p-10 flex flex-col items-center text-center shadow-sm">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-20 h-20 text-slate-200 mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                       <p className="text-slate-500 font-medium">Nenhum ficheiro anexado a esta OS ainda.</p>
                     </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {selectedTicket.files.map(file => (
                        <div key={file.id} className="bg-white border border-slate-200 p-4 rounded-2xl flex items-start gap-4 hover:shadow-md transition-shadow group relative overflow-hidden">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${file.mimeType.includes('image') ? 'bg-blue-50 text-blue-500' : file.mimeType.includes('pdf') ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
                             {file.mimeType.includes('image') ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" /></svg>
                              : file.mimeType.includes('pdf') ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" /><path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" /></svg>
                              : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path fillRule="evenodd" d="M19.5 21a3 3 0 003-3V9a3 3 0 00-3-3h-5.379a.75.75 0 01-.53-.22L11.47 3.66A2.25 2.25 0 009.879 3H4.5a3 3 0 00-3 3v12a3 3 0 003 3h15z" clipRule="evenodd" /></svg>}
                          </div>
                          <div className="flex-1 min-w-0 pr-8">
                            <h4 className="font-bold text-sm text-slate-800 truncate" title={file.fileName}>{file.fileName}</h4>
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
                          
                          <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-1">
                             <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg></a>
                             <button onClick={() => handleDeleteFile(file.id)} className="w-7 h-7 rounded bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}