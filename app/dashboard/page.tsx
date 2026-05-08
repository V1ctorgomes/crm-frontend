'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';

export const dynamic = 'force-dynamic';

interface Contact { number: string; name: string; }
interface Ticket {
  id: string; contactNumber: string; marca: string | null;
  modelo: string | null; customerType: string | null; isArchived: boolean; 
  resolution?: string; createdAt: string;
}
interface Stage { id: string; name: string; color: string; order: number; tickets: Ticket[]; }

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
  const [trendData, setTrendData] = useState<{month: string, ganhas: number, perdidas: number, andamento: number}[]>([]);

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const fetchOpts = { cache: 'no-store' as RequestCache };
        const [resBoard, resArchived, resUsers] = await Promise.all([
          fetch(`${baseUrl}/tickets/board`, fetchOpts),
          fetch(`${baseUrl}/tickets/archived`, fetchOpts),
          fetch(`${baseUrl}/users`, fetchOpts)
        ]);

        const activeStages: Stage[] = resBoard.ok ? await resBoard.json() : [];
        const archivedOS: Ticket[] = resArchived.ok ? await resArchived.json() : [];
        
        setStages(activeStages);

        if (resUsers.ok) {
          const users = await resUsers.json();
          if (users.length > 0) {
            const resInst = await fetch(`${baseUrl}/instances/user/${users[0].id}`, fetchOpts);
            if (resInst.ok) {
              const instances = await resInst.json();
              setIsInstanceConnected(instances.some((i: any) => i.status === 'connected'));
            }
          }
        }

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
        const timeMap = new Map<string, { month: string, ganhas: number, perdidas: number, andamento: number }>();

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
          
          if (t.createdAt) {
            const dateObj = new Date(t.createdAt);
            const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
            
            if (!timeMap.has(dateStr)) {
              timeMap.set(dateStr, { month: dateStr, ganhas: 0, perdidas: 0, andamento: 0 });
            }
            
            const entry = timeMap.get(dateStr)!;
            
            if (t.isArchived) {
              if (t.resolution === 'CANCELLED') {
                entry.perdidas += 1;
              } else {
                entry.ganhas += 1;
              }
            } else {
              entry.andamento += 1;
            }
          }
        });

        setBrandRanking(Array.from(brandMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6));
        setCustomerTypeRanking(Array.from(typeMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
        setTrendData(Array.from(timeMap.values()));

      } catch (error) {
        console.error('Erro ao carregar BI:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [baseUrl]);

  const funnelData = stages.map(stage => ({ name: stage.name, Quantidade: stage.tickets.length }));

  const totalCustomers = useMemo(() => {
    return customerTypeRanking.reduce((acc, curr) => acc + curr.count, 0);
  }, [customerTypeRanking]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden overflow-y-auto no-scrollbar selection:bg-blue-100 selection:text-blue-900">
        
        <DashboardHeader isInstanceConnected={isInstanceConnected} />

        {isLoading || !isMounted ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
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