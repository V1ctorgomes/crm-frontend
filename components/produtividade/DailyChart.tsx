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

function dayTotal(p: DailyPoint): number {
  return (
    p.messagesSent +
    p.messagesReceived +
    p.mediaMessagesSent +
    p.ticketsCreated +
    p.ticketsArchived +
    p.notesAdded +
    p.tasksCreated +
    p.tasksCompleted +
    p.ticketFilesUploaded +
    p.deletionsRecorded
  );
}

export function DailyChart({ data, isLoading }: DailyChartProps) {
  const chartData = useMemo(
    () => data.map((p) => ({ ...p, label: axisLabelFromDateKey(p.date) })),
    [data],
  );

  const hasData = chartData.some((p) => dayTotal(p) > 0);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white text-brand-950 shadow-sm ring-1 ring-slate-900/[0.03] overflow-hidden flex flex-col h-full min-h-[300px] lg:min-h-[340px]">
      <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-brand-950">Actividade diária (equipe)</h3>
        <span className="text-[11px] font-medium text-slate-500 tabular-nums">{chartData.length} dias</span>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        {isLoading ? (
          <div className="h-[240px] md:h-[280px] flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-500 text-sm">A carregar série…</span>
          </div>
        ) : !hasData ? (
          <div className="h-[240px] md:h-[280px] flex items-center justify-center">
            <span className="text-slate-500 text-sm">Sem atividade no período.</span>
          </div>
        ) : (
          <div className="w-full h-[240px] md:h-[280px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#64748b' }}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} width={36} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }}
                labelStyle={{ fontWeight: 600, color: '#0c1a0f' }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="messagesSent" name="Msg enviadas" stroke="#16a34a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="messagesReceived" name="Msg recebidas" stroke="#0ea5e9" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="ticketsCreated" name="OS criadas" stroke="#d97706" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ticketsArchived" name="OS fechadas" stroke="#7c3aed" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="notesAdded" name="Notas" stroke="#ea580c" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="tasksCompleted" name="Tarefas concl." stroke="#15803d" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="ticketFilesUploaded" name="Ficheiros OS" stroke="#0d9488" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="deletionsRecorded" name="Exclusões" stroke="#dc2626" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
