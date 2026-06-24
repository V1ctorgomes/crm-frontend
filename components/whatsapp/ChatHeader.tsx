import React from 'react';
import { Contact } from './types';
import { CONTACT_KIND_OPTIONS, type ContactKind } from '@/lib/contact-kind';
import { ChatHeaderActions } from './ChatHeaderActions';

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
  groupSyncBusy?: boolean;
  onSyncGroupProfile?: () => void;
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
  groupSyncBusy = false,
  onSyncGroupProfile,
}: ChatHeaderProps) {
  const isWaGroup = activeContact.number.trim().toLowerCase().endsWith('@g.us');
  const displayInitials = (activeContact.name || '?').substring(0, 2).toUpperCase();

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
            {displayInitials}
          </div>
        )}

        <div className="ml-3 overflow-hidden flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-bold text-brand-950 leading-tight truncate">{activeContact.name}</h2>
            {isWaGroup && (
              <span className="shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-800 border border-violet-200">
                Grupo
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 font-mono leading-tight truncate block mt-0.5">
            {isWaGroup
              ? `Classifique o grupo acima (cliente/colaborador) · …${activeContact.number.replace(/\D/g, '').slice(-10)}`
              : activeContact.number}
            {activeContact.instanceName && (
              <span className="ml-2 text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest">
                {activeContact.instanceName}
              </span>
            )}
          </span>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <label htmlFor="wa-contact-kind" className="sr-only">
              Tipo de contato
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

        <ChatHeaderActions
          activeContact={activeContact}
          openNewTicketModal={openNewTicketModal}
          isSearchChatOpen={isSearchChatOpen}
          setIsSearchChatOpen={setIsSearchChatOpen}
          setChatSearchTerm={setChatSearchTerm}
          onOpenDeleteModal={onOpenDeleteModal}
          groupSyncBusy={groupSyncBusy}
          onSyncGroupProfile={onSyncGroupProfile}
        />
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
