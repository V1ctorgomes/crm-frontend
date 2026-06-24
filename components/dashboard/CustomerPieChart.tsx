'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Label } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BRAND_CHART_PALETTE, ChartEmpty, ChartLegend, ChartTooltip, type RankingData } from './chart-shared';

export function CustomerPieChart({ data, totalCustomers }: { data: RankingData[]; totalCustomers: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil de Público</CardTitle>
        <CardDescription>Segmentação e origem das ordens de serviço gerais</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          {data.length === 0 ? (
            <ChartEmpty message="Sem registos de público." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Pie
                  data={data.map((type) => ({ name: type.name, value: type.count }))}
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
                  {data.map((_, index) => (
                    <Cell key={index} fill={BRAND_CHART_PALETTE[index % BRAND_CHART_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} cursor={false} />
                <Legend content={(props) => <ChartLegend payload={props.payload as { value: string; color: string }[]} />} verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
