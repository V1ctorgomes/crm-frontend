import ExcelJS from 'exceljs';
import type { TeamOverviewResponse } from '@/components/produtividade/types';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF148C26' },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 11,
};

const SECTION_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 12,
  color: { argb: 'FF0F172A' },
};

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
};

function formatDatePt(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTimePt(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function styleHeaderRow(row: ExcelJS.Row, lastCol: number): void {
  row.height = 22;
  for (let c = 1; c <= lastCol; c++) {
    const cell = row.getCell(c);
    cell.fill = HEADER_FILL;
    cell.font = { ...HEADER_FONT };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = thinBorder;
  }
}

function hexToArgb(hex: string): string | undefined {
  const h = hex.replace('#', '').trim();
  if (h.length === 6 && /^[0-9a-fA-F]+$/.test(h)) return `FF${h.toUpperCase()}`;
  return undefined;
}

function downloadXlsx(filename: string, buffer: BlobPart): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Gera uma planilha Excel com resumo, funil, série diária e detalhe por membro.
 */
export async function downloadProdutividadeWorkbook(
  data: TeamOverviewResponse,
  periodLabel: string,
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'CRM';
  wb.created = new Date();
  wb.modified = new Date();
  wb.title = 'Produtividade da equipe';

  const fromIso = data.period.from?.slice(0, 10) || 'inicio';
  const toIso = data.period.to?.slice(0, 10) || 'fim';
  const filename = `produtividade_${fromIso}_${toIso}.xlsx`;

  // ——— Folha Resumo ———
  const resumo = wb.addWorksheet('Resumo', {
    views: [{ showGridLines: true }],
    properties: { defaultRowHeight: 18 },
  });
  resumo.columns = [
    { width: 28 },
    { width: 22 },
    { width: 14 },
    { width: 18 },
    { width: 14 },
    { width: 12 },
  ];

  let r = 1;
  resumo.mergeCells(`A${r}:F${r}`);
  const title = resumo.getCell(`A${r}`);
  title.value = 'Relatório de produtividade da equipe';
  title.font = { size: 18, bold: true, color: { argb: 'FF0F172A' } };
  title.alignment = { vertical: 'middle' };
  resumo.getRow(r).height = 28;
  r += 1;

  resumo.mergeCells(`A${r}:F${r}`);
  resumo.getCell(`A${r}`).value = periodLabel;
  resumo.getCell(`A${r}`).font = { size: 11, color: { argb: 'FF64748B' } };
  r += 2;

  resumo.getCell(`A${r}`).value = 'Período (dados)';
  resumo.getCell(`A${r}`).font = { bold: true };
  resumo.getCell(`B${r}`).value = formatDatePt(data.period.from);
  resumo.getCell(`C${r}`).value = 'até';
  resumo.getCell(`C${r}`).font = { italic: true, color: { argb: 'FF64748B' } };
  resumo.getCell(`D${r}`).value = formatDatePt(data.period.to);
  r += 1;
  resumo.getCell(`A${r}`).value = 'Gerado em';
  resumo.getCell(`A${r}`).font = { bold: true };
  resumo.getCell(`B${r}`).value = new Date().toLocaleString('pt-PT');
  r += 2;

  resumo.mergeCells(`A${r}:F${r}`);
  resumo.getCell(`A${r}`).value = 'Indicadores agregados';
  resumo.getCell(`A${r}`).font = SECTION_FONT;
  r += 1;

  const kpiRows: [string, string | number][] = [
    ['Membros com atividade', data.totals.activeUsers],
    ['Mensagens enviadas (equipe)', data.totals.messagesSent],
    ['Mensagens recebidas (equipe)', data.totals.messagesReceived],
    ['Mensagens com mídia (envio)', data.totals.mediaMessagesSent],
    ['Ordens de serviço criadas', data.totals.ticketsCreated],
    ['Ordens de serviço fechadas', data.totals.ticketsArchived],
    ['OS em aberto (estado actual)', data.totals.openTickets],
    ['Notas adicionadas nas OS', data.totals.notesAdded],
    ['Tarefas criadas', data.totals.tasksCreated],
    ['Tarefas concluídas', data.totals.tasksCompleted],
    ['Ficheiros anexados nas OS', data.totals.ticketFilesUploaded],
    ['Empresas criadas', data.totals.companiesCreated],
    ['Exclusões registadas (auditoria)', data.totals.deletionsRecorded],
  ];
  const kpiHeader = resumo.getRow(r);
  kpiHeader.values = ['Indicador', 'Valor'];
  styleHeaderRow(kpiHeader, 2);
  r += 1;
  for (const [label, val] of kpiRows) {
    const row = resumo.getRow(r);
    row.getCell(1).value = label;
    row.getCell(2).value = val;
    row.getCell(2).alignment = { horizontal: 'right' };
    row.getCell(1).border = thinBorder;
    row.getCell(2).border = thinBorder;
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    r += 1;
  }
  r += 1;

  resumo.mergeCells(`A${r}:F${r}`);
  resumo.getCell(`A${r}`).value = 'Funil — OS em aberto por etapa';
  resumo.getCell(`A${r}`).font = SECTION_FONT;
  r += 1;
  const funnelHeader = resumo.getRow(r);
  funnelHeader.values = ['Etapa', 'Cor (hex)', 'Quantidade'];
  styleHeaderRow(funnelHeader, 3);
  r += 1;
  if (data.funnel.length === 0) {
    resumo.mergeCells(`A${r}:C${r}`);
    resumo.getCell(`A${r}`).value = 'Sem dados de funil neste período.';
    resumo.getCell(`A${r}`).font = { italic: true, color: { argb: 'FF94A3B8' } };
    r += 1;
  } else {
    for (const stage of data.funnel) {
      const row = resumo.getRow(r);
      row.getCell(1).value = stage.name;
      row.getCell(1).font = { bold: true };
      row.getCell(2).value = stage.color;
      row.getCell(3).value = stage.count;
      row.getCell(3).alignment = { horizontal: 'right' };
      const argb = hexToArgb(stage.color);
      if (argb) {
        row.getCell(1).border = {
          ...thinBorder,
          left: { style: 'medium', color: { argb } },
        };
      } else {
        row.getCell(1).border = thinBorder;
      }
      row.getCell(2).border = thinBorder;
      row.getCell(3).border = thinBorder;
      r += 1;
    }
  }
  r += 1;

  resumo.mergeCells(`A${r}:F${r}`);
  resumo.getCell(`A${r}`).value = 'Atividade diária (tendência)';
  resumo.getCell(`A${r}`).font = SECTION_FONT;
  r += 1;
  const dailyHeader = resumo.getRow(r);
  dailyHeader.values = [
    'Data',
    'Msg env.',
    'Msg rec.',
    'Mídia env.',
    'OS criadas',
    'OS fech.',
    'Notas',
    'Tar. +',
    'Tar. ✓',
    'Fich.',
    'Excl.',
  ];
  styleHeaderRow(dailyHeader, 11);
  r += 1;
  if (data.daily.length === 0) {
    resumo.mergeCells(`A${r}:K${r}`);
    resumo.getCell(`A${r}`).value = 'Sem série diária para este período.';
    resumo.getCell(`A${r}`).font = { italic: true, color: { argb: 'FF94A3B8' } };
    r += 1;
  } else {
    for (const p of data.daily) {
      const row = resumo.getRow(r);
      row.getCell(1).value = p.date;
      row.getCell(2).value = p.messagesSent;
      row.getCell(3).value = p.messagesReceived;
      row.getCell(4).value = p.mediaMessagesSent;
      row.getCell(5).value = p.ticketsCreated;
      row.getCell(6).value = p.ticketsArchived;
      row.getCell(7).value = p.notesAdded;
      row.getCell(8).value = p.tasksCreated;
      row.getCell(9).value = p.tasksCompleted;
      row.getCell(10).value = p.ticketFilesUploaded;
      row.getCell(11).value = p.deletionsRecorded;
      for (let c = 2; c <= 11; c++) row.getCell(c).alignment = { horizontal: 'right' };
      for (let c = 1; c <= 11; c++) row.getCell(c).border = thinBorder;
      r += 1;
    }
  }

  // ——— Folha por membro ———
  const memberSheet = wb.addWorksheet('Por membro', {
    views: [{ state: 'frozen', ySplit: 1 }],
    properties: { defaultRowHeight: 19 },
  });
  memberSheet.columns = Array.from({ length: 16 }, (_, i) => ({ width: i < 2 ? 28 : i === 2 ? 14 : 12 }));
  const teamHeader = memberSheet.getRow(1);
  teamHeader.values = [
    'Membro',
    'Email',
    'Função',
    'Total act.',
    'Msg env.',
    'Msg rec.',
    'Mídia',
    'OS criadas',
    'OS fech.',
    'Notas',
    'Tar. criadas',
    'Tar. concl.',
    'Ficheiros',
    'Empresas',
    'Exclusões',
    'Última actividade',
  ];
  styleHeaderRow(teamHeader, 16);
  memberSheet.autoFilter = { from: 'A1', to: `P${Math.max(1, data.perUser.length + 1)}` };

  let rowNum = 2;
  for (const u of data.perUser) {
    const row = memberSheet.getRow(rowNum);
    row.getCell(1).value = u.name;
    row.getCell(2).value = u.email;
    row.getCell(3).value = u.role;
    row.getCell(4).value = u.totalActivity;
    row.getCell(5).value = u.messagesSent;
    row.getCell(6).value = u.messagesReceived;
    row.getCell(7).value = u.mediaMessagesSent;
    row.getCell(8).value = u.ticketsCreated;
    row.getCell(9).value = u.ticketsArchived;
    row.getCell(10).value = u.notesAdded;
    row.getCell(11).value = u.tasksCreated;
    row.getCell(12).value = u.tasksCompleted;
    row.getCell(13).value = u.ticketFilesUploaded;
    row.getCell(14).value = u.companiesCreated;
    row.getCell(15).value = u.deletionsRecorded;
    row.getCell(16).value = formatDateTimePt(u.lastActivityAt);
    for (let c = 4; c <= 15; c++) {
      row.getCell(c).numFmt = '#,##0';
      row.getCell(c).alignment = { horizontal: 'right' };
    }
    row.getCell(16).alignment = { horizontal: 'right' };
    for (let c = 1; c <= 16; c++) row.getCell(c).border = thinBorder;
    if (rowNum % 2 === 0) {
      for (let c = 1; c <= 16; c++) {
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    }
    rowNum += 1;
  }

  const buffer = await wb.xlsx.writeBuffer();
  downloadXlsx(filename, buffer);
}
