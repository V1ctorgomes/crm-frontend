'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '@/lib/api-client';
import {
  type Stage,
  type Ticket,
  type MeBrief,
  type InstanceRow,
  type TrendDataRow,
  type RankingRow,
  computeKpis,
  computeActiveCount,
  computeBrandRanking,
  computeCustomerTypeRanking,
  computeTrendData,
  buildFunnelData,
} from './dashboard-data';

export function useDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const [stages, setStages] = useState<Stage[]>([]);
  const [isInstanceConnected, setIsInstanceConnected] = useState<boolean>(false);

  const [totalActiveOS, setTotalActiveOS] = useState(0);
  const [totalWonOS, setTotalWonOS] = useState(0);
  const [totalLostOS, setTotalLostOS] = useState(0);
  const [winRate, setWinRate] = useState(0);

  const [brandRanking, setBrandRanking] = useState<RankingRow[]>([]);
  const [customerTypeRanking, setCustomerTypeRanking] = useState<RankingRow[]>([]);
  const [trendData, setTrendData] = useState<TrendDataRow[]>([]);

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const fetchOpts = { cache: 'no-store' as RequestCache };
        const instanceConnectedPromise = apiRequest<MeBrief | null>('/users/me', fetchOpts as RequestInit)
          .then(async (me) => {
            const id = me?.id;
            if (!id) return [] as InstanceRow[];
            const list = await apiRequest<InstanceRow[]>(`/instances/user/${id}`, fetchOpts as RequestInit).catch(
              () => [] as InstanceRow[],
            );
            return Array.isArray(list) ? list : [];
          })
          .then((instances) => instances.some((i) => i.status === 'connected'))
          .catch(() => false);

        const [activeStages, archivedOS, isConnected] = await Promise.all([
          apiRequest<Stage[]>('/tickets/board', fetchOpts as RequestInit).catch(() => [] as Stage[]),
          apiRequest<Ticket[]>('/tickets/archived', fetchOpts as RequestInit).catch(() => [] as Ticket[]),
          instanceConnectedPromise,
        ]);

        const stagesSafe = Array.isArray(activeStages) ? activeStages : [];
        const archivedSafe = Array.isArray(archivedOS) ? archivedOS : [];
        setStages(stagesSafe);
        setIsInstanceConnected(isConnected);

        const activeCount = computeActiveCount(stagesSafe);
        const { wonCount, lostCount, winRate: computedWinRate } = computeKpis(archivedSafe);

        setTotalActiveOS(activeCount);
        setTotalWonOS(wonCount);
        setTotalLostOS(lostCount);
        setWinRate(computedWinRate);

        const allTickets = [...stagesSafe.flatMap((s) => s.tickets), ...archivedSafe];
        allTickets.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        setBrandRanking(computeBrandRanking(allTickets));
        setCustomerTypeRanking(computeCustomerTypeRanking(allTickets));
        setTrendData(computeTrendData(allTickets));
      } catch (error) {
        console.error('Erro ao carregar BI:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const funnelData = buildFunnelData(stages);

  const totalCustomers = useMemo(() => {
    return customerTypeRanking.reduce((acc, curr) => acc + curr.count, 0);
  }, [customerTypeRanking]);

  return {
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
  };
}
