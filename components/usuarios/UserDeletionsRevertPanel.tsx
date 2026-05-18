'use client';

import React from 'react';

export type UserDeletionAuditRow = {
  id: string;
  createdAt: string;
  actorUserId: string;
  actorEmail: string;
  resourceType: string;
  resourceId: string;
  reason: string;
  revertedAt: string | null;
  revertedByUserId: string | null;
  canRevert: boolean;
  revertBlockedReason: string | null;
};

const RESOURCE_LABELS: Record<string, string> = {
  TICKET: 'OS / solicitação',
  TICKET_FILE: 'Ficheiro na OS',
  TICKET_NOTE: 'Nota na OS',
  TICKET_TASK: 'Tarefa na OS',
  TICKET_STAGE: 'Fase (Kanban)',
  USER: 'Utilizador',
  CONTACT: 'Contacto',
  COMPANY: 'Empresa',
  CONTACT_COMPANY_LINK: 'Ligação contacto–empresa',
  INSTANCE: 'Instância WhatsApp',
  WHATSAPP_CONVERSATION: 'Histórico WhatsApp',
  WHATSAPP_MESSAGE: 'Mensagem WhatsApp',
};

function resourceLabel(type: string) {
  return RESOURCE_LABELS[type] ?? type;
}

interface UserDeletionsRevertPanelProps {
  items: UserDeletionAuditRow[];
  isLoading: boolean;
  revertingId: string | null;
  onRevert: (auditId: string) => void;
  onRefresh: () => void;
}

export function UserDeletionsRevertPanel({
  items,
  isLoading,
  revertingId,
  onRevert,
  onRefresh,
}: UserDeletionsRevertPanelProps) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white/90 shadow-sm overflow-hidden">
      <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-brand-950">Exclusões por atendimento</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Apenas exclusões feitas por utilizadores com perfil <strong>Usuario (atendimento)</strong>. Pode{' '}
            <strong>restaurar</strong> cada registo até <strong>24 horas</strong> após a exclusão. Depois disso, o
            botão deixa de estar disponível. Tipos como ficheiros de OS ou conversa WhatsApp completa não têm
            restauração automática na base de dados.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Mensagens WhatsApp: a restauração recria o registo no CRM; no telefone dos clientes a mensagem pode
            continuar apagada.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="shrink-0 px-3 h-9 rounded-md text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Actualizar
        </button>
      </div>

      {isLoading && items.length === 0 ? (
        <div className="p-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="p-8 text-sm text-slate-500 text-center">Nenhuma exclusão registada nos últimos 30 dias.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                <th className="px-4 py-3 whitespace-nowrap">Data</th>
                <th className="px-4 py-3">Quem excluiu</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 max-w-[200px]">Referência</th>
                <th className="px-4 py-3 max-w-[220px]">Motivo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acção</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((row) => {
                const dt = new Date(row.createdAt);
                const dateStr = Number.isNaN(dt.getTime())
                  ? row.createdAt
                  : dt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
                const reverted = !!row.revertedAt;
                return (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">{dateStr}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="block truncate max-w-[180px]" title={row.actorEmail}>
                        {row.actorEmail}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{resourceLabel(row.resourceType)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="line-clamp-2 break-all" title={row.resourceId}>
                        {row.resourceId}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="line-clamp-2" title={row.reason}>
                        {row.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {reverted ? (
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5">
                          Restaurado
                        </span>
                      ) : row.canRevert ? (
                        <span className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-100 rounded px-2 py-0.5">
                          Pode restaurar
                        </span>
                      ) : (
                        <span
                          className="text-xs text-slate-500 block max-w-[200px]"
                          title={row.revertBlockedReason || ''}
                        >
                          {row.revertBlockedReason || '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={!row.canRevert || revertingId !== null}
                        onClick={() => onRevert(row.id)}
                        className="inline-flex items-center justify-center px-3 h-8 rounded-md text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 disabled:pointer-events-none"
                      >
                        {revertingId === row.id ? 'A restaurar…' : 'Restaurar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
