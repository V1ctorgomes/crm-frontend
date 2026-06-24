import { isValidEmail } from './email';
import { isValidCpf, isValidCpfOrCnpj, onlyDigits } from './cpf-cnpj';

/** Texto genérico: não vazio e com pelo menos 2 caracteres úteis após trim. */
export function minText(v: string, label: string): string | null {
  const t = v.trim();
  if (!t) return `O campo «${label}» é obrigatório.`;
  if (t.length < 2) return `O campo «${label}» deve ter pelo menos 2 caracteres.`;
  return null;
}

export function validateEmailField(emailRaw: string): { ok: true; email: string } | { ok: false; message: string } {
  const email = String(emailRaw || '').trim().toLowerCase();
  if (!email) return { ok: false, message: 'O e-mail é obrigatório.' };
  if (!isValidEmail(email)) return { ok: false, message: 'Indique um e-mail válido (ex.: nome@empresa.pt).' };
  return { ok: true, email };
}

export function validateCatalogFields(input: {
  marca: string;
  modelo: string;
  customerType: string;
  ticketType: string;
}): string | null {
  let err = minText(String(input.marca || ''), 'Marca');
  if (err) return err;
  err = minText(String(input.modelo || ''), 'Modelo');
  if (err) return err;
  err = minText(String(input.customerType || ''), 'Tipo de cliente');
  if (err) return err;
  err = minText(String(input.ticketType || ''), 'Tipo de solicitação');
  if (err) return err;
  return null;
}

export function validateTaxIdForCreate(
  cpfRaw: string,
  usesCompany: boolean,
): { ok: true; taxDigits: string } | { ok: false; message: string } {
  const taxDigits = onlyDigits(String(cpfRaw || ''));
  if (!taxDigits) {
    return {
      ok: false,
      message: usesCompany ? 'O CPF do solicitante é obrigatório.' : 'O CPF ou CNPJ é obrigatório.',
    };
  }
  if (usesCompany) {
    if (taxDigits.length !== 11) {
      return { ok: false, message: 'O CPF do solicitante deve ter 11 dígitos.' };
    }
    if (!isValidCpf(taxDigits)) {
      return { ok: false, message: 'CPF do solicitante inválido (dígitos verificadores incorretos).' };
    }
  } else if (taxDigits.length !== 11 && taxDigits.length !== 14) {
    return { ok: false, message: 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos (use apenas números ou a máscara).' };
  } else if (!isValidCpfOrCnpj(taxDigits)) {
    return { ok: false, message: 'CPF ou CNPJ inválido (dígitos verificadores incorretos).' };
  }
  return { ok: true, taxDigits };
}

export function validateTaxIdForUpdate(cpfRaw: string): { ok: true; taxDigits: string } | { ok: false; message: string } {
  const taxDigits = onlyDigits(String(cpfRaw || ''));
  if (!taxDigits) return { ok: false, message: 'O CPF ou CNPJ é obrigatório.' };
  if (taxDigits.length !== 11 && taxDigits.length !== 14) {
    return { ok: false, message: 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos (use apenas números ou a máscara).' };
  }
  if (!isValidCpfOrCnpj(taxDigits)) {
    return { ok: false, message: 'CPF ou CNPJ inválido (dígitos verificadores incorretos).' };
  }
  return { ok: true, taxDigits };
}

export function resolveCompanyIdForCreate(
  available: string[],
  requested: string,
): { ok: true; companyId: string | null } | { ok: false; message: string } {
  if (available.length === 0 && !requested) {
    return { ok: false, message: 'Seleccione a empresa (cliente) antes de criar a solicitação.' };
  }
  if (available.length > 1) {
    if (!requested) {
      return {
        ok: false,
        message: 'Este contato tem várias empresas vinculadas. Seleccione qual está a solicitar esta OS.',
      };
    }
    if (!available.includes(requested)) {
      return { ok: false, message: 'A empresa seleccionada não está vinculada a este contato.' };
    }
    return { ok: true, companyId: requested };
  }
  if (available.length === 1) {
    if (requested && requested !== available[0]) {
      return { ok: false, message: 'A empresa seleccionada não corresponde ao contato.' };
    }
    return { ok: true, companyId: available[0] };
  }
  if (requested) {
    return {
      ok: false,
      message: 'Este contato ainda não tem empresas vinculadas. Vincule uma em Contatos antes de criar a OS.',
    };
  }
  return { ok: true, companyId: null };
}

export function resolveCompanyIdForUpdate(
  available: string[],
  requested: string,
  initialCompanyId?: string | null,
): { ok: true; companyId: string | null | undefined } | { ok: false; message: string } {
  let companyId: string | null | undefined = undefined;

  if (available.length === 0) {
    if (requested) {
      return {
        ok: false,
        message: 'Este contato ainda não tem empresas vinculadas. Vincule uma em Contatos antes de mudar a empresa da OS.',
      };
    }
    if (initialCompanyId) {
      companyId = null;
    }
  } else {
    if (!requested) {
      return {
        ok: false,
        message: 'Seleccione a empresa solicitante desta OS (vinculada a este contato).',
      };
    }
    if (!available.includes(requested)) {
      return { ok: false, message: 'A empresa seleccionada não está vinculada a este contato.' };
    }
    if (requested !== (initialCompanyId || '')) {
      companyId = requested;
    }
  }

  return { ok: true, companyId };
}
