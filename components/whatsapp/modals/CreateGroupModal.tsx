'use client';

import React, { useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import type { Contact } from '@/components/whatsapp/types';

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  selectedInstance: string;
  instances: { name: string }[];
  onCreated: (contact: Contact) => void;
  onToast: (type: 'success' | 'error', message: string) => void;
}

function parseParticipants(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.replace(/\D/g, ''))
    .filter((d) => d.length >= 10);
}

export function CreateGroupModal({
  open,
  onClose,
  selectedInstance,
  instances,
  onCreated,
  onToast,
}: CreateGroupModalProps) {
  const [subject, setSubject] = useState('');
  const [participantsText, setParticipantsText] = useState('');
  const [description, setDescription] = useState('');
  const [instanceName, setInstanceName] = useState('');
  const [saving, setSaving] = useState(false);

  const instanceOptions =
    selectedInstance !== 'ALL' ? [selectedInstance] : instances.map((i) => i.name).filter(Boolean);

  const effectiveInstance = instanceName || instanceOptions[0] || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sub = subject.trim();
    const parts = parseParticipants(participantsText);
    if (!sub) {
      onToast('error', 'Indique o nome do grupo.');
      return;
    }
    if (sub.length > 25) {
      onToast('error', 'O nome do grupo tem no máximo 25 caracteres.');
      return;
    }
    if (parts.length < 1) {
      onToast('error', 'Indique pelo menos um número com WhatsApp (DDI + DDD + número).');
      return;
    }
    if (!effectiveInstance) {
      onToast('error', 'Seleccione uma instância conectada.');
      return;
    }

    setSaving(true);
    try {
      const res = await apiRequest<{ groupJid: string; subject: string }>('/whatsapp/groups/create', {
        method: 'POST',
        body: JSON.stringify({
          subject: sub,
          participants: parts,
          description: description.trim() || undefined,
          instanceName: effectiveInstance,
        }),
      });
      if (!res?.groupJid) {
        onToast('error', 'Resposta inválida do servidor.');
        return;
      }
      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const contact: Contact = {
        number: res.groupJid,
        name: res.subject || sub,
        lastMessage: 'Grupo criado',
        lastMessageTime: timeNow,
        instanceName: effectiveInstance,
        contactKind: 'INTERNAL',
      };
      onToast('success', 'Grupo criado. Já pode enviar mensagens.');
      onCreated(contact);
      setSubject('');
      setParticipantsText('');
      setDescription('');
      setInstanceName('');
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Erro ao criar grupo.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-brand-950/45 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <form
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={(e) => void handleSubmit(e)}
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-brand-950">Novo grupo WhatsApp</h2>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            O WhatsApp exige pelo menos um participante além de si. Na instância Evolution, desactive «ignorar grupos» para
            receber mensagens dos grupos aqui no CRM.
          </p>
        </div>
        <div className="space-y-3 px-5 py-4">
          {instanceOptions.length > 1 && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Instância
              </label>
              <select
                value={instanceName || instanceOptions[0] || ''}
                onChange={(e) => setInstanceName(e.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 px-2 text-sm"
              >
                {instanceOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Nome do grupo
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={25}
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
              placeholder="Ex.: Equipa interna"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Números a convidar (DDI + DDD + número)
            </label>
            <textarea
              value={participantsText}
              onChange={(e) => setParticipantsText(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
              placeholder={"5511999999999\n5511888888888"}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Descrição (opcional)
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
              placeholder="Opcional"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-9 rounded-md bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? 'A criar…' : 'Criar grupo'}
          </button>
        </div>
      </form>
    </div>
  );
}
