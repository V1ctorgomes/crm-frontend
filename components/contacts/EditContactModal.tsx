'use client';

import React from 'react';
import { DeleteConfirmModal } from '@/components/arquivos/DeleteConfirmModal';
import { EditContactFormFields } from './EditContactFormFields';
import { useEditContactForm } from './use-edit-contact-form';
import type { ContactKind } from '@/lib/contact-kind';
import type { Company } from '@/lib/companies';

interface EditContactModalProps {
  contactNumber: string;
  contactName: string;
  editName: string;
  setEditName: (val: string) => void;
  editEmail: string;
  setEditEmail: (val: string) => void;
  editCnpj: string;
  setEditCnpj: (val: string) => void;
  editContactKind: ContactKind;
  setEditContactKind: (val: ContactKind) => void;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;

  linkedCompanies: Company[];
  allCompanies: Company[];
  onLinkCompany: (companyId: string) => void | Promise<void>;
  onUnlinkCompany: (companyId: string, deleteReason?: string) => void | Promise<void>;
  onRequestCreateCompany: (initialLegalName?: string) => void;
  linkBusy: boolean;
  /** Grupo WhatsApp — sem e-mail/CPF nem vínculos a empresas neste modal. */
  isWhatsAppGroup?: boolean;
}

export function EditContactModal({
  contactNumber,
  contactName,
  editName,
  setEditName,
  editEmail,
  setEditEmail,
  editCnpj,
  setEditCnpj,
  editContactKind,
  setEditContactKind,
  isSaving,
  onClose,
  onSave,
  linkedCompanies,
  allCompanies,
  onLinkCompany,
  onUnlinkCompany,
  onRequestCreateCompany,
  linkBusy,
  isWhatsAppGroup = false,
}: EditContactModalProps) {
  const {
    companySearch,
    setCompanySearch,
    unlinkCompany,
    setUnlinkCompany,
    candidates,
  } = useEditContactForm(linkedCompanies, allCompanies);

  return (
    <div
      className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100">
          <h3 className="font-semibold leading-none tracking-tight text-lg">
            {isWhatsAppGroup ? 'Editar grupo' : 'Editar Contato'}
          </h3>
          <p className="text-sm text-slate-500">
            {contactName || (isWhatsAppGroup ? 'Grupo sem nome' : 'Contato sem nome')}{' '}
            <span className="font-mono text-[12px] text-slate-400">· {contactNumber}</span>
          </p>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <EditContactFormFields
            editName={editName}
            setEditName={setEditName}
            editEmail={editEmail}
            setEditEmail={setEditEmail}
            editCnpj={editCnpj}
            setEditCnpj={setEditCnpj}
            editContactKind={editContactKind}
            setEditContactKind={setEditContactKind}
            isWhatsAppGroup={isWhatsAppGroup}
            linkedCompanies={linkedCompanies}
            companySearch={companySearch}
            setCompanySearch={setCompanySearch}
            candidates={candidates}
            linkBusy={linkBusy}
            onLinkCompany={onLinkCompany}
            onRequestCreateCompany={onRequestCreateCompany}
            onRequestUnlink={setUnlinkCompany}
          />
        </div>

        <div className="flex items-center justify-end gap-2 p-6 pt-0 border-t border-slate-100">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-brand-950 h-10 px-4 py-2"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-brand-600 text-white hover:bg-brand-700 h-10 px-4 py-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                A guardar...
              </>
            ) : (
              'Guardar Dados'
            )}
          </button>
        </div>
      </div>

      {unlinkCompany && (
        <DeleteConfirmModal
          title="Desvincular empresa?"
          message={`A empresa «${unlinkCompany.legalName}» deixará de estar vinculada a este contato.`}
          onClose={() => setUnlinkCompany(null)}
          onConfirm={async (deleteReason?: string) => {
            await onUnlinkCompany(unlinkCompany.id, deleteReason);
            setUnlinkCompany(null);
          }}
        />
      )}
    </div>
  );
}
