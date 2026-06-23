import Anthropic from '@anthropic-ai/sdk';
import { FIELDS, JobPosting, emptyJobPosting } from './fields';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

export interface SourceInput {
  pdfs: { name: string; base64: string }[];
  images: { name: string; mediaType: string; base64: string }[];
  excelTexts: { name: string; text: string }[];
  meetingMemo: string;
  hpText: string;
  hpUrl: string;
  title: string;
  companyHint: string; // 任意入力された企業名（あれば優先）
}

function buildSystemPrompt(): string {
  const fieldList = FIELDS.map(
    (f) => `- ${f.id}（${f.label}・最大約${f.maxLen}字${f.hint ? '／' + f.hint : ''}）`
  ).join('\n');

  return `あなたは株式会社コトブックの採用担当者を補助し、受領資料から求人票を作成するアシスタントです。
以下のルールを厳守してください。

【絶対的なルール】
1. 受領した資料（添付ファイル・会議メモ・HP情報）に書かれていない情報を、推測・創作で絶対に補わないこと。資料に無い項目は必ず空文字列 "" にすること。
2. 数値・固有名詞・条件（給与・人数・住所・日付等）は資料の記載を正確に転記すること。丸めたり言い換えたりしない。
3. 出力は Excel テンプレート（A4縦2枚）に収める必要があるため、各項目は指定の最大文字数を必ず守り、簡潔にまとめること。冗長な修飾や重複を避ける。
4. 箇条書きが自然な項目（業務内容・福利厚生・選考フロー等）は「・」区切りや改行で簡潔に。読みやすさより文字数厳守を優先する。
5. 敬体・体言止めを適宜使い分け、求人票として自然な日本語にすること。ただし新事実は足さない。

【企業名の扱い】
- ユーザー指定の企業名がある場合は、それを「企業名」フィールドに優先採用する。
- 指定が無い場合のみ、資料から企業名を抽出する。判別できなければ "" にする。

【記入する項目（キー：日本語名）】
${fieldList}

必ず submit_job_posting ツールを使って、上記キーで全フィールドを文字列で返すこと。該当情報が無いフィールドは "" とする。`;
}

function buildSchema() {
  const properties: Record<string, any> = {};
  for (const f of FIELDS) {
    properties[f.id] = {
      type: 'string',
      description: `${f.label}（最大約${f.maxLen}字。資料に無ければ空文字）`,
    };
  }
  return {
    type: 'object' as const,
    properties,
    required: FIELDS.map((f) => f.id),
  };
}

export async function generateJobPosting(input: SourceInput): Promise<JobPosting> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY が設定されていません。');
  const client = new Anthropic({ apiKey });

  const content: Anthropic.ContentBlockParam[] = [];

  // 添付 PDF
  for (const pdf of input.pdfs) {
    content.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: pdf.base64 },
      title: pdf.name,
    });
  }
  // 添付画像
  for (const img of input.images) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mediaType as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
        data: img.base64,
      },
    });
  }

  // テキスト系をまとめる
  const textParts: string[] = [];
  if (input.title) textParts.push(`【求人票タイトル（参考）】\n${input.title}`);
  if (input.companyHint) textParts.push(`【ユーザー指定の企業名（優先）】\n${input.companyHint}`);
  for (const ex of input.excelTexts) {
    textParts.push(`【添付Excel: ${ex.name}】\n${ex.text}`);
  }
  if (input.meetingMemo) textParts.push(`【会議メモ】\n${input.meetingMemo}`);
  if (input.hpText) textParts.push(`【HP情報（${input.hpUrl}）】\n${input.hpText}`);

  textParts.push(
    '上記の受領資料のみを根拠に、求人票テンプレートの各項目を作成してください。資料に無い項目は空文字列にしてください。'
  );
  content.push({ type: 'text', text: textParts.join('\n\n') });

  const schema = buildSchema();

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: buildSystemPrompt(),
    tools: [
      {
        name: 'submit_job_posting',
        description: '作成した求人票の各項目を提出する',
        input_schema: schema,
      },
    ],
    tool_choice: { type: 'tool', name: 'submit_job_posting' },
    messages: [{ role: 'user', content }],
  });

  const toolUse = res.content.find(
    (c): c is Anthropic.ToolUseBlock => c.type === 'tool_use'
  );
  if (!toolUse) throw new Error('Claude から求人票データを取得できませんでした。');

  const raw = toolUse.input as Record<string, unknown>;
  const result = emptyJobPosting();
  for (const f of FIELDS) {
    const v = raw[f.id];
    result[f.id] = v == null ? '' : String(v).trim();
  }
  return result;
}
