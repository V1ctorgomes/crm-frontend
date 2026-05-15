/** Apenas dígitos, máx. 14 (CNPJ). */
export function onlyDigits(s: string): string {
  return String(s || '').replace(/\D/g, '');
}

/** Máscara progressiva CPF (≤11) ou CNPJ (12–14). */
export function formatCpfCnpjInput(raw: string): string {
  const digits = onlyDigits(raw).slice(0, 14);
  if (digits.length === 0) return '';
  if (digits.length <= 11) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  const d = digits;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export function isValidEmail(email: string): boolean {
  const e = email.trim();
  if (e.length > 254) return false;
  return EMAIL_RE.test(e);
}

export function isValidCpf(cpf: string): boolean {
  const n = onlyDigits(cpf);
  if (n.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(n)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(n.charAt(i), 10) * (10 - i);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;
  if (d1 !== parseInt(n.charAt(9), 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(n.charAt(i), 10) * (11 - i);
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;
  return d2 === parseInt(n.charAt(10), 10);
}

export function isValidCnpj(cnpj: string): boolean {
  const n = onlyDigits(cnpj);
  if (n.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(n)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let t = 0;
  for (let i = 0; i < 12; i++) t += parseInt(n.charAt(i), 10) * w1[i];
  let d1 = t % 11 < 2 ? 0 : 11 - (t % 11);
  if (d1 !== parseInt(n.charAt(12), 10)) return false;
  t = 0;
  for (let i = 0; i < 13; i++) t += parseInt(n.charAt(i), 10) * w2[i];
  let d2 = t % 11 < 2 ? 0 : 11 - (t % 11);
  return d2 === parseInt(n.charAt(13), 10);
}

export function isValidCpfOrCnpj(value: string): boolean {
  const n = onlyDigits(value);
  if (n.length === 11) return isValidCpf(n);
  if (n.length === 14) return isValidCnpj(n);
  return false;
}

export type CreateTicketFormInput = {
  contactNumber: string;
  nome: string;
  email: string;
  cpf: string;
  marca: string;
  modelo: string;
  customerType: string;
  ticketType: string;
  stageId: string;
  companyId?: string | null;
};

/** Corpo para PUT /tickets/:id (sem contacto nem fase). */
export type UpdateTicketFormInput = {
  nome: string;
  email: string;
  cpf: string;
  marca: string;
  modelo: string;
  customerType: string;
  ticketType: string;
  /** `string`: nova empresa; `null`: desvincular; ausente: manter como está. */
  companyId?: string | null;
};

/** Texto genérico: não vazio e com pelo menos 2 caracteres úteis após trim. */
function minText(v: string, label: string): string | null {
  const t = v.trim();
  if (!t) return `O campo «${label}» é obrigatório.`;
  if (t.length < 2) return `O campo «${label}» deve ter pelo menos 2 caracteres.`;
  return null;
}

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

  const email = String(input.email || '').trim().toLowerCase();
  if (!email) return { ok: false, message: 'O e-mail é obrigatório.' };
  if (!isValidEmail(email)) return { ok: false, message: 'Indique um e-mail válido (ex.: nome@empresa.pt).' };

  const taxDigits = onlyDigits(String(input.cpf || ''));
  if (!taxDigits) return { ok: false, message: usesCompany ? 'O CNPJ da empresa é obrigatório.' : 'O CPF ou CNPJ é obrigatório.' };
  if (usesCompany && taxDigits.length !== 14) {
    return { ok: false, message: 'O CNPJ da empresa deve ter 14 dígitos.' };
  }
  if (taxDigits.length !== 11 && taxDigits.length !== 14) {
    return { ok: false, message: 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos (use apenas números ou a máscara).' };
  }
  if (!isValidCpfOrCnpj(taxDigits)) {
    return { ok: false, message: 'CPF ou CNPJ inválido (dígitos verificadores incorretos).' };
  }

  err = minText(String(input.marca || ''), 'Marca');
  if (err) return { ok: false, message: err };

  err = minText(String(input.modelo || ''), 'Modelo');
  if (err) return { ok: false, message: err };

  err = minText(String(input.customerType || ''), 'Tipo de cliente');
  if (err) return { ok: false, message: err };

  err = minText(String(input.ticketType || ''), 'Tipo de solicitação');
  if (err) return { ok: false, message: err };

  const requested = requestedCompany;
  let companyId: string | null = null;
  if (available.length === 0 && !requested) {
    return {
      ok: false,
      message: 'Seleccione a empresa (cliente) antes de criar a solicitação.',
    };
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
    companyId = requested;
  } else if (available.length === 1) {
    if (requested && requested !== available[0]) {
      return { ok: false, message: 'A empresa seleccionada não corresponde ao contato.' };
    }
    companyId = available[0];
  } else if (requested) {
    return {
      ok: false,
      message: 'Este contato ainda não tem empresas vinculadas. Vincule uma em Contatos antes de criar a OS.',
    };
  }

  const body: CreateTicketFormInput = {
    contactNumber,
    nome: String(input.nome).trim(),
    email,
    cpf: taxDigits,
    marca: String(input.marca).trim(),
    modelo: String(input.modelo).trim(),
    customerType: String(input.customerType).trim(),
    ticketType: String(input.ticketType).trim(),
    stageId,
  };
  if (companyId) body.companyId = companyId;
  return { ok: true, body };
}

/** Valida edição de OS (mesmos campos que a criação, excepto número e fase). */
export function validateUpdateTicketForm(
  input: Partial<Omit<CreateTicketFormInput, 'contactNumber' | 'stageId'>> & {
    availableCompanyIds?: string[];
    initialCompanyId?: string | null;
  },
): { ok: true; body: UpdateTicketFormInput } | { ok: false; message: string } {
  let err = minText(String(input.nome || ''), 'Nome completo');
  if (err) return { ok: false, message: err };

  const email = String(input.email || '').trim().toLowerCase();
  if (!email) return { ok: false, message: 'O e-mail é obrigatório.' };
  if (!isValidEmail(email)) return { ok: false, message: 'Indique um e-mail válido (ex.: nome@empresa.pt).' };

  const taxDigits = onlyDigits(String(input.cpf || ''));
  if (!taxDigits) return { ok: false, message: 'O CPF ou CNPJ é obrigatório.' };
  if (taxDigits.length !== 11 && taxDigits.length !== 14) {
    return { ok: false, message: 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos (use apenas números ou a máscara).' };
  }
  if (!isValidCpfOrCnpj(taxDigits)) {
    return { ok: false, message: 'CPF ou CNPJ inválido (dígitos verificadores incorretos).' };
  }

  err = minText(String(input.marca || ''), 'Marca');
  if (err) return { ok: false, message: err };

  err = minText(String(input.modelo || ''), 'Modelo');
  if (err) return { ok: false, message: err };

  err = minText(String(input.customerType || ''), 'Tipo de cliente');
  if (err) return { ok: false, message: err };

  err = minText(String(input.ticketType || ''), 'Tipo de solicitação');
  if (err) return { ok: false, message: err };

  const available = input.availableCompanyIds || [];
  const requested =
    input.companyId === undefined || input.companyId === null ? '' : String(input.companyId).trim();
  let companyId: string | null | undefined = undefined;

  if (available.length === 0) {
    if (requested) {
      return {
        ok: false,
        message: 'Este contato ainda não tem empresas vinculadas. Vincule uma em Contatos antes de mudar a empresa da OS.',
      };
    }
    if (input.initialCompanyId) {
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
    if (requested !== (input.initialCompanyId || '')) {
      companyId = requested;
    }
  }

  const body: UpdateTicketFormInput = {
    nome: String(input.nome).trim(),
    email,
    cpf: taxDigits,
    marca: String(input.marca).trim(),
    modelo: String(input.modelo).trim(),
    customerType: String(input.customerType).trim(),
    ticketType: String(input.ticketType).trim(),
  };
  if (companyId !== undefined) body.companyId = companyId;
  return { ok: true, body };
}
