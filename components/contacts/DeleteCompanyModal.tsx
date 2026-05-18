'use client';

import React, { useEffect, useState } from 'react';
import { formatCnpjInput, type Company } from '@/lib/companies';
import { canConfirmDelete, crmUserIsDeveloper } from '@/lib/delete-reason-policy';
import { DeleteReasonFields } from '@/components/ui/delete-reason-fields';

interface DeleteCompanyModalProps {
  company: Company;
  onClose: () => void;
  onConfirm: (deleteReason?: string) => void;
}

export function DeleteCompanyModal({ company, onClose, onConfirm }: DeleteCompanyModalProps) {
  const [reason, setReason] = useState('');
  const skipReason = crmUserIsDeveloper();

  useEffect(() => {
    setReason('');
  }, [company.id]);

  const osCount = company.ticketCount ?? 0;
  const blocked = osCount > 0;
  const canConfirm = blocked ? false : canConfirmDelete(reason);

  const handleEliminar = () => {
    if (blocked || !canConfirm) return;
    onConfirm(skipReason ? undefined : reason.trim());
  };

  return (
    <div
      className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col space-y-2 p-6 pb-4 overflow-y-auto">
          <h3 className="font-semibold tracking-tight text-lg text-brand-950">
            {blocked ? 'Não é possível eliminar' : 'Remover empresa?'}
          </h3>
          {blocked ? (
            <p className="text-sm text-slate-500">
              A empresa <b>{company.legalName}</b> (<span className="font-mono">{formatCnpjInput(company.cnpj)}</span>)
              está vinculada a{' '}
              <b>{osCount === 1 ? '1 ordem de serviço' : `${osCount} ordens de serviço`}</b>
              . Para a boa prática de histórico, só pode ser eliminada quando deixar de existir qualquer OS com esta
              empresa solicitante. Altere ou remova a empresa nessas OS e tente novamente.
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-500">
                Tem a certeza que pretende eliminar <b>{company.legalName}</b> (
                <span className="font-mono">{formatCnpjInput(company.cnpj)}</span>)? Os vínculos a contatos serão
                removidos. Esta ação não afeta OS já existentes (nenhuma está vinculada a esta empresa).
              </p>
              <DeleteReasonFields value={reason} onChange={setReason} id="delete-company-reason" />
            </>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 p-6 pt-0 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-brand-950 h-10 px-4 py-2"
          >
            {blocked ? 'Fechar' : 'Cancelar'}
          </button>
          {!blocked && (
            <button
              type="button"
              disabled={!canConfirm}
              onClick={handleEliminar}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700 h-10 px-4 py-2 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
