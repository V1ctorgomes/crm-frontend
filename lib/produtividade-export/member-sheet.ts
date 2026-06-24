import ExcelJS from 'exceljs';
import type { TeamOverviewResponse } from '@/components/produtividade/types';
import { formatDateTimePt } from './format';
import { styleHeaderRow, thinBorder } from './styles';

export function buildMemberSheet(wb: ExcelJS.Workbook, data: TeamOverviewResponse): void {
  const memberSheet = wb.addWorksheet('Por membro', {
    views: [{ state: 'frozen', ySplit: 1 }],
    properties: { defaultRowHeight: 19 },
  });
  memberSheet.columns = Array.from({ length: 10 }, (_, i) => ({ width: i < 2 ? 28 : i === 2 ? 14 : 12 }));
  const teamHeader = memberSheet.getRow(1);
  teamHeader.values = [
    'Membro',
    'Email',
    'Função',
    'Total act.',
    'Msg env.',
    'Msg rec.',
    'OS criadas',
    'OS fech.',
    'OS cancel.',
    'Última actividade',
  ];
  styleHeaderRow(teamHeader, 10);
  memberSheet.autoFilter = { from: 'A1', to: `J${Math.max(1, data.perUser.length + 1)}` };

  let rowNum = 2;
  for (const u of data.perUser) {
    const row = memberSheet.getRow(rowNum);
    row.getCell(1).value = u.name;
    row.getCell(2).value = u.email;
    row.getCell(3).value = u.role;
    row.getCell(4).value = u.totalActivity;
    row.getCell(5).value = u.messagesSent;
    row.getCell(6).value = u.messagesReceived;
    row.getCell(7).value = u.ticketsCreated;
    row.getCell(8).value = u.ticketsClosed;
    row.getCell(9).value = u.ticketsCancelled;
    row.getCell(10).value = formatDateTimePt(u.lastActivityAt);
    for (let c = 4; c <= 9; c++) {
      row.getCell(c).numFmt = '#,##0';
      row.getCell(c).alignment = { horizontal: 'right' };
    }
    row.getCell(10).alignment = { horizontal: 'right' };
    for (let c = 1; c <= 10; c++) row.getCell(c).border = thinBorder;
    if (rowNum % 2 === 0) {
      for (let c = 1; c <= 10; c++) {
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    }
    rowNum += 1;
  }
}
