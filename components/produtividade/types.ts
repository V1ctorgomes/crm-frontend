export interface PerUserStats {
  userId: string;
  name: string;
  email: string;
  role: string;
  profilePictureUrl: string | null;
  messagesSent: number;
  messagesReceived: number;
  mediaMessagesSent: number;
  ticketsCreated: number;
  ticketsArchived: number;
  notesAdded: number;
  tasksCreated: number;
  tasksCompleted: number;
  ticketFilesUploaded: number;
  companiesCreated: number;
  deletionsRecorded: number;
  totalActivity: number;
  lastActivityAt: string | null;
}

export interface FunnelStage {
  name: string;
  color: string;
  count: number;
}

export interface DailyPoint {
  date: string;
  messagesSent: number;
  messagesReceived: number;
  mediaMessagesSent: number;
  ticketsCreated: number;
  ticketsArchived: number;
  notesAdded: number;
  tasksCreated: number;
  tasksCompleted: number;
  ticketFilesUploaded: number;
  deletionsRecorded: number;
}

export interface TeamOverviewResponse {
  period: { from: string; to: string };
  totals: {
    activeUsers: number;
    messagesSent: number;
    messagesReceived: number;
    mediaMessagesSent: number;
    ticketsCreated: number;
    ticketsArchived: number;
    openTickets: number;
    notesAdded: number;
    tasksCreated: number;
    tasksCompleted: number;
    ticketFilesUploaded: number;
    companiesCreated: number;
    deletionsRecorded: number;
  };
  perUser: PerUserStats[];
  funnel: FunnelStage[];
  daily: DailyPoint[];
}

export type PeriodPreset = 'hoje' | '7d' | '30d' | 'mes';
