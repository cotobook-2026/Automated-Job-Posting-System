import ExcelJS from 'exceljs';
import path from 'path';
import { FIELDS, JobPosting } from './fields';

const TEMPLATE_PATH = path.join(process.cwd(), 'templates', '求人票テンプレート.xlsx');

// テンプレート .xlsx を読み込み、値だけを所定のセルに流し込んで Buffer を返す。
// セル結合・フォント・列幅・印刷設定（A4縦・fitToPage）は一切変更しない。
export async function fillTemplate(data: JobPosting): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(TEMPLATE_PATH);
  const ws = wb.worksheets[0];

  for (const f of FIELDS) {
    const value = (data[f.key] ?? '').toString().trim();
    if (!value) continue; // 受領情報に無い項目は空欄のまま（推測で埋めない）
    const cell = ws.getCell(f.cell);
    cell.value = value;
  }

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out);
}

// 値のみの CSV（項目, 内容）。Excel で文字化けしないよう UTF-8 BOM を付与。
export function buildCsv(data: JobPosting): Buffer {
  const esc = (s: string) => '"' + (s ?? '').replace(/"/g, '""') + '"';
  const lines = ['項目,内容'];
  for (const f of FIELDS) {
    lines.push(`${esc(f.label)},${esc((data[f.key] ?? '').toString())}`);
  }
  const body = lines.join('\r\n');
  return Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(body, 'utf-8')]);
}
