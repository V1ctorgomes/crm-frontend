import ExcelJS from 'exceljs';

export const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF148C26' },
};

export const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 11,
};

export const SECTION_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 12,
  color: { argb: 'FF0F172A' },
};

export const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
};

export function styleHeaderRow(row: ExcelJS.Row, lastCol: number): void {
  row.height = 22;
  for (let c = 1; c <= lastCol; c++) {
    const cell = row.getCell(c);
    cell.fill = HEADER_FILL;
    cell.font = { ...HEADER_FONT };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = thinBorder;
  }
}
