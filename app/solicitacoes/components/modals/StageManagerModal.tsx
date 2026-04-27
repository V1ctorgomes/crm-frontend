import React, { useState, useEffect } from 'react';
import { Stage } from '@/types';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';

const PREDEFINED_COLORS = ['#94a3b8', '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#c084fc', '#fb923c', '#f472b6', '#2dd4bf', '#fbbf24'];

interface Props { isOpen: boolean; onClose: () => void; baseUrl: string; onSuccess: () => void; onError: (msg: string) => void; }

export function StageManagerModal({ isOpen, onClose, baseUrl, onSuccess, onError }: Props) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PREDEFINED_COLORS[0]);

  useEffect(() => {
    if (isOpen) fetch(`${baseUrl}/tickets/stages`).then(r => r.json()).then(setStages);
  }, [isOpen, baseUrl]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await fetch(`${baseUrl}/tickets/stages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName, color: newColor }) });
      setNewName(''); onSuccess();
      fetch(`${baseUrl}/tickets/stages`).then(r => r.json()).then(setStages);
    } catch (err) { onError('Erro ao criar fase.'); }
  };

  const handleToggle = async (id: string, current: boolean) => {
    await fetch(`${baseUrl}/tickets/stages/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !current }) });
    onSuccess(); fetch(`${baseUrl}/tickets/stages`).then(r => r.json()).then(setStages);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`${baseUrl}/tickets/stages/${id}`, { method: 'DELETE' });
    if (res.ok) { onSuccess(); fetch(`${baseUrl}/tickets/stages`).then(r => r.json()).then(setStages); }
    else { const d = await res.json(); onError(d.message || 'Erro ao apagar fase.'); }
  };

  const handleReorder = async (index: number, dir: 'up' | 'down') => {
    const newS = [...stages];
    if (dir === 'up' && index > 0) [newS[index - 1], newS[index]] = [newS[index], newS[index - 1]];
    else if (dir === 'down' && index < newS.length - 1) [newS[index + 1], newS[index]] = [newS[index], newS[index + 1]];
    else return;
    setStages(newS);
    await fetch(`${baseUrl}/tickets/stages/reorder`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stages: newS.map((s, i) => ({ id: s.id, order: i + 1 })) }) });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl flex flex-col max-h-[85vh] border border-slate-200" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100"><h3 className="font-semibold text-lg">Fases do Funil</h3></div>
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex gap-3">
          <input type="text" placeholder="Nova Fase..." className="flex-1 h-10 rounded-md border border-slate-300 px-3 text-sm outline-none" value={newName} onChange={e => setNewName(e.target.value)} />
          <div className="flex gap-1.5 bg-white px-3 border border-slate-200 rounded-md items-center">
            {PREDEFINED_COLORS.map(c => <button key={c} onClick={() => setNewColor(c)} className={`w-5 h-5 rounded-full ${newColor === c ? 'ring-2 ring-slate-400' : 'opacity-70'}`} style={{ backgroundColor: c }} />)}
          </div>
          <button onClick={handleCreate} className="h-10 px-4 bg-slate-900 text-white rounded-md text-sm font-medium">Adicionar</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2">
          {stages.map((stage, i) => (
            <div key={stage.id} className={`flex justify-between items-center p-3 border rounded-md ${stage.isActive ? 'bg-white' : 'bg-slate-50 opacity-60'}`}>
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-slate-400">
                  <button onClick={() => handleReorder(i, 'up')} disabled={i===0}><ChevronUp className="w-4 h-4"/></button>
                  <button onClick={() => handleReorder(i, 'down')} disabled={i===stages.length-1}><ChevronDown className="w-4 h-4"/></button>
                </div>
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: stage.color }} />
                <span className="font-medium text-sm text-slate-800">{stage.name}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleToggle(stage.id, stage.isActive)} className="text-xs font-medium px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded">{stage.isActive ? 'Desativar' : 'Ativar'}</button>
                <button onClick={() => handleDelete(stage.id)} className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t flex justify-end bg-slate-50"><button onClick={onClose} className="h-9 px-4 border bg-white rounded-md text-sm">Fechar</button></div>
      </div>
    </div>
  );
}