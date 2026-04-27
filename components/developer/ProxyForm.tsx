import React from 'react';
import { ProxyFormData } from './types';

interface ProxyFormProps {
  proxyForm: ProxyFormData;
  setProxyForm: (data: ProxyFormData) => void;
  loadingProxies: boolean;
  handleSaveProxy: (e: React.FormEvent) => void;
}

export function ProxyForm({ proxyForm, setProxyForm, loadingProxies, handleSaveProxy }: ProxyFormProps) {
  return (
    <div className="xl:col-span-1 rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm flex flex-col sticky top-6">
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-semibold leading-none tracking-tight text-lg">Adicionar Proxy</h3>
        <p className="text-sm text-slate-500 mt-1.5">Registe um novo nó de rede para proteger as ligações do WhatsApp.</p>
      </div>
      
      <form className="p-6 flex flex-col gap-4" onSubmit={handleSaveProxy}>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none text-slate-700">Identificação</label>
          <input value={proxyForm.name} onChange={e => setProxyForm({...proxyForm, name: e.target.value})} placeholder="Ex: Nó Europa 01" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">Endereço IP / Host</label>
            <input value={proxyForm.host} onChange={e => setProxyForm({...proxyForm, host: e.target.value})} placeholder="203.0.113.50" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">Porta</label>
            <input value={proxyForm.port} onChange={e => setProxyForm({...proxyForm, port: e.target.value})} type="number" placeholder="8080" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">Protocolo</label>
            <select value={proxyForm.protocol} onChange={e => setProxyForm({...proxyForm, protocol: e.target.value})} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required>
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="socks5">SOCKS5</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 mt-2">
          <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-widest">Autenticação (Opcional)</p>
          <div className="space-y-4">
            <input value={proxyForm.username} onChange={e => setProxyForm({...proxyForm, username: e.target.value})} placeholder="Nome de Utilizador" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            <input value={proxyForm.password} onChange={e => setProxyForm({...proxyForm, password: e.target.value})} type="password" placeholder="Palavra-passe" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
        </div>

        <button type="submit" disabled={loadingProxies} className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-10 px-4 py-2 mt-4 disabled:opacity-50">
           {loadingProxies ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> : null}
           {loadingProxies ? 'A adicionar...' : 'Adicionar Nó à Rede'}
        </button>
      </form>
    </div>
  );
}