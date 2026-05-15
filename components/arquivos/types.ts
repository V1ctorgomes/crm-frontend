export interface TicketFile {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  description?: string;
  createdAt: string;
}

export interface TicketFolder {
  id: string;
  marca: string;
  modelo: string;
  createdAt: string;
  isArchived: boolean;
  resolution?: string;
  resolutionReason?: string;
  files: TicketFile[];
}

export interface CustomerFolder {
  contact: {
    number: string;
    name: string;
    profilePictureUrl?: string;
  };
  tickets: TicketFolder[];
}

export interface CompanyFolderInfo {
  id: string;
  legalName: string;
  tradeName: string | null;
  cnpj: string;
}

export interface CompanyFolder {
  /** `null` quando agrupa OS sem empresa vinculada (compatibilidade com histórico antigo). */
  company: CompanyFolderInfo | null;
  contacts: CustomerFolder[];
}
