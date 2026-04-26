'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { Activity, CheckCircle2, Users, TrendingUp } from 'lucide-react';

interface Contact { number: string; name: string; }
interface Ticket {
  id: string; contactNumber: string; marca: string | null;
  modelo: string | null; customerType: string | null; isArchived: boolean; createdAt: string;
}
interface Stage { id: string; name: string; color: string; order: number; tickets: Ticket[]; }

// Paleta corporativa (Power BI style)
const PIE_COLORS = ['#1e293b','#334155','#64748b','#94a3b8','#cbd5e1','#e2e8f0','#f1f5f9'];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const [stages, setStages] = useState<Stage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isInstanceConnected, setIsInstanceConnected] = useState(false);

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

        const activeCount = activeStages.reduce((acc, stage) => acc + stage.tickets.length, 0);
        setTotalActiveOS(activeCount);
        setTotalArchivedOS(archivedOS.length);

        const allTickets = [...activeStages.flatMap(s => s.tickets), ...archivedOS];

        const brandMap = new Map<string, number>();
        const typeMap = new Map<string, number>();
        const timeMap = new Map<string, number>();

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
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [baseUrl]);

  const resolutionRate = (totalActiveOS + totalArchivedOS) > 0
    ? Math.round((totalArchivedOS / (totalActiveOS + totalArchivedOS)) * 100) : 0;

  const funnelData = stages.map(stage => ({
    name: stage.name,
    Quantidade: stage.tickets.length,
    fill: '#64748b'
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">{payload[0].name}</p>
          <p className="text-sm font-bold text-slate-900">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto px-8 py-8">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Operational Intelligence</h1>
            <p className="text-sm text-slate-500">Service performance overview</p>
          </div>

          <Link href="/solicitacoes" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            Kanban
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

          {[
            { label: 'OS em andamento', value: totalActiveOS, icon: <Activity size={18}/> },
            { label: 'Finalizadas', value: totalArchivedOS, icon: <CheckCircle2 size={18}/> },
            { label: 'Contactos', value: contacts.length, icon: <Users size={18}/> },
            { label: 'Taxa de resolução', value: `${resolutionRate}%`, icon: <TrendingUp size={18}/> },
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-400 mb-2">{item.icon}</div>
              <div className="text-3xl font-black text-slate-900">{item.value}</div>
              <div className="text-xs text-slate-500 mt-1">{item.label}</div>
            </div>
          ))}

        </div>

        {/* GRÁFICO PRINCIPAL */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Evolução de solicitações</h3>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="date"/>
              <YAxis allowDecimals={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="count" stroke="#1e293b" fillOpacity={0.1} fill="#1e293b"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* SECUNDÁRIOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Marcas</h3>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={brandRanking}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="name"/>
                <YAxis allowDecimals={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="count" fill="#334155" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Tipos de cliente</h3>

            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={customerTypeRanking.map(t => ({ name: t.name, value: t.count }))}
                     dataKey="value"
                     outerRadius={90}>
                  {customerTypeRanking.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip/>}/>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>
      </main>
    </div>
  );
}