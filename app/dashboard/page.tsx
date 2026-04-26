'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface Contact {
  number: string;
  name: string;
  lastMessageTime?: string;
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
  
  // Data States
  const [stages, setStages] = useState<Stage[]>([]);
  const [archivedTickets, setArchivedTickets] = useState<Ticket[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isInstanceConnected, setIsInstanceConnected] = useState<boolean>(false);

  // BI Computed States
  const [totalActiveOS, setTotalActiveOS] = useState(0);
  const [totalArchivedOS, setTotalArchivedOS] = useState(0);
  const [brandRanking, setBrandRanking] = useState<{name: string, count: number, percent: number}[]>([]);
  const [customerTypeRanking, setCustomerTypeRanking] = useState<{name: string, count: number, percent: number}[]>([]);

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // 1. Buscar Kanban Board (OS Ativas)
        const resBoard = await fetch(`${baseUrl}/tickets/board`);
        let activeStages: Stage[] = [];
        if (resBoard.ok) {
          activeStages = await resBoard.json();
          setStages(activeStages);
        }

        // 2. Buscar OS Arquivadas (Concluídas)
        const resArchived = await fetch(`${baseUrl}/tickets/archived`);
        let archivedOS: Ticket[] = [];
        if (resArchived.ok) {
          archivedOS = await resArchived.json();
          setArchivedTickets(archivedOS);
        }

        // 3. Buscar Contatos do WhatsApp
        const resContacts = await fetch(`${baseUrl}/whatsapp/contacts`);
        if (resContacts.ok) {
          setContacts(await resContacts.json());
        }

        // 4. Verificar Status da Instância
        const resUsers = await fetch(`${baseUrl}/users`);
        if (resUsers.ok) {
          const users = await resUsers.json();
          if (users.length > 0) {
            const resInstances = await fetch(`${baseUrl}/instances/user/${users[0].id}`);
            if (resInstances.ok) {
              const instances = await resInstances.json();
              setIsInstanceConnected(instances.some((i: any) => i.status === 'connected'));
            }
          }
        }

        // --- PROCESSAMENTO DO BI (BUSINESS INTELLIGENCE) ---
        
        // Quantidades Totais
        const activeCount = activeStages.reduce((acc, stage) => acc + stage.tickets.length, 0);
        setTotalActiveOS(activeCount);
        setTotalArchivedOS(archivedOS.length);

        // Agrupamento para Gráficos
        const allTickets = [...activeStages.flatMap(s => s.tickets), ...archivedOS];
        
        // Processar Marcas
        const brandMap = new Map<string, number>();
        // Processar Tipos de Cliente
        const typeMap = new Map<string, number>();

        allTickets.forEach(t => {
          if (t.marca) {
            const m = t.marca.toUpperCase().trim();
            brandMap.set(m, (brandMap.get(m) || 0) + 1);
          }
          if (t.customerType) {
            const ct = t.customerType.toUpperCase().trim();
            typeMap.set(ct, (typeMap.get(ct) || 0) + 1);
          }
        });

        // Formatar e Ordenar Ranking de Marcas
        const totalWithBrand = Array.from(brandMap.values()).reduce((a, b) => a + b, 0);
        const sortedBrands = Array.from(brandMap.entries())
          .map(([name, count]) => ({ name, count, percent: totalWithBrand > 0 ? (count / totalWithBrand) * 100 : 0 }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5
        setBrandRanking(sortedBrands);

        // Formatar e Ordenar Ranking de Tipos de Cliente
        const totalWithType = Array.from(typeMap.values()).reduce((a, b) => a + b, 0);
        const sortedTypes = Array.from(typeMap.entries())
          .map(([name, count]) => ({ name, count, percent: totalWithType > 0 ? (count / totalWithType) * 100 : 0 }))
          .sort((a, b) => b.count - a.count);
        setCustomerTypeRanking(sortedTypes);

      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [baseUrl]);

  const resolutionRate = (totalActiveOS + totalArchivedOS) > 0 
    ? Math.round((totalArchivedOS / (totalActiveOS + totalArchivedOS)) * 100) 
    : 0;

  // Dados Preparados para Recharts
  const funnelData = stages.map(stage => ({
    name: stage.name,
    Quantidade: stage.tickets.length,
    fill: stage.color
  }));

  const pieData = customerTypeRanking.map(type => ({
    name: type.name,
    value: type.count
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 border border-slate-200 shadow-xl rounded-xl">
          <p className="font-extrabold text-slate-800 text-sm mb-1">{label || payload[0].name}</p>
          <p className="text-slate-600 font-medium text-sm">
            Total: <span className="font-black text-[#1FA84A]">{payload[0].value}</span> OS
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f6] font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden overflow-y-auto">
        
        <header className="px-6 md:px-10 pt-8 md:pt-10 pb-6 flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Business Intelligence</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard & Métricas</h1>
            <p className="text-slate-500 mt-1 font-medium">Visão geral do desempenho do atendimento e volume de OS.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="bg-white border border-slate-200/80 px-5 py-2.5 rounded-2xl shadow-sm flex items-center gap-3">
               <div className={`w-2.5 h-2.5 rounded-full ${isInstanceConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-red-500'}`}></div>
               <span className="text-sm font-bold text-slate-600">{isInstanceConnected ? 'Instância Online' : 'Instância Offline'}</span>
             </div>
             <Link href="/solicitacoes" className="bg-[#1FA84A] text-white px-6 py-2.5 rounded-2xl font-bold shadow-md hover:bg-green-600 hover:shadow-lg transition-all text-sm flex items-center gap-2">
                Abrir Kanban
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
             </Link>
          </div>
        </header>

        {isLoading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-[#1FA84A] border-t-transparent rounded-full animate-spin shadow-sm"></div>
              <span className="text-slate-500 font-bold text-sm">A compilar dados...</span>
            </div>
          </div>
        ) : (
          <div className="p-6 md:px-10 pb-20 flex flex-col gap-8 animate-in fade-in duration-700">
            
            {/* ================= CARDS DE KPI ================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              
              {/* KPI 1 */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-[#1FA84A]/30 transition-all">
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

              {/* KPI 2 */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-[#1FA84A]/30 transition-all">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#e8f6ea] text-[#1FA84A] flex items-center justify-center shadow-inner">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" /></svg>
                    </div>
                    <span className="bg-green-50 text-green-700 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border border-green-100">Sucesso</span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">OS Finalizadas</h3>
                  <div className="text-4xl font-black text-slate-800">{totalArchivedOS}</div>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-[#1FA84A]/30 transition-all">
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

              {/* KPI 4 */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-[#1FA84A]/30 transition-all">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
                    </div>
                    <span className="bg-purple-50 text-purple-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border border-purple-100">Métrica</span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Taxa de Resolução</h3>
                  <div className="flex items-end gap-2">
                    <div className="text-4xl font-black text-slate-800">{resolutionRate}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= GRÁFICOS E ANÁLISES (RECHARTS) ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Gráfico de Funil (Kanban) */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-8 shrink-0">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800">Funil de Atendimento (Kanban)</h3>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">Distribuição das solicitações ativas por fase.</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" /></svg>
                  </div>
                </div>

                <div className="flex-1 w-full h-[300px]">
                  {funnelData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400 font-bold">Nenhuma fase configurada no Kanban.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={funnelData} margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 'bold' }} width={110} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                        <Bar dataKey="Quantidade" radius={[0, 6, 6, 0]} barSize={32}>
                          {funnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Gráfico de Tipos de Cliente */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800">Perfil de Cliente</h3>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">Origem das demandas.</p>
                  </div>
                </div>
                
                <div className="flex-1 w-full h-[300px]">
                  {pieData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400 font-medium text-sm text-center">Ainda não há tipos de clientes registados nas OS.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="45%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Top Marcas Solicitadas */}
              <div className="lg:col-span-3 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col">
                 <div className="flex justify-between items-center mb-8 shrink-0">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800">Top Marcas / Fabricantes</h3>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">As 5 marcas com mais incidência de serviço no histórico.</p>
                  </div>
                </div>

                <div className="flex-1 w-full h-[300px]">
                  {brandRanking.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400 font-medium text-sm">Ainda não há marcas registadas nas OS.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={brandRanking} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 'bold' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                        <Bar dataKey="count" name="OS Abertas" radius={[6, 6, 0, 0]} barSize={50}>
                          {brandRanking.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#1FA84A' : '#3b82f6'} />
                          ))}
                        </Bar>
                      </BarChart>
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