import { onlyDigits } from './cpf-cnpj';
import type { CreateTicketFormInput } from './types';
import {
  minText,
  resolveCompanyIdForCreate,
  validateCatalogFields,
  validateEmailField,
  validateTaxIdForCreate,
} from './ticket-fields';

/**
 * Valida criação de OS (página Solicitações + WhatsApp).
 * Devolve corpo pronto para API (`cpf` só com dígitos, email em minúsculas).
 * @param availableCompanyIds empresas (IDs) vinculadas ao contacto seleccionado — usado para validar `companyId`.
 */
export function validateCreateTicketForm(
  input: Partial<CreateTicketFormInput> & { availableCompanyIds?: string[] },
): { ok: true; body: CreateTicketFormInput } | { ok: false; message: string } {
  if (!String(input.contactNumber || '').trim()) {
    return { ok: false, message: 'Selecione o solicitante (contato vinculado à empresa).' };
  }
  const contactNumber = onlyDigits(String(input.contactNumber || ''));
  if (!contactNumber || contactNumber.length < 10) {
    return { ok: false, message: 'Número de contato inválido (mínimo 10 dígitos).' };
  }

  const stageId = String(input.stageId || '').trim();
  if (!stageId) return { ok: false, message: 'Não existe fase no funil. Configure as fases antes de criar uma OS.' };

  const available = input.availableCompanyIds || [];
  const requestedCompany =
    input.companyId === undefined || input.companyId === null ? '' : String(input.companyId).trim();
  const usesCompany = available.length > 0 || !!requestedCompany;

  let err = minText(String(input.nome || ''), usesCompany ? 'Empresa (cliente)' : 'Nome completo');
  if (err) return { ok: false, message: err };

  const emailResult = validateEmailField(String(input.email || ''));
  if (!emailResult.ok) return { ok: false, message: emailResult.message };

  const taxResult = validateTaxIdForCreate(String(input.cpf || ''), usesCompany);
  if (!taxResult.ok) return { ok: false, message: taxResult.message };

  err = validateCatalogFields({
    marca: String(input.marca || ''),
    modelo: String(input.modelo || ''),
    customerType: String(input.customerType || ''),
    ticketType: String(input.ticketType || ''),
  });
  if (err) return { ok: false, message: err };

  const companyResult = resolveCompanyIdForCreate(available, requestedCompany);
  if (!companyResult.ok) return { ok: false, message: companyResult.message };

  const body: CreateTicketFormInput = {
    contactNumber,
    nome: String(input.nome).trim(),
    email: emailResult.email,
    cpf: taxResult.taxDigits,
    marca: String(input.marca).trim(),
    modelo: String(input.modelo).trim(),
    customerType: String(input.customerType).trim(),
    ticketType: String(input.ticketType).trim(),
    stageId,
  };
  if (companyResult.companyId) body.companyId = companyResult.companyId;
  return { ok: true, body };
}
