import React from 'react';
import { CalendarRange, Download, RefreshCw } from 'lucide-react';
import type { PeriodPreset } from './types';

interface ProdutividadeHeaderProps {
  period: PeriodPreset;
  onPeriodChange: (p: PeriodPreset) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  onExportSpreadsheet?: () => void;
  canExport?: boolean;
}

const presets: { value: PeriodPreset; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'mes', label: 'Este mês' },
];

export function ProdutividadeHeader({
  period,
  onPeriodChange,
  isRefreshing,
  onRefresh,
  onExportSpreadsheet,
  canExport = true,
}: ProdutividadeHeaderProps) {
  return (
    <div className="px-6 md:px-8 pt-8 pb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-slate-200">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-brand-950 tracking-tight">Monitorização da equipe</h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          Actividade real no período: WhatsApp (enviadas, recebidas, mídia), OS criadas e fechadas, notas e tarefas
          nas solicitações, ficheiros anexados, empresas criadas e exclusões registadas na auditoria.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <CalendarRange className="ml-2 mr-1 h-4 w-4 text-slate-400 shrink-0" />
          {presets.map((p) => {
            const active = p.value === period;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => onPeriodChange(p.value)}
                className={`px-3 h-8 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  active ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
          title="Recarregar"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Recarregar
        </button>
        {onExportSpreadsheet && (
          <button
            type="button"
            onClick={onExportSpreadsheet}
            disabled={!canExport || isRefreshing}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 text-xs font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-50 transition-colors shadow-sm"
            title="Exportar planilha Excel (.xlsx) com resumo e detalhe por membro"
          >
            <Download className="h-4 w-4" />
            Excel
          </button>
        )}
      </div>
    </div>
  );
}
