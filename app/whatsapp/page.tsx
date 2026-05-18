'use client';

import { useCallback, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Toast } from '@/components/ui/toast';
import { normalizeContactKind } from '@/lib/contact-kind';
import { apiRequest } from '@/lib/api-client';
import { NoInstancesView } from '@/components/whatsapp/NoInstancesView';
import { ContactsSidebar } from '@/components/whatsapp/ContactsSidebar';
import { WhatsAppEmptyChat } from '@/components/whatsapp/WhatsAppEmptyChat';
import { WhatsAppChatPanel } from '@/components/whatsapp/WhatsAppChatPanel';
import { WhatsAppPageModals } from '@/components/whatsapp/WhatsAppPageModals';
import { useWhatsappPage } from './use-whatsapp-page';

export default function WhatsAppPage() {
  const p = useWhatsappPage();
  const { patchContactByNumber, setToast, activeContact } = p;
  const [groupSyncBusy, setGroupSyncBusy] = useState(false);

  const handleSyncGroupProfile = useCallback(async () => {
    const c = activeContact;
    if (!c?.number?.toLowerCase().endsWith('@g.us')) return;
    setGroupSyncBusy(true);
    try {
      const res = await apiRequest<{
        number: string;
        name: string | null;
        profilePictureUrl: string | null;
        updated: boolean;
      }>('/whatsapp/groups/sync-profile', {
        method: 'POST',
        body: JSON.stringify({
          number: c.number,
          instanceName: c.instanceName || undefined,
        }),
      });
      patchContactByNumber(c.number, {
        name: res?.name ?? undefined,
        profilePictureUrl: res?.profilePictureUrl ?? undefined,
      });
      setToast({
        type: 'success',
        message: res?.updated
          ? 'Foto e nome do grupo foram sincronizados com o WhatsApp.'
          : 'Sem alterações novas na Evolution (foto/nome já iguais ou indisponíveis).',
      });
    } catch (e) {
      setToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Erro ao sincronizar o grupo.',
      });
    } finally {
      setGroupSyncBusy(false);
    }
  }, [activeContact, patchContactByNumber, setToast]);

  return (
    <div className="flex h-screen overflow-hidden bg-brand-canvas font-sans">
      <Sidebar />
      <main className="flex-1 flex pt-[60px] md:pt-0 h-full relative overflow-hidden">
        {p.toast && (
          <Toast type={p.toast.type} message={p.toast.message} onDismiss={() => p.setToast(null)} />
        )}

        {p.hasInstances === null ? (
          <div className="flex-1 flex items-center justify-center bg-brand-canvas">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : p.hasInstances === false ? (
          <NoInstancesView />
        ) : (
          <>
            <ContactsSidebar 
              activeContact={p.activeContact}
              customerSearch={p.customerSearch}
              setCustomerSearch={p.setCustomerSearch}
              instances={p.instances}
              selectedInstance={p.selectedInstance}
              onOpenInstanceModal={() => p.setIsInstanceModalOpen(true)}
              onOpenCreateGroup={() => p.setIsCreateGroupOpen(true)}
              filteredActiveContacts={p.filteredActiveContacts}
              filteredNewContacts={p.filteredNewContacts}
              handleSelectContact={p.handleSelectContact}
              startChatWithContact={p.startChatWithContact}
              unreadByContact={p.unreadByContact}
              contactKindFilter={p.contactKindFilter}
              onContactKindFilterChange={p.setContactKindFilter}
              onPushToast={(message, type) => p.setToast({ type, message })}
            />

            <div
              className={`flex-1 flex-col relative bg-brand-canvas overflow-hidden ${!p.activeContact ? 'hidden md:flex' : 'flex'}`}
            >
              {p.activeContact ? (
                <WhatsAppChatPanel
                  activeContact={p.activeContact}
                  openNewTicketModal={() => p.osForm.openFor(p.activeContact!)}
                  isSearchChatOpen={p.isSearchChatOpen}
                  setIsSearchChatOpen={p.setIsSearchChatOpen}
                  chatSearchTerm={p.chatSearchTerm}
                  setChatSearchTerm={p.setChatSearchTerm}
                  onOpenDeleteModal={() => p.setIsDeleteModalOpen(true)}
                  contactKind={normalizeContactKind(p.activeContact.contactKind)}
                  onContactKindChange={(k) => void p.updateActiveContactKind(k)}
                  kindSaving={p.kindSaving}
                  handleSelectContact={p.handleSelectContact}
                  previewFile={p.previewFile}
                  previewUrl={p.previewUrl}
                  cancelPreview={p.cancelPreview}
                  inputText={p.inputText}
                  setInputText={p.setInputText}
                  handleSendMessage={p.handleSendWithRecordingGuard}
                  isSending={p.isSending}
                  filteredMessages={p.filteredMessages}
                  setViewerMessage={p.setViewerMessage}
                  messageListScrollRef={p.messageListScrollRef}
                  messagesEndRef={p.messagesEndRef}
                  onMessageDelete={p.msgActions.handleRequestDeleteMessage}
                  onMessageEditRequest={p.msgActions.handleEditMessageRequest}
                  hasMoreOlder={p.historyMeta[p.activeContact.number]?.hasMoreOlder ?? false}
                  isLoadingOlder={p.isLoadingOlder}
                  onLoadOlder={p.loadOlderMessages}
                  onCancelMediaSend={p.cancelMediaSend}
                  fileInputRef={p.fileInputRef}
                  handleFileUpload={p.handleFileUpload}
                  isRecording={p.recorder.isRecording}
                  recordingTime={p.recorder.recordingTime}
                  startRecording={p.recorder.start}
                  cancelRecording={p.recorder.cancel}
                  stopRecordingAndSend={p.recorder.stopAndSend}
                  groupSyncBusy={groupSyncBusy}
                  onSyncGroupProfile={() => void handleSyncGroupProfile()}
                />
              ) : (
                <WhatsAppEmptyChat />
              )}
            </div>
          </>
        )}
      </main>

      <WhatsAppPageModals
        messagePendingDelete={p.msgActions.messagePendingDelete}
        onCloseDeleteMessage={p.msgActions.dismissDeleteModal}
        onConfirmDeleteMessage={() => void p.msgActions.confirmDeleteSingleMessage()}
        isInstanceModalOpen={p.isInstanceModalOpen}
        onCloseInstanceModal={() => p.setIsInstanceModalOpen(false)}
        instances={p.instances}
        selectedInstance={p.selectedInstance}
        setSelectedInstance={p.setSelectedInstance}
        handleSelectContact={p.handleSelectContact}
        isDeleteModalOpen={p.isDeleteModalOpen}
        onCloseDeleteChat={() => p.setIsDeleteModalOpen(false)}
        onConfirmDeleteChat={() => {
          p.setIsDeleteModalOpen(false);
          void p.confirmDeleteConversation();
        }}
        osModalOpen={p.osForm.isOpen}
        activeContact={p.activeContact}
        ticketCatalog={p.ticketCatalog}
        osFormClose={p.osForm.close}
        osFormNome={p.osForm.formNome}
        osFormCompanyCnpj={p.osForm.formCompanyCnpj}
        osFormSolicitanteCpf={p.osForm.formSolicitanteCpf}
        setOsFormSolicitanteCpf={p.osForm.setFormSolicitanteCpf}
        osFormEmail={p.osForm.formEmail}
        setOsFormEmail={p.osForm.setFormEmail}
        osFormMarca={p.osForm.formMarca}
        setOsFormMarca={p.osForm.setFormMarca}
        osFormModelo={p.osForm.formModelo}
        setOsFormModelo={p.osForm.setFormModelo}
        osFormCustomerType={p.osForm.formCustomerType}
        setOsFormCustomerType={p.osForm.setFormCustomerType}
        osFormTicketType={p.osForm.formTicketType}
        setOsFormTicketType={p.osForm.setFormTicketType}
        osFormCompanyId={p.osForm.formCompanyId}
        onOsCompanyChange={p.osForm.onSelectCompany}
        onSubmitOs={() => {
          if (p.activeContact) void p.osForm.submit(p.activeContact, p.stages);
        }}
        editMessage={p.msgActions.editMessage}
        onCloseEditModal={p.msgActions.closeEditModal}
        editDraft={p.msgActions.editDraft}
        setEditDraft={p.msgActions.setEditDraft}
        editSaving={p.msgActions.editSaving}
        onSaveEdit={() => void p.msgActions.handleSaveEditedMessage()}
        viewerMessage={p.viewerMessage}
        onCloseViewer={() => p.setViewerMessage(null)}
        isCreateGroupOpen={p.isCreateGroupOpen}
        onCloseCreateGroup={() => p.setIsCreateGroupOpen(false)}
        onGroupCreated={(contact) => {
          p.setContacts((prev) => {
            const rest = prev.filter((c) => c.number !== contact.number);
            return [contact, ...rest];
          });
          p.handleSelectContact(contact);
          p.setIsCreateGroupOpen(false);
        }}
        onCreateGroupToast={(type, message) => p.setToast({ type, message })}
      />
    </div>
  );
}
