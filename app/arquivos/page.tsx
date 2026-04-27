'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { Toast } from '@/components/ui/toast'; // Reutilizamos o Toast global criado nas páginas anteriores
import { CustomerFolder, TicketFolder } from '@/components/arquivos/types';
import { ArquivosHeader } from '@/components/arquivos/ArquivosHeader';
import { ArquivosBreadcrumb } from '@/components/arquivos/ArquivosBreadcrumb';
import { CustomerFoldersGrid } from '@/components/arquivos/CustomerFoldersGrid';
import { TicketFoldersGrid } from '@/components/arquivos/TicketFoldersGrid';
import { FilesViewer } from '@/components/arquivos/FilesViewer';
import { DeleteConfirmModal } from '@/components/arquivos/DeleteConfirmModal';

export const dynamic = 'force-dynamic';

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

  // Estados dos Modais
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void; } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

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

  useEffect(() => { fetchFolders(); }, []);

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
        
        {toast && <Toast type={toast.type} message={toast.message} />}

        <ArquivosHeader 
          selectedCustomer={selectedCustomer}
          folderSearchTerm={folderSearchTerm}
          setFolderSearchTerm={setFolderSearchTerm}
        />

        <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-12 flex flex-col gap-6 no-scrollbar">
          
          <ArquivosBreadcrumb 
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            selectedTicket={selectedTicket}
            setSelectedTicket={setSelectedTicket}
            setPendingFile={setPendingFile}
            setFolderSearchTerm={setFolderSearchTerm}
          />

          {!selectedCustomer && (
            <CustomerFoldersGrid 
              filteredFolders={filteredFolders}
              setSelectedCustomer={setSelectedCustomer}
            />
          )}

          {selectedCustomer && !selectedTicket && (
            <TicketFoldersGrid 
              selectedCustomer={selectedCustomer}
              setSelectedTicket={setSelectedTicket}
              handleDeleteTicket={handleDeleteTicket}
            />
          )}

          {selectedTicket && (
            <FilesViewer 
              selectedTicket={selectedTicket}
              pendingFile={pendingFile}
              fileDescription={fileDescription}
              setFileDescription={setFileDescription}
              isUploading={isUploading}
              fileInputRef={fileInputRef}
              handleFileSelect={handleFileSelect}
              cancelUpload={cancelUpload}
              confirmUpload={confirmUpload}
              handleDeleteFile={handleDeleteFile}
            />
          )}
          
        </div>
      </main>

      {confirmModal && (
        <DeleteConfirmModal 
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal(null)}
        />
      )}

    </div>
  );
}