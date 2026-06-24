'use client';

import { TrendLineChart } from './TrendLineChart';
import { BrandBarChart } from './BrandBarChart';
import { KanbanFunnelChart } from './KanbanFunnelChart';
import { CustomerPieChart } from './CustomerPieChart';
import type { FunnelData, RankingData, TrendData } from './chart-shared';

export type { FunnelData, RankingData, TrendData };

interface DashboardChartsProps {
  trendData: TrendData[];
  brandRanking: RankingData[];
  funnelData: FunnelData[];
  customerTypeRanking: RankingData[];
  totalCustomers: number;
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
        <TrendLineChart data={trendData} />
        <BrandBarChart data={brandRanking} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <KanbanFunnelChart data={funnelData} />
        <CustomerPieChart data={customerTypeRanking} totalCustomers={totalCustomers} />
      </div>
    </div>
  );
}
