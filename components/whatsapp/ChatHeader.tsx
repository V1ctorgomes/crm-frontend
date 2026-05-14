import React from 'react';
import { Contact } from './types';
import { CONTACT_KIND_OPTIONS, type ContactKind } from '@/lib/contact-kind';

interface ChatHeaderProps {
  activeContact: Contact;
  handleSelectContact: (contact: Contact | null) => void;
  openNewTicketModal: () => void;
  isSearchChatOpen: boolean;
  setIsSearchChatOpen: (val: boolean) => void;
  chatSearchTerm: string;
  setChatSearchTerm: (val: string) => void;
  onOpenDeleteModal: () => void;
  contactKind: ContactKind;
  onContactKindChange: (kind: ContactKind) => void;
  kindSaving?: boolean;
}

export function ChatHeader({
  activeContact,
  handleSelectContact,
  openNewTicketModal,
  isSearchChatOpen,
  setIsSearchChatOpen,
  chatSearchTerm,
  setChatSearchTerm,
  onOpenDeleteModal,
  contactKind,
  onContactKindChange,
  kindSaving = false,
}: ChatHeaderProps) {
  return (
    <>
      <div className="min-h-[68px] py-2 bg-white border-b border-slate-200 flex flex-wrap sm:flex-nowrap items-center gap-y-2 px-4 md:px-6 shrink-0 z-20">
        <button
          onClick={() => handleSelectContact(null)}
          className="md:hidden text-slate-400 mr-3 hover:text-slate-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        {activeContact.profilePictureUrl ? (
          <img
            src={activeContact.profilePictureUrl}
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
            alt=""
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0 border border-slate-200 text-xs">
            {activeContact.name.substring(0, 2).toUpperCase()}
          </div>
        )}

        <div className="ml-3 overflow-hidden flex-1 min-w-0">
          <h2 className="text-sm font-bold text-brand-950 leading-tight truncate">{activeContact.name}</h2>
          <span className="text-[11px] text-slate-500 font-mono leading-tight truncate block mt-0.5">
            {activeContact.number}
            {activeContact.instanceName && (
              <span className="ml-2 text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest">
                {activeContact.instanceName}
              </span>
            )}
          </span>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <label htmlFor="wa-contact-kind" className="sr-only">
              Tipo de contacto
            </label>
            <select
              id="wa-contact-kind"
              value={contactKind}
              disabled={kindSaving}
              onChange={(e) => onContactKindChange(e.target.value as ContactKind)}
              className="max-w-[min(100%,220px)] rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-brand-950 shadow-sm disabled:opacity-60"
            >
              {CONTACT_KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {kindSaving && <span className="text-[10px] text-slate-400">A guardar…</span>}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
          <button
            onClick={openNewTicketModal}
            className="h-9 px-3 rounded-md flex items-center justify-center bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors text-xs gap-1.5 whitespace-nowrap hidden sm:flex"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Criar OS
          </button>
          <button
            onClick={openNewTicketModal}
            className="w-9 h-9 rounded-md flex items-center justify-center bg-brand-600 text-white hover:bg-brand-700 transition-colors sm:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block" />

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
      </div>

      {isSearchChatOpen && (
        <div className="bg-white px-4 py-2 border-b border-slate-200 flex items-center gap-2 shrink-0 z-10">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Procurar na conversa..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400"
            value={chatSearchTerm}
            onChange={(e) => setChatSearchTerm(e.target.value)}
            autoFocus
          />
          <button
            onClick={() => {
              setIsSearchChatOpen(false);
              setChatSearchTerm('');
            }}
            className="text-slate-500 hover:text-slate-800 text-xs font-medium px-2 py-1 rounded transition-colors"
          >
            Fechar
          </button>
        </div>
      )}
    </>
  );
}
