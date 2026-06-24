export interface Contact { number: string; name: string; }

export interface Ticket {
  id: string;
  contactNumber: string;
  marca: string | null;
  modelo: string | null;
  customerType: string | null;
  isArchived: boolean;
  resolution?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
  tickets: Ticket[];
}

export type MeBrief = { id?: string };
export type InstanceRow = { status?: string };

export type TrendDataRow = {
  month: string;
  dayLong: string;
  ganhas: number;
  perdidas: number;
  andamento: number;
};

export type RankingRow = { name: string; count: number };

const MESES_EIXO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const;

/** Data do eixo: criação para OS abertas; última atualização (arquivamento) para ganhas/canceladas. */
export function getTicketTimelineBucket(t: Ticket): string | null {
  const iso = t.isArchived ? (t.updatedAt || t.createdAt) : t.createdAt;
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

/** Labels estáveis a partir da chave YYYY-MM-DD (eixo curto evita cortar nas pontas do SVG). */
export function formatSortKeyForChart(sortKey: string): { axisLabel: string; dayLong: string } {
  const [ys, ms, ds] = sortKey.split('-');
  const y = Number(ys);
  const mo = Number(ms);
  const da = Number(ds);
  if (!y || !mo || !da) return { axisLabel: sortKey, dayLong: sortKey };
  const d = new Date(y, mo - 1, da);
  if (Number.isNaN(d.getTime())) return { axisLabel: sortKey, dayLong: sortKey };
  const axisLabel = `${String(ds).padStart(2, '0')} ${MESES_EIXO[mo - 1]}`;
  const dayLong = d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return { axisLabel, dayLong };
}

export function computeKpis(archivedSafe: Ticket[]) {
  const wonCount = archivedSafe.filter((t) => t.resolution === 'SUCCESS' || !t.resolution).length;
  const lostCount = archivedSafe.filter((t) => t.resolution === 'CANCELLED').length;
  const totalClosed = wonCount + lostCount;
  const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;
  return { wonCount, lostCount, winRate };
}

export function computeActiveCount(stagesSafe: Stage[]) {
  return stagesSafe.reduce((acc, stage) => acc + stage.tickets.length, 0);
}

export function computeBrandRanking(allTickets: Ticket[]): RankingRow[] {
  const brandMap = new Map<string, number>();
  allTickets.forEach((t) => {
    if (t.marca) {
      const m = t.marca.toUpperCase().trim();
      brandMap.set(m, (brandMap.get(m) || 0) + 1);
    }
  });
  return Array.from(brandMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export function computeCustomerTypeRanking(allTickets: Ticket[]): RankingRow[] {
  const typeMap = new Map<string, number>();
  allTickets.forEach((t) => {
    if (t.customerType) {
      const ct = t.customerType.toUpperCase().trim();
      typeMap.set(ct, (typeMap.get(ct) || 0) + 1);
    }
  });
  return Array.from(typeMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function computeTrendData(allTickets: Ticket[]): TrendDataRow[] {
  const timeMap = new Map<string, TrendDataRow>();

  allTickets.forEach((t) => {
    const sortKey = getTicketTimelineBucket(t);
    if (!sortKey) return;

    if (!timeMap.has(sortKey)) {
      const { axisLabel, dayLong } = formatSortKeyForChart(sortKey);
      timeMap.set(sortKey, {
        month: axisLabel,
        dayLong,
        ganhas: 0,
        perdidas: 0,
        andamento: 0,
      });
    }

    const entry = timeMap.get(sortKey)!;

    if (t.isArchived) {
      if (t.resolution === 'CANCELLED') {
        entry.perdidas += 1;
      } else {
        entry.ganhas += 1;
      }
    } else {
      entry.andamento += 1;
    }
  });

  return Array.from(timeMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, row]) => row);
}

export function buildFunnelData(stages: Stage[]) {
  return stages.map((stage) => ({
    name: stage.name,
    Quantidade: stage.tickets.length,
    color: stage.color,
  }));
}
