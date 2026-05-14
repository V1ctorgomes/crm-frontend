'use client';

import React from 'react';
import type { Contact, Message } from '@/components/whatsapp/types';
import { ChatHeader } from '@/components/whatsapp/ChatHeader';
import { FilePreview } from '@/components/whatsapp/FilePreview';
import { MessageList } from '@/components/whatsapp/MessageList';
import { ChatInput } from '@/components/whatsapp/ChatInput';
import type { ContactKind } from '@/lib/contact-kind';

export interface WhatsAppChatPanelProps {
  activeContact: Contact;
  openNewTicketModal: () => void;
  isSearchChatOpen: boolean;
  setIsSearchChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  chatSearchTerm: string;
  setChatSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  onOpenDeleteModal: () => void;
  contactKind: ContactKind;
  onContactKindChange: (k: ContactKind) => void;
  kindSaving: boolean;
  handleSelectContact: (c: Contact | null) => void;
  previewFile: File | null;
  previewUrl: string | null;
  cancelPreview: () => void;
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: (e?: React.FormEvent) => void;
  isSending: boolean;
  filteredMessages: Message[];
  setViewerMessage: React.Dispatch<React.SetStateAction<Message | null>>;
  messageListScrollRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onMessageDelete: (msg: Message) => void;
  onMessageEditRequest: (msg: Message) => void;
  hasMoreOlder: boolean;
  isLoadingOlder: boolean;
  onLoadOlder: () => void | Promise<void>;
  onCancelMediaSend: (id: string | number) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isRecording: boolean;
  recordingTime: number;
  startRecording: () => void | Promise<void>;
  cancelRecording: () => void;
  stopRecordingAndSend: () => void;
}

/** Coluna principal: cabeçalho, pré-visualização, lista de mensagens e composer. */
export function WhatsAppChatPanel({
  activeContact,
  openNewTicketModal,
  isSearchChatOpen,
  setIsSearchChatOpen,
  chatSearchTerm,
  setChatSearchTerm,
  onOpenDeleteModal,
  contactKind,
  onContactKindChange,
  kindSaving,
  handleSelectContact,
  previewFile,
  previewUrl,
  cancelPreview,
  inputText,
  setInputText,
  handleSendMessage,
  isSending,
  filteredMessages,
  setViewerMessage,
  messageListScrollRef,
  messagesEndRef,
  onMessageDelete,
  onMessageEditRequest,
  hasMoreOlder,
  isLoadingOlder,
  onLoadOlder,
  onCancelMediaSend,
  fileInputRef,
  handleFileUpload,
  isRecording,
  recordingTime,
  startRecording,
  cancelRecording,
  stopRecordingAndSend,
}: WhatsAppChatPanelProps) {
  return (
    <>
      <ChatHeader
        activeContact={activeContact}
        handleSelectContact={handleSelectContact}
        openNewTicketModal={openNewTicketModal}
        isSearchChatOpen={isSearchChatOpen}
        setIsSearchChatOpen={setIsSearchChatOpen}
        chatSearchTerm={chatSearchTerm}
        setChatSearchTerm={setChatSearchTerm}
        onOpenDeleteModal={onOpenDeleteModal}
        contactKind={contactKind}
        onContactKindChange={onContactKindChange}
        kindSaving={kindSaving}
      />

      {previewFile && previewUrl && (
        <FilePreview
          previewFile={previewFile}
          previewUrl={previewUrl}
          cancelPreview={cancelPreview}
          inputText={inputText}
          setInputText={setInputText}
          handleSendMessage={handleSendMessage}
          isSending={isSending}
        />
      )}

      <MessageList
        key={activeContact.number}
        conversationKey={activeContact.number}
        filteredMessages={filteredMessages}
        chatSearchTerm={chatSearchTerm}
        setViewerMessage={setViewerMessage}
        listScrollRef={messageListScrollRef}
        messagesEndRef={messagesEndRef}
        onMessageDelete={onMessageDelete}
        onMessageEditRequest={onMessageEditRequest}
        hasMoreOlder={hasMoreOlder}
        isLoadingOlder={isLoadingOlder}
        onLoadOlder={onLoadOlder}
        onCancelMediaSend={onCancelMediaSend}
      />

      <ChatInput
        fileInputRef={fileInputRef}
        handleFileUpload={handleFileUpload}
        isRecording={isRecording}
        recordingTime={recordingTime}
        inputText={inputText}
        setInputText={setInputText}
        isSending={isSending}
        previewFile={previewFile}
        startRecording={startRecording}
        cancelRecording={cancelRecording}
        stopRecordingAndSend={stopRecordingAndSend}
        handleSendMessage={handleSendMessage}
      />
    </>
  );
}
