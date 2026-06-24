'use client';

import { BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BRAND_CHART_PALETTE, ChartEmpty, ChartTooltip, type FunnelData } from './chart-shared';

export function KanbanFunnelChart({ data }: { data: FunnelData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Carga do Kanban</CardTitle>
        <CardDescription>Gargalos operacionais por etapa no funil ativo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          {data.length === 0 ? (
            <ChartEmpty message="Funil vazio." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={data} margin={{ top: 0, right: 35, left: 0, bottom: 0 }} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tickMargin={10} tick={{ fill: '#3d5245', fontSize: 12, fontWeight: 500 }} width={110} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltip />} />
                <Bar dataKey="Quantidade" radius={[0, 6, 6, 0]} maxBarSize={28}>
                  {data.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color || BRAND_CHART_PALETTE[idx % BRAND_CHART_PALETTE.length]} />
                  ))}
                  <LabelList dataKey="Quantidade" position="right" offset={8} fill="#0c1a0f" fontSize={12} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
