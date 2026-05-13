'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { apiRequest } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

interface Contact { number: string; name: string; }
interface Ticket {
  id: string; contactNumber: string; marca: string | null;
  modelo: string | null; customerType: string | null; isArchived: boolean; 
  resolution?: string; createdAt: string; updatedAt?: string;
}
interface Stage { id: string; name: string; color: string; order: number; tickets: Ticket[]; }

/** Data do eixo: criação para OS abertas; última atualização (arquivamento) para ganhas/canceladas. */
function getTicketTimelineBucket(t: Ticket): string | null {
  const iso = t.isArchived ? (t.updatedAt || t.createdAt) : t.createdAt;
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

const MESES_EIXO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const;

/** Labels estáveis a partir da chave YYYY-MM-DD (eixo curto evita cortar nas pontas do SVG). */
function formatSortKeyForChart(sortKey: string): { axisLabel: string; dayLong: string } {
  const [ys, ms, ds] = sortKey.split('-');
  const y = Number(ys);
  const mo = Number(ms);
  const da = Number(ds);
  if (!y || !mo || !da) return { axisLabel: sortKey, dayLong: sortKey };
  const d = new Date(y, mo - 1, da);
  if (Number.isNaN(d.getTime())) return { axisLabel: sortKey, dayLong: sortKey };
  const axisLabel = `${String(ds).padStart(2, '0')} ${MESES_EIXO[mo - 1]}`;
  const dayLong = d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return { axisLabel, dayLong };
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  // Data States
  const [stages, setStages] = useState<Stage[]>([]);
  const [isInstanceConnected, setIsInstanceConnected] = useState<boolean>(false);

  // BI Computed States (KPIs)
  const [totalActiveOS, setTotalActiveOS] = useState(0);
  const [totalWonOS, setTotalWonOS] = useState(0);
  const [totalLostOS, setTotalLostOS] = useState(0);
  const [winRate, setWinRate] = useState(0);

  const [brandRanking, setBrandRanking] = useState<{name: string, count: number}[]>([]);
  const [customerTypeRanking, setCustomerTypeRanking] = useState<{name: string, count: number}[]>([]);
  const [trendData, setTrendData] = useState<
    { month: string; dayLong: string; ganhas: number; perdidas: number; andamento: number }[]
  >([]);

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const fetchOpts = { cache: 'no-store' as RequestCache };
        const instanceConnectedPromise = apiRequest('/users/me', fetchOpts as RequestInit)
          .then((me) =>
            me?.id
              ? apiRequest(`/instances/user/${me.id}`, fetchOpts as RequestInit).catch(() => [])
              : [],
          )
          .then((instances) => instances.some((i: any) => i.status === 'connected'))
          .catch(() => false);

        const [activeStages, archivedOS, isConnected] = await Promise.all([
          apiRequest('/tickets/board', fetchOpts as RequestInit).catch(() => [] as Stage[]),
          apiRequest('/tickets/archived', fetchOpts as RequestInit).catch(() => [] as Ticket[]),
          instanceConnectedPromise,
        ]);
        
        setStages(activeStages);
        setIsInstanceConnected(isConnected);

        // ================= CÁLCULO DOS KPIs =================
        const activeCount = activeStages.reduce((acc, stage) => acc + stage.tickets.length, 0);
        
        // Assumimos que as OS antigas (sem resolução) contam como "Ganhas" para não perder histórico
        const wonCount = archivedOS.filter(t => t.resolution === 'SUCCESS' || !t.resolution).length;
        const lostCount = archivedOS.filter(t => t.resolution === 'CANCELLED').length;
        const totalClosed = wonCount + lostCount;

        setTotalActiveOS(activeCount);
        setTotalWonOS(wonCount);
        setTotalLostOS(lostCount);
        setWinRate(totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0);
        // ====================================================

        const allTickets = [...activeStages.flatMap(s => s.tickets), ...archivedOS];
        const brandMap = new Map<string, number>();
        const typeMap = new Map<string, number>();
        
        // Mapa para a linha do tempo (Gráfico de Área)
        const timeMap = new Map<
          string,
          { month: string; dayLong: string; ganhas: number; perdidas: number; andamento: number }
        >();

        allTickets.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        allTickets.forEach(t => {
          if (t.marca) {
            const m = t.marca.toUpperCase().trim();
            brandMap.set(m, (brandMap.get(m) || 0) + 1);
          }
          if (t.customerType) {
            const ct = t.customerType.toUpperCase().trim();
            typeMap.set(ct, (typeMap.get(ct) || 0) + 1);
          }

          const sortKey = getTicketTimelineBucket(t);
          if (!sortKey) return;

          if (!timeMap.has(sortKey)) {
            const { axisLabel, dayLong } = formatSortKeyForChart(sortKey);
            timeMap.set(sortKey, {
              month: axisLabel,
              dayLong,
              ganhas: 0,
              perdidas: 0,
              andamento: 0,
            });
          }

          const entry = timeMap.get(sortKey)!;

          if (t.isArchived) {
            if (t.resolution === 'CANCELLED') {
              entry.perdidas += 1;
            } else {
              entry.ganhas += 1;
            }
          } else {
            entry.andamento += 1;
          }
        });

        setBrandRanking(Array.from(brandMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6));
        setCustomerTypeRanking(Array.from(typeMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
        setTrendData(
          Array.from(timeMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, row]) => row),
        );

      } catch (error) {
        console.error('Erro ao carregar BI:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const funnelData = stages.map(stage => ({ name: stage.name, Quantidade: stage.tickets.length, color: stage.color }));

  const totalCustomers = useMemo(() => {
    return customerTypeRanking.reduce((acc, curr) => acc + curr.count, 0);
  }, [customerTypeRanking]);

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