import React from 'react';
import { Contact } from './types';
import type { ContactKind } from '@/lib/contact-kind';

interface ChatHeaderActionsProps {
  activeContact: Contact;
  openNewTicketModal: () => void;
  isSearchChatOpen: boolean;
  setIsSearchChatOpen: (val: boolean) => void;
  setChatSearchTerm: (val: string) => void;
  onOpenDeleteModal: () => void;
  groupSyncBusy?: boolean;
  onSyncGroupProfile?: () => void;
}

export function ChatHeaderActions({
  activeContact,
  openNewTicketModal,
  isSearchChatOpen,
  setIsSearchChatOpen,
  setChatSearchTerm,
  onOpenDeleteModal,
  groupSyncBusy = false,
  onSyncGroupProfile,
}: ChatHeaderActionsProps) {
  const isWaGroup = activeContact.number.trim().toLowerCase().endsWith('@g.us');

  return (
    <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
        <button
          type="button"
          disabled={isWaGroup}
          onClick={() => {
            if (!isWaGroup) openNewTicketModal();
          }}
          title={isWaGroup ? 'Criar OS só está disponível em conversas individuais.' : undefined}
          className="h-9 px-3 rounded-md flex items-center justify-center bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors text-xs gap-1.5 whitespace-nowrap hidden sm:flex disabled:opacity-40 disabled:pointer-events-none disabled:hover:bg-brand-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Criar OS
        </button>
        <button
          type="button"
          disabled={isWaGroup}
          onClick={() => {
            if (!isWaGroup) openNewTicketModal();
          }}
          title={isWaGroup ? 'Criar OS só está disponível em conversas individuais.' : undefined}
          className="w-9 h-9 rounded-md flex items-center justify-center bg-brand-600 text-white hover:bg-brand-700 transition-colors sm:hidden disabled:opacity-40 disabled:pointer-events-none disabled:hover:bg-brand-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block" />

        {isWaGroup && onSyncGroupProfile && (
          <button
            type="button"
            disabled={groupSyncBusy}
            onClick={() => onSyncGroupProfile()}
            className="w-9 h-9 rounded-md flex items-center justify-center text-slate-500 hover:bg-violet-50 hover:text-violet-700 transition-colors disabled:opacity-50"
            title="Sincronizar foto e nome do grupo com o WhatsApp"
          >
            {groupSyncBusy ? (
              <span className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-4 h-4">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            )}
          </button>
        )}

        <button
          onClick={() => {
            setIsSearchChatOpen(!isSearchChatOpen);
            setChatSearchTerm('');
          }}
          className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors ${isSearchChatOpen ? 'bg-slate-100 text-brand-950' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}
          title="Pesquisar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </button>

        <button
          onClick={onOpenDeleteModal}
          className="w-9 h-9 rounded-md flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Excluir Conversa"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </button>
    </div>
  );
}
