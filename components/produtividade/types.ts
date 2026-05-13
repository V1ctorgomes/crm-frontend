export interface PerUserStats {
  userId: string;
  name: string;
  email: string;
  role: string;
  profilePictureUrl: string | null;
  messagesSent: number;
  messagesReceived: number;
  ticketsCreated: number;
  ticketsArchived: number;
  lastActivityAt: string | null;
}

export interface FunnelStage {
  name: string;
  color: string;
  count: number;
}

export interface TeamOverviewResponse {
  period: { from: string; to: string };
  totals: {
    activeUsers: number;
    messagesSent: number;
    messagesReceived: number;
    ticketsCreated: number;
    ticketsArchived: number;
    openTickets: number;
  };
  perUser: PerUserStats[];
  funnel: FunnelStage[];
}

export type PeriodPreset = '7d' | '30d' | 'mes';
