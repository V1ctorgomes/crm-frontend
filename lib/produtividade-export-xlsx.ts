import ExcelJS from 'exceljs';
import type { TeamOverviewResponse } from '@/components/produtividade/types';
import { downloadXlsx } from './produtividade-export/format';
import { buildMemberSheet } from './produtividade-export/member-sheet';
import { buildResumoSheet } from './produtividade-export/resumo-sheet';

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

  buildResumoSheet(wb, data, periodLabel);
  buildMemberSheet(wb, data);

  const buffer = await wb.xlsx.writeBuffer();
  downloadXlsx(filename, buffer);
}
