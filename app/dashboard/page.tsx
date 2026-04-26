'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { 
  Activity, CheckCircle2, Users, TrendingUp, 
  BarChart3, PieChart as PieChartIcon, Filter, LayoutDashboard 
} from 'lucide-react';

interface Contact { number: string; name: string; }
interface Ticket {
  id: string; contactNumber: string; marca: string | null;
  modelo: string | null; customerType: string | null; isArchived: boolean; createdAt: string;
}
interface Stage { id: string; name: string; color: string; order: number; tickets: Ticket[]; }

// Paleta Corporativa (Inspirada em BI Financeiro / SaaS Enterprise)
const BI_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f43f5e'];

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
  const [trendData, setTrendData] = useState<{date: string, count: number}[]>([]);

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
            const dateStr = new Date(t.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
            timeMap.set(dateStr, (timeMap.get(dateStr) || 0) + 1);
          }
        });

        setBrandRanking(Array.from(brandMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 7));
        setCustomerTypeRanking(Array.from(typeMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
        setTrendData(Array.from(timeMap.entries()).map(([date, count]) => ({ date, count })));

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

  const funnelData = stages.map(stage => ({ name: stage.name, Quantidade: stage.tickets.length, fill: stage.color }));

  // Tooltip Corporativo (Glassmorphism e Tipografia Limpa)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-4 min-w-[160px] animate-in fade-in zoom-in-95 duration-200">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">{label || payload[0].name}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6 mt-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color || entry.payload.fill || BI_COLORS[0] }}></div>
                <span className="text-slate-700 font-semibold text-[13px]">{entry.name === 'count' ? 'Registos' : entry.name}</span>
              </div>
              <span className="text-slate-900 font-black text-[14px]">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden overflow-y-auto no-scrollbar selection:bg-indigo-100 selection:text-indigo-900">
        
        {/* HEADER EMPRESARIAL */}
        <header className="px-6 md:px-10 pt-8 md:pt-10 pb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <LayoutDashboard className="w-5 h-5 text-indigo-600" />
              <span className="text-[13px] font-bold text-indigo-600 uppercase tracking-widest">Workspace Analytical</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
            <p className="text-slate-500 mt-1 text-[15px] font-medium">Análise de métricas operacionais e fluxo de atendimento.</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-3">
               <div className="relative flex h-2.5 w-2.5">
                  {isInstanceConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isInstanceConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
               </div>
               <span className="text-sm font-semibold text-slate-700">{isInstanceConnected ? 'Evolution API Online' : 'API Offline'}</span>
             </div>
             <Link href="/solicitacoes" className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-slate-800 hover:shadow-lg transition-all text-sm flex items-center gap-2">
                Visualizar Kanban
             </Link>
          </div>
        </header>

        {isLoading || !isMounted ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Processando Data...</span>
            </div>
          </div>
        ) : (
          <div className="px-6 md:px-10 pb-20 flex flex-col gap-6 animate-in fade-in duration-700">
            
            {/* 1. KPIs (Estilo SaaS Moderno) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">WIP</span>
                </div>
                <div>
                  <h3 className="text-slate-500 text-[13px] font-semibold mb-1">OS em Andamento</h3>
                  <div className="text-3xl font-black text-slate-900">{totalActiveOS}</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">Done</span>
                </div>
                <div>
                  <h3 className="text-slate-500 text-[13px] font-semibold mb-1">OS Finalizadas</h3>
                  <div className="text-3xl font-black text-slate-900">{totalArchivedOS}</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">CRM</span>
                </div>
                <div>
                  <h3 className="text-slate-500 text-[13px] font-semibold mb-1">Total de Contactos</h3>
                  <div className="text-3xl font-black text-slate-900">{contacts.length}</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">KPI</span>
                </div>
                <div>
                  <h3 className="text-slate-500 text-[13px] font-semibold mb-1">Taxa de Resolução</h3>
                  <div className="text-3xl font-black text-slate-900">{resolutionRate}%</div>
                </div>
              </div>
            </div>

            {/* 2. GRÁFICOS PRINCIPAIS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Gráfico de Evolução (AreaChart) */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col min-h-[420px]">
                <div className="flex justify-between items-start mb-8 shrink-0">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-500" /> Evolução de Entradas
                    </h3>
                    <p className="text-[13px] text-slate-500 mt-1">Abertura de novas OS por data no sistema.</p>
                  </div>
                </div>
                <div className="flex-1 w-full relative">
                  {trendData.length === 0 ? (
                     <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-semibold text-sm">Dados insuficientes para gerar tendência.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} dy={15} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} allowDecimals={false} tickFormatter={(val) => Number.isInteger(val) ? val : ''} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area type="monotone" dataKey="count" name="Solicitações" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5', stroke: '#fff' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Gráfico de Ranking de Marcas (BarChart) */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col min-h-[420px]">
                 <div className="flex justify-between items-start mb-8 shrink-0">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-500" /> Distribuição por Marcas
                    </h3>
                    <p className="text-[13px] text-slate-500 mt-1">Volume de assistência agrupado por fabricante.</p>
                  </div>
                </div>
                <div className="flex-1 w-full relative">
                  {brandRanking.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-semibold text-sm">Aguardando registos de marcas.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={brandRanking} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} dy={15} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} allowDecimals={false} tickFormatter={(val) => Number.isInteger(val) ? val : ''} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                        <Bar dataKey="count" name="OS Abertas" radius={[4, 4, 0, 0]} maxBarSize={50}>
                          {brandRanking.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#94a3b8'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>

            {/* 3. GRÁFICOS SECUNDÁRIOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Gráfico de Funil / Estágios (Horizontal BarChart) */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col min-h-[380px]">
                <div className="flex justify-between items-start mb-8 shrink-0">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Filter className="w-4 h-4 text-amber-500" /> Gargalos do Funil (Kanban)
                    </h3>
                    <p className="text-[13px] text-slate-500 mt-1">Carga de trabalho ativa segmentada por etapa.</p>
                  </div>
                </div>
                <div className="flex-1 w-full relative">
                  {funnelData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-semibold text-sm">Funil vazio.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={funnelData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide allowDecimals={false} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} width={110} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                        <Bar dataKey="Quantidade" radius={[0, 4, 4, 0]} maxBarSize={32}>
                          {funnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill || '#cbd5e1'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Gráfico de Tipos de Cliente (PieChart) */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col min-h-[380px]">
                <div className="flex justify-between items-start mb-2 shrink-0">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <PieChartIcon className="w-4 h-4 text-purple-500" /> Análise de Público
                    </h3>
                    <p className="text-[13px] text-slate-500 mt-1">Classificação de origem e tipo de clientes.</p>
                  </div>
                </div>
                <div className="flex-1 w-full relative mt-4">
                  {customerTypeRanking.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-semibold text-sm">Aguardando registos de público.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Pie
                          data={customerTypeRanking.map(type => ({ name: type.name, value: type.count }))}
                          cx="50%"
                          cy="45%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {customerTypeRanking.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={BI_COLORS[index % BI_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#475569', fontWeight: 500 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}