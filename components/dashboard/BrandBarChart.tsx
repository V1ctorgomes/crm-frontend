'use client';

import { BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BRAND_CHART_PALETTE, ChartEmpty, ChartTooltip, type RankingData } from './chart-shared';

export function BrandBarChart({ data }: { data: RankingData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Fabricante</CardTitle>
        <CardDescription>As marcas com maior volume de registos no sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          {data.length === 0 ? (
            <ChartEmpty message="Aguardando registos." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 10, left: -25, bottom: 0 }} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={12} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tickMargin={12} tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={42}>
                  {data.map((_, idx) => (
                    <Cell key={idx} fill={BRAND_CHART_PALETTE[idx % BRAND_CHART_PALETTE.length]} />
                  ))}
                  <LabelList dataKey="count" position="top" offset={8} fill="#0c1a0f" fontSize={11} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
