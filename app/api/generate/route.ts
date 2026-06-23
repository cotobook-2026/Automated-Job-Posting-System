import { NextRequest, NextResponse } from 'next/server';
import { generateJobPosting, SourceInput } from '@/lib/anthropic';
import { extractExcelText, fetchUrlText } from '@/lib/extract';
import { buildBaseFilename, COMPANY_NAME_ID } from '@/lib/fields';

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel Hobby 上限。Claude 応答に余裕を持たせる

const IMAGE_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

const EXCEL_EXT = ['xlsx', 'xlsm', 'xls'];

function ext(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const title = (form.get('title') as string) || '';
    const companyHint = (form.get('company') as string) || '';
    const meetingMemo = (form.get('memo') as string) || '';
    const hpUrl = (form.get('url') as string) || '';

    const input: SourceInput = {
      pdfs: [],
      images: [],
      excelTexts: [],
      meetingMemo,
      hpText: '',
      hpUrl,
      title,
      companyHint,
    };

    const files = form.getAll('files').filter((f): f is File => f instanceof File);
    for (const file of files) {
      if (!file.size) continue;
      const e = ext(file.name);
      const buf = Buffer.from(await file.arrayBuffer());
      if (e === 'pdf') {
        input.pdfs.push({ name: file.name, base64: buf.toString('base64') });
      } else if (IMAGE_TYPES[e]) {
        input.images.push({
          name: file.name,
          mediaType: IMAGE_TYPES[e],
          base64: buf.toString('base64'),
        });
      } else if (EXCEL_EXT.includes(e)) {
        try {
          input.excelTexts.push({ name: file.name, text: await extractExcelText(buf) });
        } catch {
          input.excelTexts.push({ name: file.name, text: '（Excel解析失敗）' });
        }
      } else {
        // その他テキスト系はそのまま読み込み
        input.excelTexts.push({ name: file.name, text: buf.toString('utf-8').slice(0, 20000) });
      }
    }

    if (hpUrl && /^https?:\/\//i.test(hpUrl)) {
      input.hpText = await fetchUrlText(hpUrl);
    }

    const hasSource =
      input.pdfs.length ||
      input.images.length ||
      input.excelTexts.length ||
      input.meetingMemo.trim() ||
      input.hpText.trim();
    if (!hasSource) {
      return NextResponse.json(
        { error: '求人票の材料（ファイル・会議メモ・HP URLのいずれか）を入力してください。' },
        { status: 400 }
      );
    }

    const data = await generateJobPosting(input);
    const company = companyHint.trim() || data[COMPANY_NAME_ID] || '';
    const baseFilename = buildBaseFilename(title, company);

    return NextResponse.json({ data, company, title, baseFilename });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || '求人票の生成中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}
