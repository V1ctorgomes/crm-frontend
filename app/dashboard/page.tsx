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

// Paleta Enterprise (Mais madura e elegante)
const PIE_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#64748b'];

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

  // Tooltip Minimalista
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-xl border border-slate-100 shadow-[0_10px_40px_rgb(0,0,0,0.08)] rounded-2xl p-5 min-w-[180px] animate-in fade-in zoom-in-95 duration-200">
          <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-3 pb-2 border-b border-slate-100/80">{label || payload[0].name}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-8 mt-1">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload.fill || PIE_COLORS[0] }}></div>
                <span className="text-slate-600 font-bold text-[13px]">{entry.name === 'count' ? 'Registos' : entry.name}</span>
              </div>
              <span className="text-slate-900 font-black text-[15px]">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden overflow-y-auto no-scrollbar selection:bg-indigo-100 selection:text-indigo-900">
        
        {/* HEADER EMPRESARIAL */}
        <header className="px-6 md:px-10 pt-8 md:pt-10 pb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <LayoutDashboard className="w-5 h-5 text-indigo-600" />
              <span className="text-[12px] font-black text-indigo-600 uppercase tracking-widest">Workspace Analytical</span>
            </div>
            <h1 className="text-[32px] font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
            <p className="text-slate-500 mt-1 text-[14px] font-semibold">Análise de métricas operacionais e fluxo de atendimento.</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="bg-white border border-slate-200/80 px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-3">
               <div className="relative flex h-2.5 w-2.5">
                  {isInstanceConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isInstanceConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
               </div>
               <span className="text-[13px] font-bold text-slate-700">{isInstanceConnected ? 'Evolution API Online' : 'API Offline'}</span>
             </div>
             <Link href="/solicitacoes" className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-slate-800 hover:shadow-lg transition-all text-[13px] flex items-center gap-2">
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
            
            {/* 1. KPIs (Estilo Moderno e Flutuante) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WIP</span>
                </div>
                <div>
                  <h3 className="text-slate-500 text-[13px] font-bold mb-1">OS em Andamento</h3>
                  <div className="text-3xl font-black text-slate-900">{totalActiveOS}</div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Done</span>
                </div>
                <div>
                  <h3 className="text-slate-500 text-[13px] font-bold mb-1">OS Finalizadas</h3>
                  <div className="text-3xl font-black text-slate-900">{totalArchivedOS}</div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100/50 flex items-center justify-center text-sky-600 border border-sky-100">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CRM</span>
                </div>
                <div>
                  <h3 className="text-slate-500 text-[13px] font-bold mb-1">Total de Contactos</h3>
                  <div className="text-3xl font-black text-slate-900">{contacts.length}</div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 flex items-center justify-center text-amber-600 border border-amber-100">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KPI</span>
                </div>
                <div>
                  <h3 className="text-slate-500 text-[13px] font-bold mb-1">Taxa de Resolução</h3>
                  <div className="text-3xl font-black text-slate-900">{resolutionRate}%</div>
                </div>
              </div>
            </div>

            {/* 2. GRÁFICOS PRINCIPAIS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Gráfico de Evolução (AreaChart) */}
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_2px_20px_rgb(0,0,0,0.03)] flex flex-col min-h-[420px]">
                <div className="flex justify-between items-start mb-8 shrink-0">
                  <div>
                    <h3 className="text-[16px] font-black text-slate-800 flex items-center gap-2.5">
                      <div className="w-2 h-5 bg-indigo-500 rounded-full"></div>
                      Evolução de Entradas
                    </h3>
                    <p className="text-[13px] text-slate-500 font-semibold mt-1 ml-4.5">Abertura de novas OS por data no sistema.</p>
                  </div>
                </div>
                <div className="flex-1 w-full relative">
                  {trendData.length === 0 ? (
                     <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold text-sm">Dados insuficientes para tendência.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} dy={15} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} allowDecimals={false} tickFormatter={(val) => Number.isInteger(val) ? val : ''} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                        {/* Curva suave (monotone) para aspeto mais profissional */}
                        <Area type="monotone" dataKey="count" name="Solicitações" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff', fill: '#4f46e5' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Gráfico de Ranking de Marcas (BarChart) */}
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_2px_20px_rgb(0,0,0,0.03)] flex flex-col min-h-[420px]">
                 <div className="flex justify-between items-start mb-8 shrink-0">
                  <div>
                    <h3 className="text-[16px] font-black text-slate-800 flex items-center gap-2.5">
                      <div className="w-2 h-5 bg-emerald-500 rounded-full"></div>
                      Distribuição por Marcas
                    </h3>
                    <p className="text-[13px] text-slate-500 font-semibold mt-1 ml-4.5">Volume de assistência agrupado por fabricante.</p>
                  </div>
                </div>
                <div className="flex-1 w-full relative">
                  {brandRanking.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold text-sm">Aguardando registos de marcas.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={brandRanking} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} barCategoryGap="25%">
                        <defs>
                          <linearGradient id="barPrimary" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                          <linearGradient id="barSecondary" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#94a3b8" />
                            <stop offset="100%" stopColor="#cbd5e1" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} dy={15} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} allowDecimals={false} tickFormatter={(val) => Number.isInteger(val) ? val : ''} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                        <Bar dataKey="count" name="OS Abertas" radius={[6, 6, 6, 6]} maxBarSize={45}>
                          {brandRanking.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? 'url(#barPrimary)' : 'url(#barSecondary)'} />
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
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_2px_20px_rgb(0,0,0,0.03)] flex flex-col min-h-[380px]">
                <div className="flex justify-between items-start mb-8 shrink-0">
                  <div>
                    <h3 className="text-[16px] font-black text-slate-800 flex items-center gap-2.5">
                      <div className="w-2 h-5 bg-amber-500 rounded-full"></div>
                      Gargalos do Funil (Kanban)
                    </h3>
                    <p className="text-[13px] text-slate-500 font-semibold mt-1 ml-4.5">Carga de trabalho ativa segmentada por etapa.</p>
                  </div>
                </div>
                <div className="flex-1 w-full relative">
                  {funnelData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold text-sm">Funil vazio no momento.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={funnelData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }} barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                        <XAxis type="number" hide allowDecimals={false} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} width={110} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                        <Bar dataKey="Quantidade" radius={[0, 6, 6, 0]} maxBarSize={32}>
                          {funnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill || '#94a3b8'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Gráfico de Tipos de Cliente (PieChart) */}
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_2px_20px_rgb(0,0,0,0.03)] flex flex-col min-h-[380px]">
                <div className="flex justify-between items-start mb-4 shrink-0">
                  <div>
                    <h3 className="text-[16px] font-black text-slate-800 flex items-center gap-2.5">
                      <div className="w-2 h-5 bg-sky-500 rounded-full"></div>
                      Análise de Público
                    </h3>
                    <p className="text-[13px] text-slate-500 font-semibold mt-1 ml-4.5">Classificação de origem e tipo de clientes.</p>
                  </div>
                </div>
                <div className="flex-1 w-full relative">
                  {customerTypeRanking.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold text-sm">Aguardando registos de público.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Pie
                          data={customerTypeRanking.map(type => ({ name: type.name, value: type.count }))}
                          cx="50%"
                          cy="45%"
                          innerRadius={80} // Faz o buraco maior (Doughnut style)
                          outerRadius={115}
                          paddingAngle={0}
                          dataKey="value"
                          stroke="#ffffff" // Borda branca grossa para separar as fatias (SaaS Look)
                          strokeWidth={4}
                        >
                          {customerTypeRanking.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#475569', fontWeight: 700 }} />
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