import React from 'react';
import type { FunnelStage } from './types';

interface FunnelPanelProps {
  funnel: FunnelStage[];
  isLoading: boolean;
}

export function FunnelPanel({ funnel, isLoading }: FunnelPanelProps) {
  const total = funnel.reduce((acc, f) => acc + f.count, 0);
  const max = funnel.reduce((acc, f) => (f.count > acc ? f.count : acc), 0);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white text-brand-950 shadow-sm ring-1 ring-slate-900/[0.03] overflow-hidden flex flex-col h-full min-h-[300px] lg:min-h-[340px]">
      <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-brand-950">Funil — OS abertas por fase</h3>
        <span className="text-[11px] font-medium text-slate-500 tabular-nums">{total} total</span>
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        {isLoading ? (
          <div className="flex items-center gap-3 h-24 justify-center">
            <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-500 text-sm">A carregar funil…</span>
          </div>
        ) : funnel.length === 0 ? (
          <span className="text-slate-500 text-sm text-center py-6">Sem OS abertas para mostrar.</span>
        ) : (
          funnel.map((s) => {
            const pct = max > 0 ? Math.round((s.count / max) * 100) : 0;
            return (
              <div key={s.name} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[12px] font-medium">
                  <span className="flex items-center gap-2 text-slate-700 truncate min-w-0">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="truncate">{s.name}</span>
                  </span>
                  <span className="tabular-nums text-slate-600 shrink-0 ml-2">{s.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: s.color }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
