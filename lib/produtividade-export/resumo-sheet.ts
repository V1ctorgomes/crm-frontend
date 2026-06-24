import ExcelJS from 'exceljs';
import type { TeamOverviewResponse } from '@/components/produtividade/types';
import { formatDatePt, hexToArgb } from './format';
import { SECTION_FONT, styleHeaderRow, thinBorder } from './styles';

export function buildResumoSheet(wb: ExcelJS.Workbook, data: TeamOverviewResponse, periodLabel: string): void {
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
    ['Ordens de serviço criadas', data.totals.ticketsCreated],
    ['Ordens de serviço fechadas (não canceladas)', data.totals.ticketsClosed],
    ['Ordens de serviço canceladas', data.totals.ticketsCancelled],
    ['OS em aberto (estado actual)', data.totals.openTickets],
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
  dailyHeader.values = ['Data', 'Msg env.', 'Msg rec.', 'OS criadas', 'OS fech.', 'OS cancel.'];
  styleHeaderRow(dailyHeader, 6);
  r += 1;
  if (data.daily.length === 0) {
    resumo.mergeCells(`A${r}:F${r}`);
    resumo.getCell(`A${r}`).value = 'Sem série diária para este período.';
    resumo.getCell(`A${r}`).font = { italic: true, color: { argb: 'FF94A3B8' } };
  } else {
    for (const p of data.daily) {
      const row = resumo.getRow(r);
      row.getCell(1).value = p.date;
      row.getCell(2).value = p.messagesSent;
      row.getCell(3).value = p.messagesReceived;
      row.getCell(4).value = p.ticketsCreated;
      row.getCell(5).value = p.ticketsClosed;
      row.getCell(6).value = p.ticketsCancelled;
      for (let c = 2; c <= 6; c++) row.getCell(c).alignment = { horizontal: 'right' };
      for (let c = 1; c <= 6; c++) row.getCell(c).border = thinBorder;
      r += 1;
    }
  }
}
