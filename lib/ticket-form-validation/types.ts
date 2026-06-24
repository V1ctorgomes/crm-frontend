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
