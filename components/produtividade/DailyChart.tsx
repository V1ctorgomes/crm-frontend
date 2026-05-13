'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DailyPoint } from './types';

interface DailyChartProps {
  data: DailyPoint[];
  isLoading: boolean;
}

const MESES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const;

function axisLabelFromDateKey(key: string): string {
  const [, m, d] = key.split('-');
  const mi = Number(m);
  if (!mi || !d) return key;
  return `${d} ${MESES_CURTO[mi - 1]}`;
}

export function DailyChart({ data, isLoading }: DailyChartProps) {
  const chartData = useMemo(
    () => data.map((p) => ({ ...p, label: axisLabelFromDateKey(p.date) })),
    [data],
  );

  const hasData = chartData.some(
    (p) => p.messagesSent > 0 || p.ticketsCreated > 0 || p.ticketsArchived > 0,
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white text-brand-950 shadow-sm overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-950">Atividade diária</h3>
        <span className="text-[11px] font-medium text-slate-500">{chartData.length} dias</span>
      </div>
      <div className="p-4 h-72">
        {isLoading ? (
          <div className="h-full flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-500 text-sm">A carregar série…</span>
          </div>
        ) : !hasData ? (
          <div className="h-full flex items-center justify-center">
            <span className="text-slate-500 text-sm">Sem atividade no período.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                interval="preserveStartEnd"
                minTickGap={20}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} width={32} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                labelStyle={{ fontWeight: 600, color: '#0c1a0f' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="messagesSent"
                name="Mensagens enviadas"
                stroke="#1fa634"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="ticketsCreated"
                name="OS criadas"
                stroke="#0284c7"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="ticketsArchived"
                name="OS fechadas"
                stroke="#7c3aed"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
