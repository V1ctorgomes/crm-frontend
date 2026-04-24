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
  isArchived: boolean;
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
    if (!confirm("Tem a certeza que deseja apagar este ficheiro?")) return;
    
    try {
      const res = await fetch(`${baseUrl}/tickets/files/${fileId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchFolders();
      }
    } catch (error) {
      console.error(error);
    }
  };

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
    <div className="flex h-screen bg-[#f4f7f6] font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full overflow-hidden">
        
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-7xl mx-auto">
            
            {/* CABEÇALHO DA PÁGINA COM BREADCRUMBS INTEGRADOS */}
            <header className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nuvem de Documentos</span>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight">Arquivos & Anexos</h1>
                  <p className="text-slate-500 mt-1 font-medium">Faça a gestão dos documentos técnicos e imagens das Ordens de Serviço.</p>
                </div>
              </div>

              {/* BREADCRUMBS NAVIGATION (Integrado como pílula) */}
              <nav className="inline-flex items-center text-sm font-bold text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap bg-white border border-slate-200/80 p-1.5 rounded-xl shadow-sm">
                <button 
                  onClick={() => { setSelectedCustomer(null); setSelectedTicket(null); setPendingFile(null); }} 
                  className={`flex items-center gap-2 transition-all px-3 py-1.5 rounded-lg ${!selectedCustomer ? 'bg-[#e8f6ea] text-[#1FA84A] shadow-sm' : 'hover:bg-slate-100 hover:text-slate-800'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" /></svg>
                  Raiz
                </button>
                
                {selectedCustomer && (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 mx-1 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                    <button 
                      onClick={() => { setSelectedTicket(null); setPendingFile(null); }} 
                      className={`flex items-center gap-2 transition-all px-3 py-1.5 rounded-lg ${!selectedTicket ? 'bg-blue-50 text-blue-600 shadow-sm' : 'hover:bg-slate-100 hover:text-slate-800'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" /><path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" /></svg>
                      {selectedCustomer.contact.name || selectedCustomer.contact.number}
                    </button>
                  </>
                )}

                {selectedTicket && (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 mx-1 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                    <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-sm ${selectedTicket.isArchived ? 'bg-amber-100 text-amber-700' : 'bg-[#e8f6ea] text-[#1FA84A]'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501-.002.002a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.52 9.52l3.45-3.451a.75.75 0 1 1 1.061 1.06l-3.45 3.451a1.125 1.125 0 0 0 1.587 1.595l3.454-3.553a3 3 0 0 0 0-4.242Z" clipRule="evenodd" /></svg>
                      OS {selectedTicket.id.split('-')[0].toUpperCase()}
                      {selectedTicket.isArchived && " (Arquivada)"}
                    </span>
                  </>
                )}
              </nav>
            </header>

            {/* VISTA 1: LISTA DE CLIENTES */}
            {!selectedCustomer && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {customerFolders.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-slate-200/80 border-dashed text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">O seu Drive está vazio.</h3>
                    <p className="text-slate-500 text-sm mt-1 max-w-sm">Os arquivos anexados nos tickets de atendimento aparecerão aqui organizados por cliente.</p>
                  </div>
                ) : (
                  customerFolders.map(folder => (
                    <div 
                      key={folder.contact.number} 
                      onClick={() => setSelectedCustomer(folder)} 
                      className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-yellow-400/50 transition-all cursor-pointer group flex flex-col items-center text-center relative overflow-hidden"
                    >
                      {/* Efeito de brilho de fundo no hover */}
                      <div className="absolute inset-0 bg-gradient-to-b from-yellow-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-20 h-20 text-yellow-400 group-hover:scale-110 transition-transform drop-shadow-md mb-4"><path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" /></svg>
                        <div className="absolute -bottom-2 -right-2 bg-slate-800 text-white text-[10px] font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                          {folder.tickets.length}
                        </div>
                      </div>
                      
                      <h3 className="font-extrabold text-slate-800 text-[15px] truncate w-full relative z-10">{folder.contact.name || folder.contact.number}</h3>
                      <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest relative z-10">Cliente</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* VISTA 2: LISTA DE PASTAS DAS OS */}
            {selectedCustomer && !selectedTicket && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-800">Ordens de Serviço</h2>
                  <p className="text-sm text-slate-500">Selecione uma OS para visualizar ou anexar ficheiros técnicos.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {selectedCustomer.tickets.map(ticket => (
                    <div 
                      key={ticket.id} 
                      className={`bg-white border ${ticket.isArchived ? 'border-amber-200 bg-gradient-to-br from-amber-50/80 to-white' : 'border-slate-200/80 hover:border-[#1FA84A]/50 hover:bg-gradient-to-br hover:from-[#1FA84A]/5 hover:to-white'} rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all group flex flex-col relative overflow-hidden cursor-pointer`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${ticket.isArchived ? 'bg-amber-100 text-amber-500' : 'bg-[#e8f6ea] text-[#1FA84A]'} group-hover:scale-110 transition-transform`}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875ZM12.75 12a.75.75 0 0 0-1.5 0v2.25a.75.75 0 0 0 1.5 0V12ZM12 16.875a.84.84 0 0 0 0-1.68.84.84 0 0 0 0 1.68Z" clipRule="evenodd" /><path d="M14.25 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963 5.23 5.23 0 0 0-3.434-1.279h-1.875a.375.375 0 0 1-.375-.375V5.25Z" /></svg>
                        </div>
                        {ticket.isArchived && (
                          <span className="bg-amber-100/80 text-amber-700 text-[9px] px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-widest border border-amber-200">Arquivada</span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-extrabold text-slate-800 text-lg">OS {ticket.id.split('-')[0].toUpperCase()}</h3>
                        <p className="text-sm font-medium text-slate-500 mt-0.5 truncate">{ticket.marca} {ticket.modelo}</p>
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
                          <span className="text-xs font-bold text-slate-500">{ticket.files.length} {ticket.files.length === 1 ? 'Anexo' : 'Anexos'}</span>
                        </div>
                      </div>

                      {ticket.isArchived && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteTicket(ticket.id); }}
                          className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white border border-red-100 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                          title="Excluir OS Permanentemente"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VISTA 3: FICHEIROS DA OS */}
            {selectedTicket && (
              <div className="flex flex-col h-full gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
                
                {/* ÁREA DE UPLOAD */}
                {pendingFile ? (
                  <div className="bg-white border border-slate-200/80 shadow-md rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1 flex items-center gap-4 w-full">
                      <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                      </div>
                      <div className="overflow-hidden flex-1">
                        <h4 className="font-extrabold text-slate-800 text-lg truncate">{pendingFile.name}</h4>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">{formatSize(pendingFile.size)}</span>
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
                    
                    <div className="flex gap-3 w-full md:w-auto">
                      <button onClick={cancelUpload} className="flex-1 md:flex-none px-5 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm">Cancelar</button>
                      <button onClick={confirmUpload} disabled={isUploading} className="flex-1 md:flex-none bg-[#1FA84A] text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-green-600 shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                        {isUploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" /></svg>
                        )}
                        {isUploading ? 'A Enviar...' : 'Fazer Upload'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-full bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-[#1FA84A]/5 hover:border-[#1FA84A]/50 hover:shadow-inner transition-all group"
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                    <div className="w-16 h-16 bg-white shadow-sm text-slate-400 rounded-full flex items-center justify-center mb-4 group-hover:-translate-y-2 group-hover:text-[#1FA84A] group-hover:shadow-md transition-all duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" /></svg>
                    </div>
                    <span className="font-extrabold text-slate-700 text-lg group-hover:text-[#1FA84A] transition-colors">Anexar Novo Ficheiro</span>
                    <span className="text-slate-500 text-sm mt-1">Clique ou arraste um documento, imagem ou PDF</span>
                  </div>
                )}

                {/* LISTAGEM DE FICHEIROS */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 text-xl flex items-center gap-3">
                      Anexos Salvos 
                      <span className="bg-slate-800 text-white text-xs px-2.5 py-0.5 rounded-full shadow-sm">{selectedTicket.files.length}</span>
                    </h3>
                  </div>
                  
                  {selectedTicket.files.length === 0 ? (
                     <div className="bg-white border border-slate-200/80 rounded-3xl p-12 flex flex-col items-center text-center shadow-sm">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-20 h-20 text-slate-200 mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                       <p className="text-slate-500 font-bold text-lg">Sem anexos ainda.</p>
                       <p className="text-slate-400 text-sm mt-1">Faça o upload do primeiro ficheiro acima.</p>
                     </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {selectedTicket.files.map(file => (
                        <div key={file.id} className="bg-white border border-slate-200/80 rounded-2xl flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all group overflow-hidden">
                          
                          <div className="p-5 flex items-start gap-4">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-inner border border-white/50 ${file.mimeType.includes('image') ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-500' : file.mimeType.includes('pdf') ? 'bg-gradient-to-br from-red-100 to-red-50 text-red-500' : 'bg-gradient-to-br from-slate-200 to-slate-100 text-slate-600'}`}>
                               {file.mimeType.includes('image') ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" /></svg>
                                : file.mimeType.includes('pdf') ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" /><path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" /></svg>
                                : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path fillRule="evenodd" d="M19.5 21a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-5.379a.75.75 0 0 1-.53-.22L11.47 3.66A2.25 2.25 0 0 0 9.879 3H4.5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h15Z" clipRule="evenodd" /></svg>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm text-slate-800 truncate" title={file.fileName}>{file.fileName}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">{file.mimeType.split('/')[1] || 'DOC'}</span>
                                <span className="text-[10px] text-slate-400 font-mono font-medium">{formatSize(file.size)}</span>
                              </div>
                            </div>
                          </div>

                          {file.description && (
                            <div className="px-5 pb-4 text-[12px] font-medium text-slate-600 line-clamp-2">
                              {file.description}
                            </div>
                          )}
                          
                          <div className="mt-auto border-t border-slate-100 bg-slate-50/50 p-2 flex justify-end gap-1">
                             <a 
                               href={file.fileUrl} 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs text-blue-600 hover:bg-blue-100 transition-colors"
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                               Descarregar
                             </a>
                             <button 
                               onClick={() => handleDeleteFile(file.id)} 
                               className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-100 transition-colors ml-1"
                               title="Excluir Ficheiro"
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                             </button>
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