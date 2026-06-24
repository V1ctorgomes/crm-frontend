'use client';

import React from 'react';
import { User, Link as LinkIcon, Bell, X } from 'lucide-react';
import { Toast } from '@/components/ui/toast';
import type { SettingsTab } from '../types';

type SettingsModalChromeProps = {
  onClose: () => void;
  toast: { type: 'success' | 'error'; message: string } | null;
  onDismissToast: () => void;
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  children: React.ReactNode;
};

export function SettingsModalChrome({
  onClose,
  toast,
  onDismissToast,
  activeTab,
  onTabChange,
  children,
}: SettingsModalChromeProps) {
  return (
    <div
      className="bg-brand-canvas rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] h-[700px] overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200"
      onMouseDown={(e) => e.stopPropagation()}
    >
        {toast && <Toast type={toast.type} message={toast.message} onDismiss={onDismissToast} />}

        <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-brand-950">Configurações da Conta</h2>
            <p className="text-sm text-slate-500">Gira as suas preferências e integrações do sistema.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto border-b md:border-b-0">
            <button
              type="button"
              onClick={() => onTabChange('perfil')}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all text-left ${
                activeTab === 'perfil'
                  ? 'bg-white text-brand-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-brand-950 border border-transparent'
              }`}
            >
              <User className={`w-5 h-5 ${activeTab === 'perfil' ? 'text-brand-600' : 'text-slate-400'}`} /> O Meu
              Perfil
            </button>
            <button
              type="button"
              onClick={() => onTabChange('conexoes')}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all text-left ${
                activeTab === 'conexoes'
                  ? 'bg-white text-brand-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-brand-950 border border-transparent'
              }`}
            >
              <LinkIcon className={`w-5 h-5 ${activeTab === 'conexoes' ? 'text-brand-600' : 'text-slate-400'}`} />{' '}
              Conexões API
            </button>
            <button
              type="button"
              onClick={() => onTabChange('notificacoes')}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all text-left ${
                activeTab === 'notificacoes'
                  ? 'bg-white text-brand-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-brand-950 border border-transparent'
              }`}
            >
              <Bell className={`w-5 h-5 ${activeTab === 'notificacoes' ? 'text-brand-600' : 'text-slate-400'}`} />{' '}
              Notificações
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white no-scrollbar relative">{children}</div>
        </div>
    </div>
  );
}
