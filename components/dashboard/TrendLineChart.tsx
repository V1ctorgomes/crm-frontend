'use client';

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChartEmpty, ChartTooltip, SERIES_COLORS, type TrendData } from './chart-shared';

export function TrendLineChart({ data }: { data: TrendData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Desempenho de Entradas</CardTitle>
        <CardDescription>
          Por dia: em andamento pela data de criação; ganhas e canceladas pela data em que foram arquivadas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[268px] w-full">
          {data.length === 0 ? (
            <ChartEmpty message="Sem dados suficientes." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 12, right: 16, left: -8, bottom: 0 }}>
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
                <Tooltip cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }} content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                <Line type="monotone" name="Ganhas" dataKey="ganhas" stroke={SERIES_COLORS.ganhas} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" name="Em Andamento" dataKey="andamento" stroke={SERIES_COLORS.andamento} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" name="Canceladas" dataKey="perdidas" stroke={SERIES_COLORS.perdidas} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
