import React from 'react';
import { Contact } from './types';
import { WhatsappPushAlertRow } from '@/components/whatsapp/WhatsappPushAlertRow';
import { type ContactKind, CONTACT_KIND_OPTIONS } from '@/lib/contact-kind';

interface ContactsSidebarProps {
  activeContact: Contact | null;
  customerSearch: string;
  setCustomerSearch: (val: string) => void;
  instances: any[];
  selectedInstance: string;
  onOpenInstanceModal: () => void;
  filteredActiveContacts: Contact[];
  filteredNewContacts: Contact[];
  handleSelectContact: (contact: Contact | null) => void;
  startChatWithContact: (contact: any) => void;
  unreadByContact: Record<string, number>;
  contactKindFilter: 'ALL' | ContactKind;
  onContactKindFilterChange: (v: 'ALL' | ContactKind) => void;
  onPushToast?: (message: string, type: 'success' | 'error') => void;
}

export function ContactsSidebar({
  activeContact, customerSearch, setCustomerSearch, instances, selectedInstance, onOpenInstanceModal, 
  filteredActiveContacts, filteredNewContacts, handleSelectContact, startChatWithContact, unreadByContact,
  contactKindFilter,
  onContactKindFilterChange,
  onPushToast,
}: ContactsSidebarProps) {
  return (
    <div className={`w-full md:w-[320px] flex-col border-r border-slate-200 bg-white shrink-0 z-20 ${activeContact ? 'hidden md:flex' : 'flex'}`}>
      <div className="p-4 border-b border-slate-100 shrink-0 flex flex-col gap-3">
        <div className="flex items-center gap-2 w-full">
          <div className="bg-white border border-slate-200 rounded-md flex items-center px-3 h-10 focus-within:ring-2 focus-within:ring-brand-600/20 focus-within:border-brand-600 transition-all flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
            <input 
              type="text" 
              placeholder="Procurar conversa..." 
              className="bg-transparent border-none outline-none w-full pl-2 text-sm font-medium text-brand-950 placeholder:text-slate-400" 
              value={customerSearch} 
              onChange={e => setCustomerSearch(e.target.value)} 
            />
          </div>
          
          {instances.length > 0 && (
            <button 
              onClick={onOpenInstanceModal}
              className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-brand-950 hover:bg-slate-50 transition-all shrink-0 relative"
              title="Caixas de Entrada"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" /></svg>
              {selectedInstance !== 'ALL' && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-white"></span>}
            </button>
          )}
        </div>
        {onPushToast && <WhatsappPushAlertRow onToast={onPushToast} />}
        <div className="flex items-center gap-2">
          <label htmlFor="wa-sidebar-kind-filter" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
            Tipo
          </label>
          <select
            id="wa-sidebar-kind-filter"
            value={contactKindFilter}
            onChange={(e) => onContactKindFilterChange(e.target.value as 'ALL' | ContactKind)}
            className="flex-1 min-w-0 h-9 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-brand-950 shadow-sm"
          >
            <option value="ALL">Todos</option>
            {CONTACT_KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="crm-thin-scrollbar flex-1 min-h-0 overflow-y-auto bg-white">
        {filteredActiveContacts.map((contact) => (
          <div key={contact.number} className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-slate-50 ${activeContact?.number === contact.number ? 'bg-brand-50/50 border-l-2 border-l-brand-600' : 'hover:bg-slate-50 border-l-2 border-l-transparent'}`} onClick={() => handleSelectContact(contact)}>
            {contact.profilePictureUrl ? (
              <img src={contact.profilePictureUrl} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200" alt="" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0 border border-slate-200 text-xs">
                {(contact.name || '?').substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-center mb-0.5 gap-2 min-w-0">
                <span className="font-semibold text-brand-950 text-sm truncate min-w-0">{contact.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {contact.contactKind && contact.contactKind !== 'UNKNOWN' && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        contact.contactKind === 'INTERNAL'
                          ? 'bg-violet-100 text-violet-800 border border-violet-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {contact.contactKind === 'INTERNAL' ? 'Equipa' : 'Cliente'}
                    </span>
                  )}
                  {(unreadByContact[contact.number] || 0) > 0 && (
                    <span className="min-w-[1.125rem] h-5 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums leading-none">
                      {(unreadByContact[contact.number] || 0) > 99 ? '99+' : unreadByContact[contact.number]}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">{contact.lastMessageTime}</span>
                </div>
              </div>
              <div className="text-xs text-slate-500 truncate">{contact.lastMessage || 'Nova Conversa'}</div>
            </div>
          </div>
        ))}

        {customerSearch && filteredNewContacts.length > 0 && (
          <>
            <div className="px-4 py-2 bg-slate-50 border-y border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky top-0 z-10">
              Base de Dados
            </div>
            {filteredNewContacts.map((customer) => (
              <div key={customer.number} className="flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-slate-50 border-l-2 border-l-transparent hover:bg-slate-50" onClick={() => startChatWithContact(customer)}>
                <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold shrink-0 border border-brand-100 text-xs">
                  {(customer.name || '?').substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="font-semibold text-brand-950 text-sm truncate">{customer.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{customer.number || 'Sem número'}</span>
                </div>
              </div>
            ))}
          </>
        )}

        {customerSearch && filteredActiveContacts.length === 0 && filteredNewContacts.length === 0 && (
          <div className="p-6 text-center text-sm font-medium text-slate-400">Nenhum contato encontrado.</div>
        )}
      </div>
    </div>
  );
}