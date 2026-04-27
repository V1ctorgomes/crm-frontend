import React from 'react';
import { User } from './types';

interface UsuariosTableProps {
  isLoading: boolean;
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UsuariosTable({ isLoading, users, onEdit, onDelete }: UsuariosTableProps) {
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-rose-50 text-rose-700 border border-rose-200">Administrador</span>;
      case 'DEVELOPER': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-purple-50 text-purple-700 border border-purple-200">Developer</span>;
      default: 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200">Utilizador</span>;
    }
  };

  return (
    <div className="px-6 md:px-8 pb-12 flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 hover:bg-slate-50/50">
                <th className="h-12 px-4 align-middle font-medium text-slate-500">Membro</th>
                <th className="h-12 px-4 align-middle font-medium text-slate-500">Correio Eletrónico</th>
                <th className="h-12 px-4 align-middle font-medium text-slate-500">Acesso</th>
                <th className="h-12 px-4 align-middle font-medium text-slate-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <span className="text-slate-500 font-medium text-sm">A carregar a equipa...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="h-32 text-center text-slate-500 text-sm">
                    Nenhum utilizador encontrado.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs overflow-hidden shrink-0">
                          {user.profilePictureUrl ? (
                            <img src={user.profilePictureUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt={user.name} />
                          ) : (
                            user.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col max-w-[150px] sm:max-w-[250px]">
                          <span className="font-semibold text-slate-900 truncate">{user.name}</span>
                          <span className="text-[12px] text-slate-500 truncate">
                            Desde {new Date(user.createdAt).toLocaleDateString('pt-PT')}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-slate-600 truncate max-w-[200px]">
                      {user.email}
                    </td>
                    <td className="p-4 align-middle">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="p-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onEdit(user)} className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors" title="Editar">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                        </button>
                        <button onClick={() => onDelete(user)} className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Remover">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}