import React from 'react';
import type { Contact } from '@/components/whatsapp/types';
import { CreateTicketModalBody, type CreateTicketModalProps } from './CreateTicketModalBody';

/** Nova OS no WhatsApp: solicitante já definido pelo chat; empresa (cliente) é seleccionada. */
export function CreateTicketModal({
  onClose,
  activeContact,
  formNome,
  formCompanyCnpj,
  formSolicitanteCpf,
  setFormSolicitanteCpf,
  formEmail,
  setFormEmail,
  formMarca,
  setFormMarca,
  formModelo,
  setFormModelo,
  formCustomerType,
  setFormCustomerType,
  formTicketType,
  setFormTicketType,
  formCompanyId,
  onSelectCompany,
  handleCreateTicket,
  ticketCatalog,
}: CreateTicketModalProps) {
  const companies = activeContact.companies || [];
  const catalogReady =
    ticketCatalog &&
    ticketCatalog.MARCA.length > 0 &&
    ticketCatalog.MODELO.length > 0 &&
    ticketCatalog.CUSTOMER_TYPE.length > 0 &&
    ticketCatalog.TICKET_TYPE.length > 0;

  return (
    <div
      className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md flex flex-col border border-slate-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 className="font-semibold text-lg text-brand-950">Nova solicitação (OS)</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Fechar">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <CreateTicketModalBody
          activeContact={activeContact}
          formNome={formNome}
          formCompanyCnpj={formCompanyCnpj}
          formSolicitanteCpf={formSolicitanteCpf}
          setFormSolicitanteCpf={setFormSolicitanteCpf}
          formEmail={formEmail}
          setFormEmail={setFormEmail}
          formMarca={formMarca}
          setFormMarca={setFormMarca}
          formModelo={formModelo}
          setFormModelo={setFormModelo}
          formCustomerType={formCustomerType}
          setFormCustomerType={setFormCustomerType}
          formTicketType={formTicketType}
          setFormTicketType={setFormTicketType}
          formCompanyId={formCompanyId}
          onSelectCompany={onSelectCompany}
          ticketCatalog={ticketCatalog}
        />

        <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 shrink-0">
          <button type="button" onClick={onClose} className="px-4 h-10 rounded-md text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCreateTicket}
            disabled={!catalogReady || (companies.length > 0 && !formCompanyId)}
            className="bg-brand-600 text-white px-4 h-10 rounded-md text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            Criar OS
          </button>
        </div>
      </div>
    </div>
  );
}
