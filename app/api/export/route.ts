import { NextRequest, NextResponse } from 'next/server';
import { fillTemplate, buildCsv } from '@/lib/template';
import { buildBaseFilename, COMPANY_NAME_ID, emptyJobPosting, FIELDS, JobPosting } from '@/lib/fields';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const format: string = body.format === 'csv' ? 'csv' : 'xlsx';
    const title: string = body.title || '';
    const company: string = body.company || (body.data && body.data[COMPANY_NAME_ID]) || '';

    // 既知フィールドのみ受け付ける（不正キー混入を防止）
    const data: JobPosting = emptyJobPosting();
    for (const f of FIELDS) {
      const v = body?.data?.[f.id];
      data[f.id] = v == null ? '' : String(v);
    }

    const base = buildBaseFilename(title, company);

    if (format === 'csv') {
      const buf = buildCsv(data);
      return fileResponse(buf, `${base}.csv`, 'text/csv; charset=utf-8');
    }

    const buf = await fillTemplate(data);
    return fileResponse(
      buf,
      `${base}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || 'ファイル出力中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}

function fileResponse(buf: Buffer, filename: string, contentType: string) {
  // 日本語ファイル名は RFC5987 (filename*) でエンコード
  const encoded = encodeURIComponent(filename);
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encoded}"; filename*=UTF-8''${encoded}`,
      'Content-Length': String(buf.length),
    },
  });
}
