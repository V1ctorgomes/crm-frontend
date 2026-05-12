import React from 'react';
import {
  Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, LabelList, Label
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface TrendData {
  month: string;
  dayLong: string;
  ganhas: number;
  perdidas: number;
  andamento: number;
}
interface RankingData { name: string; count: number; }
interface FunnelData { name: string; Quantidade: number; }

interface DashboardChartsProps {
  trendData: TrendData[];
  brandRanking: RankingData[];
  funnelData: FunnelData[];
  customerTypeRanking: RankingData[];
  totalCustomers: number;
}

/** Paleta marca: verdes + amarelos secundários */
const BRAND_CHART_PALETTE = ['#148C26', '#1FA634', '#F2CE1B', '#F2E41D', '#0d5f1a', '#52b86b', '#117a21'];

// Tooltip Flutuante Moderno e Inteligente
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const datum = payload[0]?.payload as TrendData | undefined;
    const title = datum?.dayLong ?? label;
    return (
      <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-slate-200/60 bg-white px-3 py-2.5 text-sm shadow-xl z-50">
        <span className="text-xs font-medium text-slate-500 mb-1 capitalize">{title}</span>
        {payload.map((entry: any, index: number) => {
          const displayLabel = entry.name === 'value' || entry.name === 'count' ? 'Registos' : entry.name === 'Quantidade' ? 'Em Fila' : entry.name;
          return (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: entry.color || entry.payload?.fill || '#148C26' }}></span>
                <span className="text-slate-700 font-medium">{displayLabel}</span>
              </div>
              <span className="font-bold text-brand-950 font-mono">{entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

// Renderizador de Legenda Customizado
const renderCustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-2">
      {payload.map((entry: any, index: number) => (
        <li key={`item-${index}`} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-xs font-medium text-slate-600">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};

export function DashboardCharts({ trendData, brandRanking, funnelData, customerTypeRanking, totalCustomers }: DashboardChartsProps) {
  const trendTickLabels = trendData.map((d) => d.month);
  const crowdedTrendAxis = trendData.length > 8;

  return (
    <div className="flex flex-col gap-6">
      {/* 2. GRÁFICOS PRINCIPAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Gráfico de Evolução */}
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
                 <div className="h-full flex items-center justify-center text-slate-400 text-sm">Sem dados suficientes.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendData}
                    margin={{
                      left: 8,
                      right: 8,
                      top: 12,
                      bottom: crowdedTrendAxis ? 48 : 32,
                    }}
                  >
                    <defs>
                      <linearGradient id="colorGanhas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#148C26" stopOpacity={0.45}/>
                        <stop offset="95%" stopColor="#148C26" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAndamento" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F2CE1B" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#F2CE1B" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPerdidas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#cfe8d4" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      type="category"
                      ticks={trendTickLabels}
                      interval={0}
                      minTickGap={0}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      height={crowdedTrendAxis ? 46 : 32}
                      angle={crowdedTrendAxis ? -32 : 0}
                      textAnchor={crowdedTrendAxis ? 'end' : 'middle'}
                      tick={{ fill: '#3d5245', fontSize: crowdedTrendAxis ? 10 : 11 }}
                    />
                    <Tooltip cursor={false} content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#3d5245', paddingTop: '10px' }} />
                    <Area stackId="1" name="Ganhas" dataKey="ganhas" type="monotone" fill="url(#colorGanhas)" fillOpacity={1} stroke="#148C26" strokeWidth={2} />
                    <Area stackId="1" name="Em Andamento" dataKey="andamento" type="monotone" fill="url(#colorAndamento)" fillOpacity={1} stroke="#F2CE1B" strokeWidth={2} />
                    <Area stackId="1" name="Canceladas" dataKey="perdidas" type="monotone" fill="url(#colorPerdidas)" fillOpacity={1} stroke="#ef4444" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Ranking de Marcas */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Fabricante</CardTitle>
            <CardDescription>As marcas com maior volume de registos no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {brandRanking.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">Aguardando registos.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={brandRanking} margin={{ top: 20, right: 10, left: -25, bottom: 0 }} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cfe8d4" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={12} tick={{ fill: '#3d5245', fontSize: 12, fontWeight: 500 }} />
                    <YAxis axisLine={false} tickLine={false} tickMargin={12} tick={{ fill: '#3d5245', fontSize: 12 }} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f5faf6' }} content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#148C26" radius={[4, 4, 0, 0]} maxBarSize={45}>
                      <LabelList dataKey="count" position="top" offset={8} fill="#3d5245" fontSize={12} fontWeight={600} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 3. GRÁFICOS SECUNDÁRIOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Gráfico de Funil / Kanban */}
        <Card>
          <CardHeader>
            <CardTitle>Carga do Kanban</CardTitle>
            <CardDescription>Gargalos operacionais por etapa no funil ativo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {funnelData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">Funil vazio.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={funnelData} margin={{ top: 0, right: 35, left: 0, bottom: 0 }} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cfe8d4" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tickMargin={10} tick={{ fill: '#3d5245', fontSize: 12, fontWeight: 500 }} width={90} />
                    <Tooltip cursor={{ fill: '#f5faf6' }} content={<CustomTooltip />} />
                    <Bar dataKey="Quantidade" fill="#1FA634" radius={[0, 4, 4, 0]} maxBarSize={32}>
                      <LabelList dataKey="Quantidade" position="right" offset={8} fill="#3d5245" fontSize={12} fontWeight={600} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Tipos de Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Perfil de Público</CardTitle>
            <CardDescription>Segmentação e origem das ordens de serviço gerais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {customerTypeRanking.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">Sem registos de público.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Pie
                      data={customerTypeRanking.map(type => ({ name: type.name, value: type.count }))}
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
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 4} className="fill-brand-950 text-3xl font-bold">
                                  {totalCustomers.toLocaleString()}
                                </tspan>
                                <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-brand-700/80 text-sm font-medium">
                                  Registos
                                </tspan>
                              </text>
                            )
                          }
                        }}
                      />
                      {customerTypeRanking.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={BRAND_CHART_PALETTE[index % BRAND_CHART_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                    <Legend content={renderCustomLegend} verticalAlign="bottom" />
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