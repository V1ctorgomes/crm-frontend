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
    <header className="border-b border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80">
      <div className="px-4 sm:px-6 md:px-8 pt-7 md:pt-9 pb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-950 tracking-tight">Monitorização da equipe</h1>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Actividade real no período: WhatsApp, ordens de serviço, notas e tarefas nas solicitações, ficheiros,
            empresas criadas e exclusões na auditoria.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <div className="inline-flex flex-wrap items-center gap-0.5 rounded-xl border border-slate-200/90 bg-white p-1 shadow-sm">
            <CalendarRange className="ml-2 mr-0.5 h-4 w-4 text-slate-400 shrink-0 hidden sm:block" />
            {presets.map((p) => {
              const active = p.value === period;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => onPeriodChange(p.value)}
                  className={`px-3 sm:px-3.5 h-9 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-brand-950'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex h-10 flex-1 sm:flex-none min-w-[7rem] justify-center items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
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
                className="inline-flex h-10 flex-1 sm:flex-none min-w-[7rem] justify-center items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3.5 text-xs font-semibold text-brand-800 hover:bg-brand-100 disabled:opacity-50 transition-colors shadow-sm"
                title="Exportar planilha Excel (.xlsx) com resumo e detalhe por membro"
              >
                <Download className="h-4 w-4" />
                Excel
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
