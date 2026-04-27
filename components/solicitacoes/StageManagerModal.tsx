import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Stage } from './types';

const PREDEFINED_COLORS = ['#94a3b8', '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#c084fc', '#fb923c', '#f472b6', '#2dd4bf', '#fbbf24'];

interface StageManagerModalProps {
  baseUrl: string;
  onClose: () => void;
  onStagesChanged: () => void;
  showFeedback: (type: 'success' | 'error', msg: string) => void;
  setConfirmModal: (modal: any) => void;
}

export function StageManagerModal({ baseUrl, onClose, onStagesChanged, showFeedback, setConfirmModal }: StageManagerModalProps) {
  const [allStages, setAllStages] = useState<Stage[]>([]);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState(PREDEFINED_COLORS[0]);

  const loadStages = async () => {
    const res = await fetch(`${baseUrl}/tickets/stages`);
    if (res.ok) setAllStages(await res.json());
  };

  useEffect(() => { loadStages(); }, []);

  const handleCreateStage = async () => {
    if (!newStageName.trim()) return;
    try {
      const res = await fetch(`${baseUrl}/tickets/stages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newStageName, color: newStageColor }) });
      if (res.ok) { setNewStageName(''); setNewStageColor(PREDEFINED_COLORS[0]); loadStages(); onStagesChanged(); showFeedback('success', 'Fase criada com sucesso!'); }
    } catch (err) { showFeedback('error', 'Erro ao criar fase.'); }
  };

  const handleToggleStageActive = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`${baseUrl}/tickets/stages/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !currentStatus }) });
      loadStages(); onStagesChanged();
    } catch (err) { showFeedback('error', 'Erro ao atualizar fase.'); }
  };

  const handleDeleteStage = (id: string) => {
    setConfirmModal({
      title: "Apagar Fase?", message: "Tem a certeza que deseja apagar esta fase permanentemente? As suas OS poderão ser afetadas.",
      onConfirm: async () => {
        try {
          const res = await fetch(`${baseUrl}/tickets/stages/${id}`, { method: 'DELETE' });
          if (res.ok) { loadStages(); onStagesChanged(); showFeedback('success', 'Fase removida permanentemente.'); } 
          else { const data = await res.json(); showFeedback('error', data.message || "Erro ao apagar fase."); }
        } catch (err) { showFeedback('error', 'Erro de conexão.'); }
        setConfirmModal(null);
      },
      onClose: () => setConfirmModal(null)
    });
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const newStages = [...allStages];
    if (direction === 'up' && index > 0) { [newStages[index - 1], newStages[index]] = [newStages[index], newStages[index - 1]]; } 
    else if (direction === 'down' && index < newStages.length - 1) { [newStages[index + 1], newStages[index]] = [newStages[index], newStages[index + 1]]; } 
    else return;

    const payload = newStages.map((s, i) => ({ id: s.id, order: i + 1 }));
    setAllStages(newStages); 
    try {
      await fetch(`${baseUrl}/tickets/stages/reorder`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stages: payload }) });
      onStagesChanged();
    } catch (err) { showFeedback('error', 'Erro ao reordenar fases.'); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200" onMouseDown={e => e.stopPropagation()}>
        <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100">
          <h3 className="font-semibold leading-none tracking-tight text-lg">Fases do Funil</h3>
          <p className="text-sm text-slate-500">Adicione, ordene ou remova as colunas do Kanban.</p>
        </div>
        
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" placeholder="Nova Fase (Ex: Em Análise)" className="flex-1 flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none" value={newStageName} onChange={e => setNewStageName(e.target.value)} />
            <div className="flex items-center gap-1.5 bg-white px-3 border border-slate-200 rounded-md">
              {PREDEFINED_COLORS.map(c => (
                <button key={c} onClick={() => setNewStageColor(c)} className={`w-5 h-5 rounded-full transition-all ${newStageColor === c ? 'ring-2 ring-offset-1 ring-slate-400' : 'opacity-70 hover:opacity-100'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
            <button onClick={handleCreateStage} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-10 px-4">Adicionar</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2 bg-white">
          {allStages.map((stage, index) => (
            <div key={stage.id} className={`flex items-center justify-between p-3 rounded-md border ${stage.isActive ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => handleReorder(index, 'up')} disabled={index===0} className="text-slate-400 hover:text-slate-800 disabled:opacity-30"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M14.77 12.79a.75.75 0 0 1-1.06-.02L10 8.832 6.29 12.77a.75.75 0 1 1-1.08-1.04l4.25-4.5a.75.75 0 0 1 1.08 0l4.25 4.5a.75.75 0 0 1-.02 1.06Z" clipRule="evenodd" /></svg></button>
                  <button onClick={() => handleReorder(index, 'down')} disabled={index===allStages.length-1} className="text-slate-400 hover:text-slate-800 disabled:opacity-30"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" /></svg></button>
                </div>
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: stage.color }}></div>
                <span className="font-medium text-slate-800 text-sm">{stage.name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggleStageActive(stage.id, stage.isActive)} className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded">
                  {stage.isActive ? 'Desativar' : 'Ativar'}
                </button>
                <button onClick={() => handleDeleteStage(stage.id)} className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
           <button onClick={onClose} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 h-9 px-4">Fechar</button>
        </div>
      </div>
    </div>
  );
}