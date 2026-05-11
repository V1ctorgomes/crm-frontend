'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import {
  CATALOG_CATEGORY_LABELS,
  TICKET_CATALOG_ORDER,
  type TicketCatalogCategory,
} from '@/lib/ticket-catalog-types';

type CatalogRow = {
  id: string;
  category: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

export function CatalogOsManager({ showFeedback }: { showFeedback: (type: 'success' | 'error', msg: string) => void }) {
  const [items, setItems] = useState<CatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState<Record<TicketCatalogCategory, string>>({
    MARCA: '',
    MODELO: '',
    CUSTOMER_TYPE: '',
    TICKET_TYPE: '',
  });
  const [savingCat, setSavingCat] = useState<TicketCatalogCategory | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiRequest('/ticket-catalog/manage');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      showFeedback('error', 'Erro ao carregar o catálogo de OS.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carregar uma vez ao montar
  }, []);

  const byCategory = (cat: TicketCatalogCategory) =>
    items.filter((i) => i.category === cat).sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));

  const addItem = async (category: TicketCatalogCategory) => {
    const label = newLabel[category].trim();
    if (label.length < 2) {
      showFeedback('error', 'Indique pelo menos 2 caracteres.');
      return;
    }
    setSavingCat(category);
    try {
      await apiRequest('/ticket-catalog/manage', {
        method: 'POST',
        body: JSON.stringify({ category, label }),
      });
      setNewLabel((prev) => ({ ...prev, [category]: '' }));
      await load();
      showFeedback('success', 'Item adicionado.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao adicionar.';
      showFeedback('error', msg);
    } finally {
      setSavingCat(null);
    }
  };

  const removeItem = async (id: string) => {
    if (!window.confirm('Eliminar este item? OS antigas mantêm o texto gravado.')) return;
    try {
      await apiRequest(`/ticket-catalog/manage/${id}`, { method: 'DELETE' });
      await load();
      showFeedback('success', 'Item removido.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao eliminar.';
      showFeedback('error', msg);
    }
  };

  const toggleActive = async (row: CatalogRow) => {
    try {
      await apiRequest(`/ticket-catalog/manage/${row.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !row.isActive }),
      });
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar.';
      showFeedback('error', msg);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {TICKET_CATALOG_ORDER.map((cat) => (
        <div
          key={cat}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="text-base font-semibold text-brand-950 border-b border-slate-100 pb-2 mb-3">
            {CATALOG_CATEGORY_LABELS[cat]}
          </h3>
          <ul className="mb-4 max-h-52 space-y-1.5 overflow-y-auto text-sm">
            {byCategory(cat).length === 0 && (
              <li className="text-slate-500 italic py-2">Nenhum item — adicione abaixo.</li>
            )}
            {byCategory(cat).map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50/80 px-2 py-1.5"
              >
                <span className={`truncate font-medium ${row.isActive ? 'text-brand-950' : 'text-slate-400 line-through'}`}>
                  {row.label}
                </span>
                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => toggleActive(row)}
                    className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 hover:bg-brand-50"
                  >
                    {row.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(row.id)}
                    className="rounded px-2 py-0.5 text-[10px] font-semibold text-red-600 hover:bg-red-50"
                  >
                    Remover
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              type="text"
              className="h-9 min-w-0 flex-1 rounded-md border border-slate-300 px-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              placeholder={`Novo ${CATALOG_CATEGORY_LABELS[cat].toLowerCase()}…`}
              value={newLabel[cat]}
              onChange={(e) => setNewLabel((prev) => ({ ...prev, [cat]: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(cat))}
            />
            <button
              type="button"
              disabled={savingCat === cat}
              onClick={() => addItem(cat)}
              className="h-9 shrink-0 rounded-md bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {savingCat === cat ? '…' : 'Adicionar'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
