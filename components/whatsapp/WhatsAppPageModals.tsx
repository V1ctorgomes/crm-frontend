'use client';

import React from 'react';
import type { Contact, Message } from '@/components/whatsapp/types';
import {
  InstanceModal,
  DeleteChatModal,
  DeleteMessageModal,
  CreateTicketModal,
  MediaViewerModal,
  EditMessageModal,
  CreateGroupModal,
} from '@/components/whatsapp/WhatsAppModals';
import type { TicketCatalogOptions } from '@/lib/ticket-catalog-types';
import type { Company } from '@/lib/companies';

export interface WhatsAppPageModalsProps {
  messagePendingDelete: Message | null;
  onCloseDeleteMessage: () => void;
  onConfirmDeleteMessage: (deleteReason?: string) => void | Promise<void>;
  isInstanceModalOpen: boolean;
  onCloseInstanceModal: () => void;
  instances: any[];
  selectedInstance: string;
  setSelectedInstance: React.Dispatch<React.SetStateAction<string>>;
  handleSelectContact: (c: Contact | null) => void;
  isDeleteModalOpen: boolean;
  onCloseDeleteChat: () => void;
  onConfirmDeleteChat: (deleteReason?: string) => void | Promise<void>;
  osModalOpen: boolean;
  activeContact: Contact | null;
  ticketCatalog: TicketCatalogOptions | null;
  osFormClose: () => void;
  osFormNome: string;
  osFormCompanyCnpj: string;
  osFormSolicitanteCpf: string;
  setOsFormSolicitanteCpf: React.Dispatch<React.SetStateAction<string>>;
  osFormEmail: string;
  setOsFormEmail: React.Dispatch<React.SetStateAction<string>>;
  osFormMarca: string;
  setOsFormMarca: React.Dispatch<React.SetStateAction<string>>;
  osFormModelo: string;
  setOsFormModelo: React.Dispatch<React.SetStateAction<string>>;
  osFormCustomerType: string;
  setOsFormCustomerType: React.Dispatch<React.SetStateAction<string>>;
  osFormTicketType: string;
  setOsFormTicketType: React.Dispatch<React.SetStateAction<string>>;
  osFormCompanyId: string;
  onOsCompanyChange: (id: string, companies: Company[]) => void;
  onSubmitOs: () => void;
  editMessage: Message | null;
  onCloseEditModal: () => void;
  editDraft: string;
  setEditDraft: React.Dispatch<React.SetStateAction<string>>;
  editSaving: boolean;
  onSaveEdit: () => void;
  viewerMessage: Message | null;
  onCloseViewer: () => void;
  isCreateGroupOpen: boolean;
  onCloseCreateGroup: () => void;
  onGroupCreated: (contact: Contact) => void;
  onCreateGroupToast: (type: 'success' | 'error', message: string) => void;
}

/** Modais da página WhatsApp agrupados num único sítio (legibilidade da página). */
export function WhatsAppPageModals({
  messagePendingDelete,
  onCloseDeleteMessage,
  onConfirmDeleteMessage,
  isInstanceModalOpen,
  onCloseInstanceModal,
  instances,
  selectedInstance,
  setSelectedInstance,
  handleSelectContact,
  isDeleteModalOpen,
  onCloseDeleteChat,
  onConfirmDeleteChat,
  osModalOpen,
  activeContact,
  ticketCatalog,
  osFormClose,
  osFormNome,
  osFormCompanyCnpj,
  osFormSolicitanteCpf,
  setOsFormSolicitanteCpf,
  osFormEmail,
  setOsFormEmail,
  osFormMarca,
  setOsFormMarca,
  osFormModelo,
  setOsFormModelo,
  osFormCustomerType,
  setOsFormCustomerType,
  osFormTicketType,
  setOsFormTicketType,
  osFormCompanyId,
  onOsCompanyChange,
  onSubmitOs,
  editMessage,
  onCloseEditModal,
  editDraft,
  setEditDraft,
  editSaving,
  onSaveEdit,
  viewerMessage,
  onCloseViewer,
  isCreateGroupOpen,
  onCloseCreateGroup,
  onGroupCreated,
  onCreateGroupToast,
}: WhatsAppPageModalsProps) {
  return (
    <>
      {messagePendingDelete && (
        <DeleteMessageModal
          message={messagePendingDelete}
          onClose={onCloseDeleteMessage}
          onConfirm={onConfirmDeleteMessage}
        />
      )}
      {isInstanceModalOpen && (
        <InstanceModal
          onClose={onCloseInstanceModal}
          instances={instances}
          selectedInstance={selectedInstance}
          setSelectedInstance={setSelectedInstance}
          handleSelectContact={handleSelectContact}
        />
      )}
      {isDeleteModalOpen && (
        <DeleteChatModal onClose={onCloseDeleteChat} onConfirm={onConfirmDeleteChat} />
      )}
      {osModalOpen && activeContact && (
        <CreateTicketModal
          onClose={osFormClose}
          activeContact={activeContact}
          formNome={osFormNome}
          formCompanyCnpj={osFormCompanyCnpj}
          formSolicitanteCpf={osFormSolicitanteCpf}
          setFormSolicitanteCpf={setOsFormSolicitanteCpf}
          formEmail={osFormEmail}
          setFormEmail={setOsFormEmail}
          formMarca={osFormMarca}
          setFormMarca={setOsFormMarca}
          formModelo={osFormModelo}
          setFormModelo={setOsFormModelo}
          formCustomerType={osFormCustomerType}
          setFormCustomerType={setOsFormCustomerType}
          formTicketType={osFormTicketType}
          setFormTicketType={setOsFormTicketType}
          formCompanyId={osFormCompanyId}
          onSelectCompany={(id) => onOsCompanyChange(id, activeContact.companies || [])}
          handleCreateTicket={onSubmitOs}
          ticketCatalog={ticketCatalog}
        />
      )}
      {editMessage && (
        <EditMessageModal
          onClose={onCloseEditModal}
          draft={editDraft}
          setDraft={setEditDraft}
          isSaving={editSaving}
          onSave={onSaveEdit}
        />
      )}
      {viewerMessage && viewerMessage.mediaData && (
        <MediaViewerModal viewerMessage={viewerMessage} onClose={onCloseViewer} />
      )}
      {isCreateGroupOpen && (
        <CreateGroupModal
          open={isCreateGroupOpen}
          onClose={onCloseCreateGroup}
          selectedInstance={selectedInstance}
          instances={instances}
          onCreated={onGroupCreated}
          onToast={onCreateGroupToast}
        />
      )}
    </>
  );
}
