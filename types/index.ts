export interface Contact { 
  number: string; 
  name: string; 
  profilePictureUrl?: string; 
  email?: string; 
  cnpj?: string; 
  instanceName?: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

export interface Note { 
  id: string; 
  text: string; 
  createdAt: string; 
}

export interface Task { 
  id: string; 
  title: string; 
  dueDate: string; 
  isCompleted: boolean; 
  createdAt: string; 
}

export interface TicketFile {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  description?: string;
  createdAt: string;
}

export interface Stage { 
  id: string; 
  name: string; 
  color: string; 
  order: number; 
  isActive: boolean; 
  tickets: Ticket[]; 
}

export interface Ticket { 
  id: string; 
  contactNumber: string; 
  contact?: Contact; 
  marca: string | null; 
  modelo: string | null; 
  customerType: string | null;
  ticketType: string | null;
  createdAt: string; 
  updatedAt: string;
  notes?: Note[]; 
  tasks?: Task[];
  files?: TicketFile[];
  isArchived: boolean; 
  resolution?: string; 
  resolutionReason?: string; 
  stage?: Stage; 
}