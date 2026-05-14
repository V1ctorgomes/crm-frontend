'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  PeriodPreset,
  PerUserStats,
  TeamOverviewResponse,
} from '@/components/produtividade/types';
import { apiRequest } from '@/lib/api-client';
import { downloadProdutividadeWorkbook } from '@/lib/produtividade-export-xlsx';

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
  daily: [],
};

const PERIOD_LABELS: Record<PeriodPreset, string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  mes: 'Este mês',
};

export function useProdutividadePage() {
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodPreset>('30d');
  const [data, setData] = useState<TeamOverviewResponse>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedUser, setSelectedUser] = useState<PerUserStats | null>(null);

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

  const handleExportSpreadsheet = useCallback(async () => {
    if (data.perUser.length === 0) {
      setToast({ type: 'error', message: 'Nada para exportar no período seleccionado.' });
      return;
    }
    try {
      await downloadProdutividadeWorkbook(data, PERIOD_LABELS[period]);
      setToast({ type: 'success', message: 'Planilha Excel gerada com sucesso.' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao gerar a planilha.';
      setToast({ type: 'error', message: msg });
    }
  }, [data, period]);

  return {
    period,
    setPeriod,
    data,
    isLoading,
    toast,
    setToast,
    selectedUser,
    setSelectedUser,
    periodLabel: PERIOD_LABELS[period],
    fetchData,
    handleExportSpreadsheet,
  };
}

export type ProdutividadePageViewModel = ReturnType<typeof useProdutividadePage>;
