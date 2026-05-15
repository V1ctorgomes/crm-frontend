'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { Toast } from '@/components/ui/toast';
import {
  CompanyFolder,
  CustomerFolder,
  TicketFolder,
} from '@/components/arquivos/types';
import { ArquivosHeader } from '@/components/arquivos/ArquivosHeader';
import { ArquivosBreadcrumb } from '@/components/arquivos/ArquivosBreadcrumb';
import { CompanyFoldersGrid } from '@/components/arquivos/CompanyFoldersGrid';
import { CustomerFoldersGrid } from '@/components/arquivos/CustomerFoldersGrid';
import { TicketFoldersGrid } from '@/components/arquivos/TicketFoldersGrid';
import { FilesViewer } from '@/components/arquivos/FilesViewer';
import { DeleteConfirmModal } from '@/components/arquivos/DeleteConfirmModal';
import { apiRequest } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

/**
 * Página de Arquivos — agora navega em três níveis:
 *  Empresa → Contato → OS → Anexos.
 * O backend devolve `CompanyFolder[]`; o nível de empresa inclui um bucket especial
 * `company: null` para OS sem empresa vinculada (histórico antigo).
 */
export default function ArquivosPage() {
  const [companyFolders, setCompanyFolders] = useState<CompanyFolder[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyFolder | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerFolder | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketFolder | null>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [folderSearchTerm, setFolderSearchTerm] = useState('');

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  const fetchFolders = async () => {
    try {
      const data = await apiRequest<CompanyFolder[]>('/tickets/folders');
      const safe = Array.isArray(data) ? data : [];
      setCompanyFolders(safe);

      if (selectedCompany) {
        const updatedCompany =
          safe.find((c) => (c.company?.id || '__no_company__') === (selectedCompany.company?.id || '__no_company__')) ||
          null;
        setSelectedCompany(updatedCompany);
        if (selectedCustomer && updatedCompany) {
          const updatedCustomer =
            updatedCompany.contacts.find((c) => c.contact.number === selectedCustomer.contact.number) || null;
          setSelectedCustomer(updatedCustomer);
          if (selectedTicket && updatedCustomer) {
            const updatedTicket = updatedCustomer.tickets.find((t) => t.id === selectedTicket.id) || null;
            setSelectedTicket(updatedTicket);
          } else {
            setSelectedTicket(null);
          }
        } else {
          setSelectedCustomer(null);
          setSelectedTicket(null);
        }
      }
    } catch {
      showFeedback('error', 'Erro ao carregar arquivos da nuvem.');
    }
  };

  useEffect(() => {
    void fetchFolders();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showFeedback('error', 'Arquivo muito grande (máx 15MB).');
      return;
    }
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
      await apiRequest(`/tickets/${selectedTicket.id}/files`, {
        method: 'POST',
        body: formData,
      });

      setPendingFile(null);
      setFileDescription('');
      await fetchFolders();
      showFeedback('success', 'Arquivo anexado com sucesso!');
    } catch {
      showFeedback('error', 'Erro de conexão ao enviar.');
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
      title: 'Apagar Arquivo?',
      message: 'Tem a certeza que deseja apagar este ficheiro? Ação irreversível.',
      onConfirm: async () => {
        try {
          await apiRequest(`/tickets/files/${fileId}`, { method: 'DELETE' });
          await fetchFolders();
          showFeedback('success', 'Ficheiro apagado com sucesso.');
        } catch {
          showFeedback('error', 'Erro de conexão.');
        }
        setConfirmModal(null);
      },
    });
  };

  const handleDeleteTicket = async (ticketId: string) => {
    setConfirmModal({
      title: 'Excluir Solicitação?',
      message:
        '⚠️ Tem a certeza que deseja EXCLUIR PERMANENTEMENTE esta solicitação e todos os seus ficheiros? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        try {
          await apiRequest(`/tickets/${ticketId}`, { method: 'DELETE' });
          if (selectedTicket?.id === ticketId) setSelectedTicket(null);
          await fetchFolders();
          showFeedback('success', 'OS excluída com sucesso.');
        } catch {
          showFeedback('error', 'Erro de conexão ao excluir.');
        }
        setConfirmModal(null);
      },
    });
  };

  const filteredCompanies = useMemo(() => {
    if (!folderSearchTerm.trim()) return companyFolders;
    const term = folderSearchTerm.trim().toLowerCase();
    return companyFolders.filter((c) => {
      if (!c.company) return 'sem empresa'.includes(term);
      const haystack = [
        c.company.legalName,
        c.company.tradeName || '',
        c.company.cnpj,
        c.company.cnpj.replace(/\D/g, ''),
      ];
      return haystack.some((s) => s.toLowerCase().includes(term));
    });
  }, [companyFolders, folderSearchTerm]);

  const filteredContacts = useMemo(() => {
    if (!selectedCompany) return [];
    if (!folderSearchTerm.trim()) return selectedCompany.contacts;
    const term = folderSearchTerm.trim().toLowerCase();
    return selectedCompany.contacts.filter(
      (f) =>
        (f.contact.name && f.contact.name.toLowerCase().includes(term)) ||
        (f.contact.number && f.contact.number.includes(term)),
    );
  }, [selectedCompany, folderSearchTerm]);

  const showSearch = !selectedCustomer; // raiz (empresas) e dentro de empresa (contatos)
  const searchPlaceholder = !selectedCompany
    ? 'Procurar por empresa, nome fantasia ou CNPJ...'
    : 'Procurar por contato ou número...';

  return (
    <div className="flex h-screen overflow-hidden bg-brand-canvas font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden">
        {toast && (
          <Toast type={toast.type} message={toast.message} onDismiss={() => setToast(null)} />
        )}

        <ArquivosHeader
          showSearch={showSearch}
          searchPlaceholder={searchPlaceholder}
          folderSearchTerm={folderSearchTerm}
          setFolderSearchTerm={setFolderSearchTerm}
        />

        <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-12 flex flex-col gap-6 no-scrollbar">
          <ArquivosBreadcrumb
            selectedCompany={selectedCompany}
            setSelectedCompany={(c) => {
              setSelectedCompany(c);
              setFolderSearchTerm('');
            }}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            selectedTicket={selectedTicket}
            setSelectedTicket={setSelectedTicket}
            setPendingFile={setPendingFile}
            setFolderSearchTerm={setFolderSearchTerm}
          />

          {!selectedCompany && (
            <CompanyFoldersGrid
              filteredFolders={filteredCompanies}
              setSelectedCompany={(c) => {
                setSelectedCompany(c);
                setFolderSearchTerm('');
              }}
            />
          )}

          {selectedCompany && !selectedCustomer && (
            <CustomerFoldersGrid
              filteredFolders={filteredContacts}
              setSelectedCustomer={(c) => {
                setSelectedCustomer(c);
                setFolderSearchTerm('');
              }}
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
