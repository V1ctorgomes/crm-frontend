'use client';

import React from 'react';

export interface TrendData {
  month: string;
  dayLong: string;
  ganhas: number;
  perdidas: number;
  andamento: number;
}

export interface RankingData {
  name: string;
  count: number;
}

export interface FunnelData {
  name: string;
  Quantidade: number;
  color?: string;
}

export const BRAND_CHART_PALETTE = ['#148C26', '#1FA634', '#52b86b', '#F2CE1B', '#F2E41D', '#0d5f1a', '#117a21'];

export const SERIES_COLORS = {
  ganhas: '#148C26',
  andamento: '#F2CE1B',
  perdidas: '#ef4444',
} as const;

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  payload?: TrendData;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}

export function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload as TrendData | undefined;
  const title = datum?.dayLong ?? String(label ?? '');
  return (
    <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-slate-200/70 bg-white px-3 py-2.5 text-sm shadow-xl z-50">
      <span className="text-[11px] font-medium text-slate-500 mb-0.5 capitalize">{title}</span>
      {payload.map((entry, index) => {
        const raw = entry.name ?? '';
        const displayLabel =
          raw === 'count' || raw === 'value' ? 'Registos' : raw === 'Quantidade' ? 'Em Fila' : raw;
        return (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-[3px]"
                style={{ backgroundColor: entry.color ?? '#148C26' }}
              />
              <span className="text-slate-700 font-medium">{displayLabel}</span>
            </div>
            <span className="font-bold text-brand-950 tabular-nums">{entry.value}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ChartLegend({ payload }: { payload?: { value: string; color: string }[] }) {
  if (!payload) return null;
  return (
    <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-2">
      {payload.map((entry, index) => (
        <li key={`item-${index}`} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-xs font-medium text-slate-600">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center text-slate-400 text-sm">{message}</div>
  );
}
