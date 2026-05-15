import React from 'react';
import { formatCnpjInput, type Company } from '@/lib/companies';

interface DeleteCompanyModalProps {
  company: Company;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteCompanyModal({ company, onClose, onConfirm }: DeleteCompanyModalProps) {
  return (
    <div className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex flex-col space-y-2 p-6 pb-4">
          <h3 className="font-semibold tracking-tight text-lg text-brand-950">Remover empresa?</h3>
          <p className="text-sm text-slate-500">
            Tem a certeza que pretende eliminar <b>{company.legalName}</b> (<span className="font-mono">{formatCnpjInput(company.cnpj)}</span>)? Todos os vínculos a contatos serão removidos e as OS existentes deixarão de mostrar esta empresa.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 p-6 pt-0">
          <button onClick={onClose} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-brand-950 h-10 px-4 py-2">
            Cancelar
          </button>
          <button onClick={onConfirm} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700 h-10 px-4 py-2 shadow-sm">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
