import React from 'react';
import { User } from './types';

interface UserFormModalProps {
  editingUser: User | null;
  formName: string;
  setFormName: (val: string) => void;
  formEmail: string;
  setFormEmail: (val: string) => void;
  formRole: string;
  setFormRole: (val: string) => void;
  formPassword: string;
  setFormPassword: (val: string) => void;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function UserFormModal({
  editingUser, formName, setFormName, formEmail, setFormEmail, formRole, setFormRole, formPassword, setFormPassword, isSaving, onClose, onSave
}: UserFormModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col" onMouseDown={e => e.stopPropagation()}>
        <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100">
          <h3 className="font-semibold leading-none tracking-tight text-lg">{editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}</h3>
          <p className="text-sm text-slate-500">{editingUser ? 'Atualize as permissões ou dados do membro.' : 'Adicione um novo membro à sua equipa.'}</p>
        </div>
        
        <div className="p-6 flex flex-col gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">Nome Completo</label>
            <input 
              type="text" 
              className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50" 
              value={formName} 
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ex: Maria Santos"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">Correio Eletrónico</label>
            <input 
              type="email" 
              className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50" 
              value={formEmail} 
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="maria@empresa.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">Nível de Permissão</label>
            <select 
              className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50" 
              value={formRole} 
              onChange={e => setFormRole(e.target.value)}
            >
              <option value="USER">Utilizador (Atendimento)</option>
              <option value="ADMIN">Administrador (Gestão Total)</option>
              <option value="DEVELOPER">Developer (Acesso Técnico)</option>
            </select>
          </div>
          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium leading-none text-slate-700">
              Palavra-passe {editingUser && <span className="font-normal text-slate-400">(opcional)</span>}
            </label>
            <input 
              type="password" 
              className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 font-mono" 
              value={formPassword} 
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-2 p-6 pt-0">
          <button onClick={onClose} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 h-10 px-4 py-2 border border-slate-200 shadow-sm">
            Cancelar
          </button>
          <button onClick={onSave} disabled={isSaving} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-10 px-4 py-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm">
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                A guardar...
              </>
            ) : (
              editingUser ? 'Guardar Alterações' : 'Criar Utilizador'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}