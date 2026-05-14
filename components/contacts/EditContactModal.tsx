import React from 'react';
import { CONTACT_KIND_OPTIONS, type ContactKind } from '@/lib/contact-kind';

interface EditContactModalProps {
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
}

export function EditContactModal({
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
}: EditContactModalProps) {
  return (
    <div
      className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100">
          <h3 className="font-semibold leading-none tracking-tight text-lg">Editar Registo</h3>
          <p className="text-sm text-slate-500">Atualize as informações do contato.</p>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">Nome do Contato</label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">Correio Eletrónico</label>
            <input
              type="email"
              className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">CNPJ / CPF</label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
              value={editCnpj}
              onChange={(e) => setEditCnpj(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="edit-contact-kind" className="text-sm font-medium leading-none text-slate-700">
              Tipo de contato
            </label>
            <select
              id="edit-contact-kind"
              value={editContactKind}
              onChange={(e) => setEditContactKind(e.target.value as ContactKind)}
              className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
            >
              {CONTACT_KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">Cliente comercial vs colaborador que escreve no mesmo número.</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-6 pt-0">
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
    </div>
  );
}
