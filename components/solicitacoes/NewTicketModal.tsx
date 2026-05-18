import React, { useEffect, useState } from 'react';
import { Stage } from './types';
import { apiRequest } from '@/lib/api-client';
import { formatCpfCnpjInput, validateCreateTicketForm } from '@/lib/ticket-form-validation';
import {
  type Company,
  type CompanyDetail,
  type CompanyLinkedContact,
  describeCompany,
  ticketFormFieldsFromCompany,
  solicitanteCpfFromContact,
} from '@/lib/companies';
import { CATALOG_CATEGORY_LABELS } from '@/lib/ticket-catalog-types';
import { useTicketCatalog } from '@/lib/use-ticket-catalog';

interface NewTicketModalProps {
  stages: Stage[];
  onClose: () => void;
  onSuccess: () => void;
  showFeedback: (type: 'success' | 'error', msg: string) => void;
}

const SELECT =
  'flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 text-brand-950';
const INPUT =
  'flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600';

/** Nova OS em Solicitações: empresa (cliente) → solicitante (contato) → catálogo. */
export function NewTicketModal({ stages, onClose, onSuccess, showFeedback }: NewTicketModalProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [formCompanyId, setFormCompanyId] = useState('');
  const [linkedContacts, setLinkedContacts] = useState<CompanyLinkedContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedContactNumber, setSelectedContactNumber] = useState('');
  const [formNome, setFormNome] = useState('');
  const [formCompanyCnpj, setFormCompanyCnpj] = useState('');
  const [formSolicitanteCpf, setFormSolicitanteCpf] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [formCustomerType, setFormCustomerType] = useState('');
  const [formTicketType, setFormTicketType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { catalog, loading: catalogLoading, ready: catalogReady } = useTicketCatalog();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCompaniesLoading(true);
      try {
        const data = await apiRequest<Company[]>('/companies');
        if (!cancelled) setCompanies(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setCompanies([]);
      } finally {
        if (!cancelled) setCompaniesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!formCompanyId) {
      setLinkedContacts([]);
      setSelectedContactNumber('');
      setFormNome('');
      setFormCompanyCnpj('');
      setFormSolicitanteCpf('');
      setFormEmail('');
      return;
    }

    const summary = companies.find((c) => c.id === formCompanyId);
    if (summary) {
      const fields = ticketFormFieldsFromCompany(summary);
      setFormNome(fields.nome);
      setFormCompanyCnpj(fields.cpf);
    }

    let cancelled = false;
    (async () => {
      setContactsLoading(true);
      setSelectedContactNumber('');
      setFormEmail('');
      setFormSolicitanteCpf('');
      try {
        const detail = await apiRequest<CompanyDetail>(`/companies/${formCompanyId}`);
        if (cancelled) return;
        if (!detail) {
          setLinkedContacts([]);
          return;
        }
        const list = detail.contacts || [];
        setLinkedContacts(list);
        if (list.length === 1) {
          setSelectedContactNumber(list[0].number);
          setFormEmail((list[0].email || '').trim().toLowerCase());
          setFormSolicitanteCpf(solicitanteCpfFromContact(list[0].cnpj));
        }
      } catch {
        if (!cancelled) setLinkedContacts([]);
      } finally {
        if (!cancelled) setContactsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [formCompanyId, companies]);

  const onSelectContact = (number: string) => {
    setSelectedContactNumber(number);
    const contact = linkedContacts.find((c) => c.number === number);
    setFormEmail((contact?.email || '').trim().toLowerCase());
    setFormSolicitanteCpf(solicitanteCpfFromContact(contact?.cnpj));
  };

  const handleCreateTicket = async () => {
    if (stages.length === 0) {
      return showFeedback('error', 'Configure pelo menos uma fase no funil antes de criar uma OS.');
    }
    const validated = validateCreateTicketForm({
      contactNumber: selectedContactNumber,
      nome: formNome,
      email: formEmail,
      cpf: formSolicitanteCpf,
      marca: formMarca,
      modelo: formModelo,
      customerType: formCustomerType,
      ticketType: formTicketType,
      stageId: stages[0]?.id || '',
      availableCompanyIds: formCompanyId ? [formCompanyId] : [],
      companyId: formCompanyId || undefined,
    });
    if (!validated.ok) {
      return showFeedback('error', validated.message);
    }

    setIsSubmitting(true);
    try {
      await apiRequest('/tickets', { method: 'POST', body: JSON.stringify(validated.body) });
      showFeedback('success', 'Ordem de Serviço (OS) criada com sucesso!');
      onSuccess();
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'Erro ao criar OS.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100">
          <h3 className="font-semibold leading-none tracking-tight text-lg">Nova Solicitação (OS)</h3>
          <p className="text-sm text-slate-500">
            Seleccione a empresa (cliente) e depois o solicitante que está a pedir o serviço.
          </p>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          {catalogLoading && <p className="text-xs text-slate-500">A carregar listas…</p>}
          {!catalogLoading && !catalogReady && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Catálogo de OS incompleto. Peça a um <strong>Developer</strong> para preencher as listas.
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Empresa (cliente) <span className="text-red-600">*</span>
            </label>
            {companiesLoading ? (
              <p className="text-xs text-slate-500">A carregar empresas…</p>
            ) : companies.length === 0 ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Nenhuma empresa cadastrada. Cadastre em <strong>Contatos → Empresas</strong>.
              </div>
            ) : (
              <select className={SELECT} value={formCompanyId} onChange={(e) => setFormCompanyId(e.target.value)}>
                <option value="">— Selecione a empresa —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {describeCompany(c)}
                    {c.contactCount != null ? ` (${c.contactCount} contato${c.contactCount === 1 ? '' : 's'})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {formCompanyId && (
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-col gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Razão social / nome fantasia</label>
                <input type="text" readOnly className={`${INPUT} border-slate-200 text-slate-700`} value={formNome} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">CNPJ da empresa</label>
                <input type="text" readOnly className={`${INPUT} border-slate-200 font-mono text-slate-700`} value={formCompanyCnpj} />
              </div>

              <div className="space-y-1 pt-1 border-t border-slate-200">
                <label className="text-xs font-medium text-slate-600">
                  Solicitante (contato) <span className="text-red-600">*</span>
                </label>
                {contactsLoading ? (
                  <p className="text-xs text-slate-500">A carregar contatos…</p>
                ) : linkedContacts.length === 0 ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Esta empresa não tem contatos vinculados. Vincule em <strong>Contatos → Empresas</strong>.
                  </div>
                ) : (
                  <select
                    className={SELECT}
                    value={selectedContactNumber}
                    onChange={(e) => onSelectContact(e.target.value)}
                  >
                    <option value="">— Selecione o solicitante —</option>
                    {linkedContacts.map((c) => (
                      <option key={c.number} value={c.number}>
                        {c.name || 'Sem nome'} ({c.number})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedContactNumber && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">CPF do solicitante *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={`${INPUT} font-mono`}
                      value={formSolicitanteCpf}
                      onChange={(e) => setFormSolicitanteCpf(formatCpfCnpjInput(e.target.value))}
                      placeholder="000.000.000-00"
                    />
                    <p className="text-[10px] text-slate-500">Gravado no perfil do contato. Pode actualizar aqui se ainda não tiver.</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">E-mail do solicitante *</label>
                    <input
                      type="email"
                      className={INPUT}
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      onBlur={(e) => setFormEmail(e.target.value.trim().toLowerCase())}
                      placeholder="nome@empresa.pt"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <CatalogSelect
              label={CATALOG_CATEGORY_LABELS.MARCA}
              ready={catalogReady}
              value={formMarca}
              options={catalog?.MARCA || []}
              onChange={setFormMarca}
            />
            <CatalogSelect
              label={CATALOG_CATEGORY_LABELS.MODELO}
              ready={catalogReady}
              value={formModelo}
              options={catalog?.MODELO || []}
              onChange={setFormModelo}
            />
          </div>
          <div className="flex gap-4">
            <CatalogSelect
              label={CATALOG_CATEGORY_LABELS.CUSTOMER_TYPE}
              ready={catalogReady}
              value={formCustomerType}
              options={catalog?.CUSTOMER_TYPE || []}
              onChange={setFormCustomerType}
            />
            <CatalogSelect
              label={CATALOG_CATEGORY_LABELS.TICKET_TYPE}
              ready={catalogReady}
              value={formTicketType}
              options={catalog?.TICKET_TYPE || []}
              onChange={setFormTicketType}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-6 pt-0 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 h-10 px-4 py-2 border border-slate-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleCreateTicket()}
            disabled={isSubmitting || catalogLoading || !catalogReady}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 h-10 px-4 py-2 disabled:opacity-50"
          >
            {isSubmitting ? 'A criar...' : 'Criar OS'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CatalogSelect({
  label,
  ready,
  value,
  options,
  onChange,
}: {
  label: string;
  ready: boolean;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex-1 space-y-2">
      <label className="text-sm font-medium leading-none text-slate-700">
        {label} <span className="text-red-600">*</span>
      </label>
      <select
        disabled={!ready}
        className={`${SELECT} disabled:bg-slate-100`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Selecione —</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
