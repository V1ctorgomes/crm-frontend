import React from 'react';
import { ProxyNode } from './types';

interface ProxiesTableProps {
  proxies: ProxyNode[];
  handleDeleteProxy: (id: string) => void;
}

export function ProxiesTable({ proxies, handleDeleteProxy }: ProxiesTableProps) {
  return (
    <div className="xl:col-span-2 rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-semibold leading-none tracking-tight text-lg">Infraestrutura Ativa</h3>
        <p className="text-sm text-slate-500 mt-1.5">Lista de todos os proxies registados e disponíveis.</p>
      </div>
      
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="h-12 px-4 align-middle font-medium text-slate-500">Identificação</th>
              <th className="h-12 px-4 align-middle font-medium text-slate-500">Endereço IP</th>
              <th className="h-12 px-4 align-middle font-medium text-slate-500">Protocolo</th>
              <th className="h-12 px-4 align-middle font-medium text-slate-500">Auth</th>
              <th className="h-12 px-4 align-middle font-medium text-slate-500 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {proxies.length === 0 ? (
              <tr>
                <td colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center p-6 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mb-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span className="font-medium text-sm text-slate-500">Nenhum Proxy Registado</span>
                  </div>
                </td>
              </tr>
            ) : proxies.map(proxy => (
              <tr key={proxy.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span className="font-semibold text-slate-900">{proxy.name}</span>
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <span className="font-mono text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded">
                    {proxy.host}:{proxy.port}
                  </span>
                </td>
                <td className="p-4 align-middle">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{proxy.protocol}</span>
                </td>
                <td className="p-4 align-middle">
                  {proxy.username ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase tracking-widest border border-blue-200">
                      Sim
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-widest border border-slate-200">
                      Não
                    </span>
                  )}
                </td>
                <td className="p-4 align-middle text-right">
                  <button 
                    onClick={() => handleDeleteProxy(proxy.id)} 
                    className="h-8 w-8 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 ml-auto"
                    title="Eliminar Proxy"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}