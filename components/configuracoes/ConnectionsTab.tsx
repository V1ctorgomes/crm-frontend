import React from 'react';
import { AlertTriangle, Smartphone, ChevronLeft, Loader2, Plus, QrCode, Trash2 } from 'lucide-react';
import { Instance, InstanceHealthSnapshot, ProxyNode } from './types';

interface ConnectionsTabProps {
  selectedProvider: string | null;
  setSelectedProvider: (val: string | null) => void;
  instances: Instance[];
  instancesHealth: Record<string, InstanceHealthSnapshot>;
  isInstancesLoading: boolean;
  availableProxies: ProxyNode[];
  newInstanceName: string;
  setNewInstanceName: (val: string) => void;
  selectedProxyId: string;
  setSelectedProxyId: (val: string) => void;
  isCreatingInstance: boolean;
  handleCreateInstance: (e: React.FormEvent) => void;
  handleConnectInstance: (name: string) => void;
  handleDeleteInstance: (name: string) => void;
}

export function ConnectionsTab({
  selectedProvider, setSelectedProvider, instances, instancesHealth, isInstancesLoading, availableProxies,
  newInstanceName, setNewInstanceName, selectedProxyId, setSelectedProxyId,
  isCreatingInstance, handleCreateInstance, handleConnectInstance, handleDeleteInstance
}: ConnectionsTabProps) {
  return (
    <div className="animate-in fade-in duration-500 flex flex-col gap-6">
      {!selectedProvider ? (
        <div onClick={() => setSelectedProvider('evolution')} className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 flex items-center gap-6 cursor-pointer hover:border-brand-400 transition-all group">
          <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center shrink-0 border border-brand-100 group-hover:scale-105 transition-transform">
            <Smartphone className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-brand-950">WhatsApp Oficial</h3>
            <p className="text-sm text-slate-500">Gestão via Evolution API.</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1 rounded-md text-xs font-semibold">{instances.length} Instâncias</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <button onClick={() => setSelectedProvider(null)} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors w-fit flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <form onSubmit={handleCreateInstance} className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome Instância</label>
                <input type="text" value={newInstanceName} onChange={e => setNewInstanceName(e.target.value)} required className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proxy (opcional)</label>
                <select
                  value={selectedProxyId}
                  onChange={(e) => setSelectedProxyId(e.target.value)}
                  disabled={availableProxies.length === 0}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">
                    {availableProxies.length === 0 ? 'Sem proxies cadastradas' : 'Nenhuma (sem proxy)'}
                  </option>
                  {availableProxies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={isCreatingInstance || !newInstanceName.trim()}
                className="md:col-span-2 bg-brand-600 text-white h-10 rounded-md text-sm font-medium hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingInstance ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Criar Instância
              </button>
            </form>
            <div className="p-6">
              {isInstancesLoading ? <div className="flex justify-center"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div> : (
                <div className="flex flex-col gap-3">
                  {instances.length === 0 && <p className="text-sm text-center text-slate-500 py-4">Nenhuma instância configurada.</p>}
                  {instances.map((inst) => {
                    const health = instancesHealth[inst.name];
                    return (
                    <div key={inst.id} className="border p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{inst.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${inst.status === 'connected' ? 'bg-brand-100 text-brand-800 border border-brand-200' : 'bg-highlight/25 text-brand-900 border border-highlight-warm/80'}`}>{inst.status}</span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-1">{inst.id}</p>
                        {health && health.level !== 'ok' && (
                          <p
                            className={`mt-2 text-xs flex items-start gap-1.5 px-2 py-1.5 rounded-md ${
                              health.level === 'critical'
                                ? 'bg-red-50 text-red-800 border border-red-100'
                                : 'bg-amber-50 text-amber-900 border border-amber-100'
                            }`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{health.message}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {inst.status !== 'connected' && <button onClick={() => handleConnectInstance(inst.name)} className="h-8 px-3 rounded-md border border-slate-200 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5" /> Ligar</button>}
                        <button onClick={() => handleDeleteInstance(inst.name)} className="h-8 px-3 rounded-md border border-slate-200 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Remover</button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}