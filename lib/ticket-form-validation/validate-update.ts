import type { CreateTicketFormInput, UpdateTicketFormInput } from './types';
import {
  minText,
  resolveCompanyIdForUpdate,
  validateCatalogFields,
  validateEmailField,
  validateTaxIdForUpdate,
} from './ticket-fields';

/** Valida edição de OS (mesmos campos que a criação, excepto número e fase). */
export function validateUpdateTicketForm(
  input: Partial<Omit<CreateTicketFormInput, 'contactNumber' | 'stageId'>> & {
    availableCompanyIds?: string[];
    initialCompanyId?: string | null;
  },
): { ok: true; body: UpdateTicketFormInput } | { ok: false; message: string } {
  let err = minText(String(input.nome || ''), 'Nome completo');
  if (err) return { ok: false, message: err };

  const emailResult = validateEmailField(String(input.email || ''));
  if (!emailResult.ok) return { ok: false, message: emailResult.message };

  const taxResult = validateTaxIdForUpdate(String(input.cpf || ''));
  if (!taxResult.ok) return { ok: false, message: taxResult.message };

  err = validateCatalogFields({
    marca: String(input.marca || ''),
    modelo: String(input.modelo || ''),
    customerType: String(input.customerType || ''),
    ticketType: String(input.ticketType || ''),
  });
  if (err) return { ok: false, message: err };

  const available = input.availableCompanyIds || [];
  const requested =
    input.companyId === undefined || input.companyId === null ? '' : String(input.companyId).trim();
  const companyResult = resolveCompanyIdForUpdate(available, requested, input.initialCompanyId);
  if (!companyResult.ok) return { ok: false, message: companyResult.message };

  const body: UpdateTicketFormInput = {
    nome: String(input.nome).trim(),
    email: emailResult.email,
    cpf: taxResult.taxDigits,
    marca: String(input.marca).trim(),
    modelo: String(input.modelo).trim(),
    customerType: String(input.customerType).trim(),
    ticketType: String(input.ticketType).trim(),
  };
  if (companyResult.companyId !== undefined) body.companyId = companyResult.companyId;
  return { ok: true, body };
}
