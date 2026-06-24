'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import { Toast } from '@/components/ui/toast';
import { ArquivosHeader } from '@/components/arquivos/ArquivosHeader';
import { ArquivosBreadcrumb } from '@/components/arquivos/ArquivosBreadcrumb';
import { CompanyFoldersGrid } from '@/components/arquivos/CompanyFoldersGrid';
import { CustomerFoldersGrid } from '@/components/arquivos/CustomerFoldersGrid';
import { TicketFoldersGrid } from '@/components/arquivos/TicketFoldersGrid';
import { FilesViewer } from '@/components/arquivos/FilesViewer';
import { DeleteConfirmModal } from '@/components/arquivos/DeleteConfirmModal';
import { useArquivosPage } from './use-arquivos-page';

export const dynamic = 'force-dynamic';

/**
 * Página de Arquivos — agora navega em três níveis:
 *  Empresa → Contato → OS → Anexos.
 * O backend devolve `CompanyFolder[]`; o nível de empresa inclui um bucket especial
 * `company: null` para OS sem empresa vinculada (histórico antigo).
 */
export default function ArquivosPage() {
  const {
    toast,
    setToast,
    confirmModal,
    setConfirmModal,
    showSearch,
    searchPlaceholder,
    folderSearchTerm,
    setFolderSearchTerm,
    selectedCompany,
    setSelectedCompany,
    selectedCustomer,
    setSelectedCustomer,
    selectedTicket,
    setSelectedTicket,
    setPendingFile,
    filteredCompanies,
    filteredContacts,
    handleDeleteTicket,
    pendingFile,
    fileDescription,
    setFileDescription,
    isUploading,
    fileInputRef,
    handleFileSelect,
    cancelUpload,
    confirmUpload,
    handleDeleteFile,
  } = useArquivosPage();

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
