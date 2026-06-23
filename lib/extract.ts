import ExcelJS from 'exceljs';

// アップロードされた Excel ファイルからテキストを抽出（シート名＋セル値を素朴に連結）。
export async function extractExcelText(buf: Buffer): Promise<string> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ExcelJS.Buffer);
  const out: string[] = [];
  wb.eachSheet((ws) => {
    out.push(`# シート: ${ws.name}`);
    ws.eachRow({ includeEmpty: false }, (row) => {
      const cells: string[] = [];
      row.eachCell({ includeEmpty: false }, (cell) => {
        const v = cell.value;
        if (v == null) return;
        if (typeof v === 'object' && 'text' in (v as any)) {
          cells.push(String((v as any).text));
        } else if (typeof v === 'object' && 'result' in (v as any)) {
          cells.push(String((v as any).result));
        } else {
          cells.push(String(v));
        }
      });
      if (cells.length) out.push(cells.join('\t'));
    });
  });
  return out.join('\n');
}

// HP URL を取得して本文テキストを抽出（script/style 除去・タグ除去の簡易処理）。
// 追加コストをかけないため外部 API は使わず fetch のみ。
export async function fetchUrlText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KotobookJobBot/1.0)' },
    });
    if (!res.ok) return `（HP取得失敗: HTTP ${res.status}）`;
    const html = await res.text();
    return htmlToText(html).slice(0, 20000);
  } catch (e: any) {
    return `（HP取得失敗: ${e?.message ?? 'error'}）`;
  } finally {
    clearTimeout(timer);
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}
