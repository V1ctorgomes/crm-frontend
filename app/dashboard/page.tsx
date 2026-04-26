'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import {
  Area, AreaChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, YAxis, Cell, PieChart, Pie, LabelList, Label
} from 'recharts';
import { 
  Activity, CheckCircle2, Users, TrendingUp, ExternalLink 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Contact { number: string; name: string; }
interface Ticket {
  id: string; contactNumber: string; marca: string | null;
  modelo: string | null; customerType: string | null; isArchived: boolean; createdAt: string;
}
interface Stage { id: string; name: string; color: string; order: number; tickets: Ticket[]; }

// Paleta de Cores Múltiplas (Para o Gráfico de Público)
const CHART_COLORS = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#e11d48', '#0891b2', '#0284c7'];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  // Data States
  const [stages, setStages] = useState<Stage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isInstanceConnected, setIsInstanceConnected] = useState<boolean>(false);

  // BI Computed States
  const [totalActiveOS, setTotalActiveOS] = useState(0);
  const [totalArchivedOS, setTotalArchivedOS] = useState(0);
  const [brandRanking, setBrandRanking] = useState<{name: string, count: number}[]>([]);
  const [customerTypeRanking, setCustomerTypeRanking] = useState<{name: string, count: number}[]>([]);
  const [trendData, setTrendData] = useState<{month: string, desktop: number}[]>([]);

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const fetchOpts = { cache: 'no-store' as RequestCache };
        const [resBoard, resArchived, resContacts, resUsers] = await Promise.all([
          fetch(`${baseUrl}/tickets/board`, fetchOpts),
          fetch(`${baseUrl}/tickets/archived`, fetchOpts),
          fetch(`${baseUrl}/whatsapp/contacts`, fetchOpts),
          fetch(`${baseUrl}/users`, fetchOpts)
        ]);

        const activeStages: Stage[] = resBoard.ok ? await resBoard.json() : [];
        const archivedOS: Ticket[] = resArchived.ok ? await resArchived.json() : [];
        const fetchedContacts: Contact[] = resContacts.ok ? await resContacts.json() : [];
        
        setStages(activeStages);
        setContacts(fetchedContacts);

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

        // Processamento de BI
        const activeCount = activeStages.reduce((acc, stage) => acc + stage.tickets.length, 0);
        setTotalActiveOS(activeCount);
        setTotalArchivedOS(archivedOS.length);

        const allTickets = [...activeStages.flatMap(s => s.tickets), ...archivedOS];
        const brandMap = new Map<string, number>();
        const typeMap = new Map<string, number>();
        const timeMap = new Map<string, number>();

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
            timeMap.set(dateStr, (timeMap.get(dateStr) || 0) + 1);
          }
        });

        // Top Marcas e Público
        setBrandRanking(Array.from(brandMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6));
        setCustomerTypeRanking(Array.from(typeMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
        
        setTrendData(Array.from(timeMap.entries()).map(([date, count]) => ({ month: date, desktop: count })));

      } catch (error) {
        console.error('Erro ao carregar BI:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [baseUrl]);

  const resolutionRate = (totalActiveOS + totalArchivedOS) > 0 
    ? Math.round((totalArchivedOS / (totalActiveOS + totalArchivedOS)) * 100) : 0;

  const funnelData = stages.map(stage => ({ name: stage.name, Quantidade: stage.tickets.length }));

  // Calculando o Total de Registos para o centro do Gráfico de Pizza
  const totalCustomers = useMemo(() => {
    return customerTypeRanking.reduce((acc, curr) => acc + curr.count, 0);
  }, [customerTypeRanking]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-slate-200/60 bg-white px-3 py-2.5 text-sm shadow-xl">
          <span className="text-xs font-medium text-slate-500 mb-1">{label || payload[0].name}</span>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: entry.color || entry.payload?.fill || '#2563eb' }}></span>
                <span className="text-slate-700 font-medium">{entry.name === 'desktop' || entry.name === 'count' || entry.name === 'value' ? 'Registos' : entry.name === 'Quantidade' ? 'Em Fila' : entry.name}</span>
              </div>
              <span className="font-bold text-slate-900 font-mono">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden overflow-y-auto no-scrollbar selection:bg-blue-100 selection:text-blue-900">
        
        <header className="px-6 md:px-8 pt-8 md:pt-10 pb-6 flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 z-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Acompanhe as métricas e o desempenho da sua operação.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="bg-white border border-slate-200 px-3 py-2 rounded-md shadow-sm flex items-center gap-2.5">
               <div className="relative flex h-2 w-2">
                  {isInstanceConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isInstanceConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
               </div>
               <span className="text-xs font-medium text-slate-600">{isInstanceConnected ? 'API Conectada' : 'Desconectado'}</span>
             </div>
             <Link href="/solicitacoes" className="bg-slate-900 text-white px-4 py-2 rounded-md font-medium shadow hover:bg-slate-800 transition-colors text-sm flex items-center gap-2">
                Abrir Kanban <ExternalLink className="w-3.5 h-3.5" />
             </Link>
          </div>
        </header>

        {isLoading || !isMounted ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-500 font-medium text-sm">A carregar dados...</span>
            </div>
          </div>
        ) : (
          <div className="px-6 md:px-8 pb-12 flex flex-col gap-6 animate-in fade-in duration-500">
            
            {/* 1. KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm p-6 flex flex-col justify-between">
                <div className="flex flex-row items-center justify-between space-y-0 mb-2">
                  <h3 className="tracking-tight text-sm font-medium text-slate-500">OS em Andamento</h3>
                  <Activity className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalActiveOS}</div>
                  <p className="text-xs text-slate-500 mt-1">Em processo no funil</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm p-6 flex flex-col justify-between">
                <div className="flex flex-row items-center justify-between space-y-0 mb-2">
                  <h3 className="tracking-tight text-sm font-medium text-slate-500">OS Finalizadas</h3>
                  <CheckCircle2 className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalArchivedOS}</div>
                  <p className="text-xs text-slate-500 mt-1">Atendimentos concluídos</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm p-6 flex flex-col justify-between">
                <div className="flex flex-row items-center justify-between space-y-0 mb-2">
                  <h3 className="tracking-tight text-sm font-medium text-slate-500">Total de Clientes</h3>
                  <Users className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{contacts.length}</div>
                  <p className="text-xs text-slate-500 mt-1">Registos na base de contactos</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm p-6 flex flex-col justify-between">
                <div className="flex flex-row items-center justify-between space-y-0 mb-2">
                  <h3 className="tracking-tight text-sm font-medium text-slate-500">Taxa de Resolução</h3>
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{resolutionRate}%</div>
                  <p className="text-xs text-slate-500 mt-1">Eficiência geral</p>
                </div>
              </div>
            </div>

            {/* 2. GRÁFICOS PRINCIPAIS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Gráfico de Evolução (Area) */}
              <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm flex flex-col">
                <div className="flex flex-col space-y-1.5 p-6 pb-4">
                  <h3 className="font-semibold leading-none tracking-tight text-lg">Evolução de Entradas</h3>
                  <p className="text-sm text-slate-500">Mostrando volume total de solicitações</p>
                </div>
                
                <div className="p-6 pt-0 flex-1">
                  <div className="h-[250px] w-full">
                    {trendData.length === 0 ? (
                       <div className="h-full flex items-center justify-center text-slate-400 text-sm">Sem dados suficientes.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={trendData}
                          margin={{ left: 12, right: 12, top: 12, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorDesktop" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                          <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            tickFormatter={(value) => value.slice(0, 5)}
                          />
                          <Tooltip cursor={false} content={<CustomTooltip />} />
                          <Area
                            dataKey="desktop"
                            type="natural"
                            fill="url(#colorDesktop)"
                            fillOpacity={1}
                            stroke="#2563eb"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="flex items-center p-6 pt-0">
                  <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2 leading-none font-medium">
                        Crescimento do fluxo de assistência <TrendingUp className="h-4 w-4" />
                      </div>
                      <div className="flex items-center gap-2 leading-none text-slate-500">
                        Exibindo histórico com base nas OS abertas
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico de Ranking de Marcas (Todas as barras com o mesmo azul) */}
              <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm flex flex-col">
                <div className="flex flex-col space-y-1.5 p-6 pb-4">
                  <h3 className="font-semibold leading-none tracking-tight text-lg">Distribuição por Fabricante</h3>
                  <p className="text-sm text-slate-500">As marcas com maior volume de registos no sistema</p>
                </div>
                <div className="p-6 pt-0 flex-1">
                  <div className="h-[250px] w-full">
                    {brandRanking.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 text-sm">Aguardando registos.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={brandRanking} 
                          margin={{ top: 20, right: 10, left: -25, bottom: 0 }} 
                          barCategoryGap="25%"
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tickMargin={12} 
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tickMargin={12} 
                            tick={{ fill: '#64748b', fontSize: 12 }} 
                            allowDecimals={false} 
                          />
                          <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                          <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={45}>
                            <LabelList 
                              dataKey="count" 
                              position="top" 
                              offset={8} 
                              fill="#475569" 
                              fontSize={12} 
                              fontWeight={600} 
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
                <div className="flex items-center p-6 pt-0">
                  <div className="text-sm text-slate-500">
                    Dados processados em tempo real do banco de dados.
                  </div>
                </div>
              </div>

            </div>

            {/* 3. GRÁFICOS SECUNDÁRIOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Gráfico de Funil / Kanban (Barras com a cor AZUL) */}
              <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm flex flex-col">
                <div className="flex flex-col space-y-1.5 p-6 pb-4">
                  <h3 className="font-semibold leading-none tracking-tight text-lg">Carga do Kanban</h3>
                  <p className="text-sm text-slate-500">Gargalos operacionais por etapa no funil</p>
                </div>
                <div className="p-6 pt-0 flex-1">
                  <div className="h-[250px] w-full">
                    {funnelData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 text-sm">Funil vazio.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={funnelData} margin={{ top: 0, right: 35, left: 0, bottom: 0 }} barCategoryGap="20%">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tickMargin={10} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} width={90} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                          <Bar dataKey="Quantidade" fill="#2563eb" radius={[0, 4, 4, 0]} maxBarSize={32}>
                            <LabelList dataKey="Quantidade" position="right" offset={8} fill="#475569" fontSize={12} fontWeight={600} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Gráfico de Tipos de Cliente (Donut Chart Multicor com Texto no Centro) */}
              <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm flex flex-col">
                <div className="flex flex-col space-y-1.5 p-6 pb-4">
                  <h3 className="font-semibold leading-none tracking-tight text-lg">Perfil de Público</h3>
                  <p className="text-sm text-slate-500">Segmentação e origem das ordens de serviço</p>
                </div>
                <div className="p-6 pt-0 flex-1">
                  <div className="h-[250px] w-full">
                    {customerTypeRanking.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 text-sm">Sem registos de público.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <Pie
                            data={customerTypeRanking.map(type => ({ name: type.name, value: type.count }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="#ffffff"
                            strokeWidth={3}
                          >
                            {/* Texto Central Dinâmico */}
                            <Label
                              content={({ viewBox }) => {
                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                  return (
                                    <text
                                      x={viewBox.cx}
                                      y={viewBox.cy}
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                    >
                                      <tspan
                                        x={viewBox.cx}
                                        y={viewBox.cy}
                                        className="fill-slate-900 text-3xl font-bold"
                                      >
                                        {totalCustomers.toLocaleString()}
                                      </tspan>
                                      <tspan
                                        x={viewBox.cx}
                                        y={(viewBox.cy || 0) + 24}
                                        className="fill-slate-500 text-sm font-medium"
                                      >
                                        Registos
                                      </tspan>
                                    </text>
                                  )
                                }
                              }}
                            />
                            {/* Cores Diferentes para cada fatia */}
                            {customerTypeRanking.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} cursor={false} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}