'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { useDashboardPage } from './use-dashboard-page';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const {
    isLoading,
    isMounted,
    isInstanceConnected,
    totalActiveOS,
    totalWonOS,
    totalLostOS,
    winRate,
    trendData,
    brandRanking,
    funnelData,
    customerTypeRanking,
    totalCustomers,
  } = useDashboardPage();

  return (
    <div className="flex h-screen overflow-hidden bg-brand-canvas font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden overflow-y-auto no-scrollbar selection:bg-brand-100 selection:text-brand-900">

        <DashboardHeader isInstanceConnected={isInstanceConnected} />

        {isLoading || !isMounted ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-500 font-medium text-sm">A carregar dados...</span>
            </div>
          </div>
        ) : (
          <div className="px-6 md:px-8 pb-12 flex flex-col gap-6 animate-in fade-in duration-500">
            <DashboardMetrics
              totalActiveOS={totalActiveOS}
              totalWonOS={totalWonOS}
              totalLostOS={totalLostOS}
              winRate={winRate}
            />

            <DashboardCharts
              trendData={trendData}
              brandRanking={brandRanking}
              funnelData={funnelData}
              customerTypeRanking={customerTypeRanking}
              totalCustomers={totalCustomers}
            />
          </div>
        )}
      </main>
    </div>
  );
}
