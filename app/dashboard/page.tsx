'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

interface Contact {
  number: string;
  name: string;
}

interface Ticket {
  id: string;
  contactNumber: string;
  marca: string | null;
  modelo: string | null;
  customerType: string | null;
  isArchived: boolean;
  createdAt: string;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
  tickets: Ticket[];
}

const PIE_COLORS = ['#1FA84A', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'];

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

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

        // --- PROCESSAMENTO DO BI ---
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

        setBrandRanking(
          Array.from(brandMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 7)
        );

        setCustomerTypeRanking(
          Array.from(typeMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
        );

        setTrendData(
          Array.from(timeMap.entries()).map(([date, count]) => ({ date, count }))
        );

      } catch (error) {
        console.error('Erro ao carregar BI:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [baseUrl]);

  const resolutionRate = (totalActiveOS + totalArchivedOS) > 0 
    ? Math.round((totalArchivedOS / (totalActiveOS + totalArchivedOS)) * 100) 
    : 0;

  const funnelData = stages.map(stage => ({
    name: stage.name,
    Quantidade: stage.tickets.length,
    fill: stage.color
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 border border-slate-200 shadow-xl rounded-xl z-50">
          <p className="font-extrabold text-slate-800 text-sm mb-1">{label || payload[0].name}</p>
          <p className="text-slate-600 font-medium text-sm">
            Total: <span className="font-black text-[#1FA84A] text-base ml-1">{payload[0].value}</span> Registos
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f6] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden overflow-y-auto no-scrollbar">
        
        <header className="px-6 md:px-10 pt-8 md:pt-10 pb-6 flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Business Intelligence</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Painel Executivo</h1>
            <p className="text-slate-500 mt-1 font-medium">Análise de dados avançada e desempenho operacional.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="bg-white border border-slate-200/80 px-5 py-2.5 rounded-2xl shadow-sm flex items-center gap-3">
               <div className={`w-2.5 h-2.5 rounded-full ${isInstanceConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-red-500'}`}></div>
               <span className="text-sm font-bold text-slate-600">{isInstanceConnected ? 'WhatsApp Ativo' : 'WhatsApp Offline'}</span>
             </div>
             <Link href="/solicitacoes" className="bg-[#1FA84A] text-white px-6 py-2.5 rounded-2xl font-bold shadow-md hover:bg-green-600 hover:shadow-lg transition-all text-sm flex items-center gap-2">
                Abrir Kanban
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
             </Link>
          </div>
        </header>

        {isLoading || !isMounted ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-sm"></div>
              <span className="text-slate-500 font-bold text-sm uppercase tracking-widest">Renderizando BI...</span>
            </div>
          </div>
        ) : (
          <div className="p-6 md:px-10 pb-20 flex flex-col gap-6 animate-in fade-in duration-700">
            
            {/* ================= 1. CARDS DE KPI (TOP) ================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-orange-300 transition-all">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                    </div>
                    <span className="bg-orange-50 text-orange-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border border-orange-100">Ativas</span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">OS em Andamento</h3>
                  <div className="text-4xl font-black text-slate-800">{totalActiveOS}</div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-green-300 transition-all">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#e8f6ea] text-[#1FA84A] flex items-center justify-center shadow-inner">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                    </div>
                    <span className="bg-green-50 text-green-700 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border border-green-100">Sucesso</span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">OS Finalizadas</h3>
                  <div className="text-4xl font-black text-slate-800">{totalArchivedOS}</div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
                    </div>
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border border-blue-100">Base</span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Total de Contactos</h3>
                  <div className="text-4xl font-black text-slate-800">{contacts.length}</div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-purple-300 transition-all">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
                    </div>
                    <span className="bg-purple-50 text-purple-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border border-purple-100">Eficiência</span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Taxa de Resolução</h3>
                  <div className="flex items-end gap-2">
                    <div className="text-4xl font-black text-slate-800">{resolutionRate}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= 2. GRÁFICOS DE LINHA E BARRAS ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Gráfico de Evolução (AreaChart) */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col min-h-[400px]">
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800">Evolução de Solicitações</h3>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">Volume de abertura de OS ao longo do tempo.</p>
                  </div>
                </div>
                <div className="flex-1 w-full relative">
                  {trendData.length === 0 ? (
                     <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold">Sem dados suficientes para tendência.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 25 }}>
                        <defs>
                          <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} dy={15} />
                        {/* FIX: tickFormatter impede a renderização de números decimais (0.5 OS) */}
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} allowDecimals={false} tickFormatter={(val) => Number.isInteger(val) ? val : ''} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4' }} />
                        <Area type="monotone" dataKey="count" name="Novas OS" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Gráfico de Ranking de Marcas (BarChart) */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col min-h-[400px]">
                 <div className="flex justify-between items-center mb-6 shrink-0">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800">Top Equipamentos (Marcas)</h3>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">As marcas com maior volume de assistência.</p>
                  </div>
                </div>
                <div className="flex-1 w-full relative">
                  {brandRanking.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold">Ainda não há marcas registadas nas OS.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={brandRanking} margin={{ top: 10, right: 10, left: -25, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} dy={15} />
                        {/* FIX: tickFormatter impede a renderização de números decimais */}
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} allowDecimals={false} tickFormatter={(val) => Number.isInteger(val) ? val : ''} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                        <Bar dataKey="count" name="OS Abertas" radius={[6, 6, 0, 0]} barSize={40}>
                          {brandRanking.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#1FA84A' : '#64748b'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>

            {/* ================= 3. GRÁFICOS DE PIZZA E HORIZONTAL BARS ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Gráfico de Funil / Estágios (Horizontal BarChart) */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col min-h-[380px]">
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800">Gargalos do Funil (Kanban)</h3>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">Onde as suas OS estão paradas neste momento.</p>
                  </div>
                </div>
                <div className="flex-1 w-full relative">
                  {funnelData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold">Nenhuma fase configurada.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={funnelData} margin={{ top: 0, right: 30, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide allowDecimals={false} />
                        {/* FIX: width={100} garante que os nomes das fases ("Novo", "Em Análise") tenham espaço perfeito */}
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 'bold' }} width={100} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                        <Bar dataKey="Quantidade" radius={[0, 6, 6, 0]} barSize={28}>
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
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col min-h-[380px]">
                <div className="flex justify-between items-center mb-2 shrink-0">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800">Distribuição de Público</h3>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">Tipos de clientes atendidos na sua operação.</p>
                  </div>
                </div>
                <div className="flex-1 w-full relative mt-4">
                  {customerTypeRanking.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold text-sm text-center">Ainda não há tipos de clientes<br/>registados nas OS.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      {/* FIX: Margem bottom adicionada para a legenda ter espaço e não ser cortada */}
                      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
                        <Pie
                          data={customerTypeRanking.map(type => ({ name: type.name, value: type.count }))}
                          cx="50%"
                          cy="45%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {customerTypeRanking.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={50} iconType="circle" wrapperStyle={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }} />
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