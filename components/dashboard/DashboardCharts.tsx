'use client';

import React from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
  LabelList,
  Label,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface TrendData {
  month: string;
  dayLong: string;
  ganhas: number;
  perdidas: number;
  andamento: number;
}
interface RankingData {
  name: string;
  count: number;
}
interface FunnelData {
  name: string;
  Quantidade: number;
  color?: string;
}

interface DashboardChartsProps {
  trendData: TrendData[];
  brandRanking: RankingData[];
  funnelData: FunnelData[];
  customerTypeRanking: RankingData[];
  totalCustomers: number;
}

/** Paleta marca: verdes + amarelos secundários, usado em barras coloridas e no donut. */
const BRAND_CHART_PALETTE = ['#148C26', '#1FA634', '#52b86b', '#F2CE1B', '#F2E41D', '#0d5f1a', '#117a21'];

const SERIES_COLORS = {
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

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload as TrendData | undefined;
  const title = datum?.dayLong ?? String(label ?? '');
  return (
    <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-slate-200/70 bg-white px-3 py-2.5 text-sm shadow-xl z-50">
      <span className="text-[11px] font-medium text-slate-500 mb-0.5 capitalize">{title}</span>
      {payload.map((entry, index) => {
        const raw = entry.name ?? '';
        const displayLabel =
          raw === 'count' || raw === 'value'
            ? 'Registos'
            : raw === 'Quantidade'
              ? 'Em Fila'
              : raw;
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

function CustomLegend({ payload }: { payload?: { value: string; color: string }[] }) {
  if (!payload) return null;
  return (
    <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-2">
      {payload.map((entry, index) => (
        <li key={`item-${index}`} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs font-medium text-slate-600">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function DashboardCharts({
  trendData,
  brandRanking,
  funnelData,
  customerTypeRanking,
  totalCustomers,
}: DashboardChartsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Desempenho de Entradas</CardTitle>
            <CardDescription>
              Por dia: em andamento pela data de criação; ganhas e canceladas pela data em que foram arquivadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[268px] w-full">
              {trendData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Sem dados suficientes.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 12, right: 16, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      interval="preserveStartEnd"
                      minTickGap={20}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                    />
                    <Tooltip cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                    <Line
                      type="monotone"
                      name="Ganhas"
                      dataKey="ganhas"
                      stroke={SERIES_COLORS.ganhas}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      name="Em Andamento"
                      dataKey="andamento"
                      stroke={SERIES_COLORS.andamento}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      name="Canceladas"
                      dataKey="perdidas"
                      stroke={SERIES_COLORS.perdidas}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Fabricante</CardTitle>
            <CardDescription>As marcas com maior volume de registos no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {brandRanking.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Aguardando registos.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={brandRanking}
                    margin={{ top: 20, right: 10, left: -25, bottom: 0 }}
                    barCategoryGap="25%"
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tickMargin={12}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickMargin={12}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={42}>
                      {brandRanking.map((_, idx) => (
                        <Cell key={idx} fill={BRAND_CHART_PALETTE[idx % BRAND_CHART_PALETTE.length]} />
                      ))}
                      <LabelList
                        dataKey="count"
                        position="top"
                        offset={8}
                        fill="#0c1a0f"
                        fontSize={11}
                        fontWeight={700}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Carga do Kanban</CardTitle>
            <CardDescription>Gargalos operacionais por etapa no funil ativo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {funnelData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Funil vazio.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={funnelData}
                    margin={{ top: 0, right: 35, left: 0, bottom: 0 }}
                    barCategoryGap="25%"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      tick={{ fill: '#3d5245', fontSize: 12, fontWeight: 500 }}
                      width={110}
                    />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} content={<CustomTooltip />} />
                    <Bar dataKey="Quantidade" radius={[0, 6, 6, 0]} maxBarSize={28}>
                      {funnelData.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={entry.color || BRAND_CHART_PALETTE[idx % BRAND_CHART_PALETTE.length]}
                        />
                      ))}
                      <LabelList
                        dataKey="Quantidade"
                        position="right"
                        offset={8}
                        fill="#0c1a0f"
                        fontSize={12}
                        fontWeight={700}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perfil de Público</CardTitle>
            <CardDescription>Segmentação e origem das ordens de serviço gerais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {customerTypeRanking.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Sem registos de público.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Pie
                      data={customerTypeRanking.map((type) => ({ name: type.name, value: type.count }))}
                      cx="50%"
                      cy="45%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="#ffffff"
                      strokeWidth={3}
                    >
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                            return (
                              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 4} className="fill-brand-950 text-3xl font-bold">
                                  {totalCustomers.toLocaleString()}
                                </tspan>
                                <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-brand-700/80 text-sm font-medium">
                                  Registos
                                </tspan>
                              </text>
                            );
                          }
                          return null;
                        }}
                      />
                      {customerTypeRanking.map((_, index) => (
                        <Cell key={index} fill={BRAND_CHART_PALETTE[index % BRAND_CHART_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                    <Legend content={(props) => <CustomLegend payload={props.payload as { value: string; color: string }[]} />} verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
