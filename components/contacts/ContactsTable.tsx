import React from 'react';

export interface Contact {
  number: string;
  name: string;
  profilePictureUrl?: string;
  lastMessageTime: string;
  email?: string;
  cnpj?: string;
}

interface ContactsTableProps {
  isLoading: boolean;
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

export function ContactsTable({ isLoading, contacts, onEdit, onDelete }: ContactsTableProps) {
  return (
    <div className="px-6 md:px-8 pb-12 flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 hover:bg-slate-50/50">
                <th className="h-12 px-4 align-middle font-medium text-slate-500">Cliente</th>
                <th className="h-12 px-4 align-middle font-medium text-slate-500">WhatsApp</th>
                <th className="h-12 px-4 align-middle font-medium text-slate-500">E-mail</th>
                <th className="h-12 px-4 align-middle font-medium text-slate-500">CNPJ / CPF</th>
                <th className="h-12 px-4 align-middle font-medium text-slate-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <span className="text-slate-500 font-medium text-sm">A carregar contactos...</span>
                    </div>
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-32 text-center text-slate-500 text-sm">
                    Nenhum contacto encontrado.
                  </td>
                </tr>
              ) : contacts.map((contact) => (
                <tr key={contact.number} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs overflow-hidden shrink-0">
                        {contact.profilePictureUrl ? (
                          <img src={contact.profilePictureUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt={contact.name || ''}/>
                        ) : (
                          (contact.name || '?').substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col max-w-[150px] sm:max-w-[250px]">
                        <span className="font-semibold text-slate-900 truncate">{contact.name || 'Sem nome'}</span>
                        <span className="text-[12px] text-slate-500 truncate">Registado via WhatsApp</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle text-slate-600 font-mono text-[13px]">{contact.number}</td>
                  <td className="p-4 align-middle text-slate-600 truncate max-w-[150px]">{contact.email || '--'}</td>
                  <td className="p-4 align-middle text-slate-600 font-mono text-[13px]">{contact.cnpj || '--'}</td>
                  <td className="p-4 align-middle text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onEdit(contact)} className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors" title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                      </button>
                      <button onClick={() => onDelete(contact)} className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Remover">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}