'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Toast } from '@/components/ui/toast';
import { ProdutividadeHeader } from '@/components/produtividade/ProdutividadeHeader';
import { KpiCards } from '@/components/produtividade/KpiCards';
import { UserStatsTable } from '@/components/produtividade/UserStatsTable';
import { FunnelPanel } from '@/components/produtividade/FunnelPanel';
import type { PeriodPreset, TeamOverviewResponse } from '@/components/produtividade/types';
import { apiRequest } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

function computePeriodRange(preset: PeriodPreset): { from: string; to: string } {
  const now = new Date();
  const to = now;
  let from: Date;
  if (preset === '7d') {
    from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (preset === '30d') {
    from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

const EMPTY: TeamOverviewResponse = {
  period: { from: '', to: '' },
  totals: {
    activeUsers: 0,
    messagesSent: 0,
    messagesReceived: 0,
    ticketsCreated: 0,
    ticketsArchived: 0,
    openTickets: 0,
  },
  perUser: [],
  funnel: [],
};

export default function ProdutividadePage() {
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodPreset>('30d');
  const [data, setData] = useState<TeamOverviewResponse>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const range = useMemo(() => computePeriodRange(period), [period]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ from: range.from, to: range.to });
      const result = await apiRequest<TeamOverviewResponse>(`/reports/team-overview?${params.toString()}`);
      if (result) setData(result);
      else setData(EMPTY);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar produtividade.';
      if (msg.toLowerCase().includes('permiss')) {
        router.replace('/dashboard');
        return;
      }
      setToast({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [range.from, range.to, router]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <div className="flex h-screen overflow-hidden bg-brand-canvas font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden overflow-y-auto crm-thin-scrollbar selection:bg-brand-100 selection:text-brand-900">
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onDismiss={() => setToast(null)}
          />
        )}

        <ProdutividadeHeader
          period={period}
          onPeriodChange={setPeriod}
          isRefreshing={isLoading}
          onRefresh={() => void fetchData()}
        />

        <div className="px-6 md:px-8 py-6 flex flex-col gap-6">
          <KpiCards totals={data.totals} isLoading={isLoading} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <UserStatsTable rows={data.perUser} isLoading={isLoading} />
            </div>
            <div className="lg:col-span-1">
              <FunnelPanel funnel={data.funnel} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
