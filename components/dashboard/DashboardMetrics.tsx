import React from 'react';
import { Activity, CheckCircle2, XCircle, Target } from 'lucide-react';

interface DashboardMetricsProps {
  totalActiveOS: number;
  totalWonOS: number;
  totalLostOS: number;
  winRate: number;
}

export function DashboardMetrics({ totalActiveOS, totalWonOS, totalLostOS, winRate }: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm p-6 flex flex-col justify-between">
        <div className="flex flex-row items-center justify-between space-y-0 mb-2">
          <h3 className="tracking-tight text-sm font-medium text-slate-500">OS em Andamento</h3>
          <Activity className="h-4 w-4 text-slate-400" />
        </div>
        <div>
          <div className="text-2xl font-bold">{totalActiveOS}</div>
          <p className="text-xs text-slate-500 mt-1">Em processo no funil</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm p-6 flex flex-col justify-between group">
        <div className="flex flex-row items-center justify-between space-y-0 mb-2">
          <h3 className="tracking-tight text-sm font-medium text-slate-500 group-hover:text-green-600 transition-colors">OS Ganhas</h3>
          <CheckCircle2 className="h-4 w-4 text-slate-400 group-hover:text-green-500 transition-colors" />
        </div>
        <div>
          <div className="text-2xl font-bold text-green-700">{totalWonOS}</div>
          <p className="text-xs text-slate-500 mt-1">Serviços concluídos c/ sucesso</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm p-6 flex flex-col justify-between group">
        <div className="flex flex-row items-center justify-between space-y-0 mb-2">
          <h3 className="tracking-tight text-sm font-medium text-slate-500 group-hover:text-red-500 transition-colors">OS Canceladas</h3>
          <XCircle className="h-4 w-4 text-slate-400 group-hover:text-red-400 transition-colors" />
        </div>
        <div>
          <div className="text-2xl font-bold text-red-600">{totalLostOS}</div>
          <p className="text-xs text-slate-500 mt-1">Serviços perdidos ou sem conserto</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm p-6 flex flex-col justify-between group">
        <div className="flex flex-row items-center justify-between space-y-0 mb-2">
          <h3 className="tracking-tight text-sm font-medium text-slate-500 group-hover:text-blue-600 transition-colors">Taxa de Conversão</h3>
          <Target className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
        </div>
        <div>
          <div className="text-2xl font-bold">{winRate}%</div>
          <p className="text-xs text-slate-500 mt-1">Win rate (Ganhas vs Total Fechado)</p>
        </div>
      </div>
    </div>
  );
}