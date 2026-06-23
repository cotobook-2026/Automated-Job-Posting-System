// 求人票テンプレートのフィールド定義。
// Claude が返す JSON のキー(id) / Excel の書き込み先セル / 表示名(label) / 推奨文字数 を一元管理。
//
// 重要: Claude API のツール input_schema のプロパティキーは ^[a-zA-Z0-9_.-]{1,64}$ に
// 一致する必要があるため、スキーマのキーには ASCII の id を使う。日本語は label として保持する。
// テンプレートのセル結合・書式は変更しないため、結合範囲の左上セルに書き込む。

export interface FieldDef {
  id: string; // Claude スキーマ / JSON のキー（ASCII）
  cell: string; // 結合セルの左上アドレス
  label: string; // 画面表示・CSV 用の日本語名
  maxLen: number; // A4縦2枚に収めるための目安文字数
  hint?: string; // Claude への補足指示
}

export const FIELDS: FieldDef[] = [
  { id: 'company_headline', cell: 'D3', label: '企業', maxLen: 40, hint: '企業の一言キャッチ。なければ企業名と同じで可' },
  { id: 'job_title', cell: 'D4', label: '募集職種', maxLen: 40 },
  { id: 'job_description', cell: 'D5', label: '業務内容', maxLen: 280 },
  { id: 'ideal_candidate', cell: 'D6', label: '求める人材像', maxLen: 220 },
  { id: 'company_features', cell: 'D7', label: '企業の特色', maxLen: 220 },
  { id: 'work_location', cell: 'D9', label: '勤務地', maxLen: 80 },
  { id: 'smoking_policy', cell: 'D10', label: '受動喫煙防止措置', maxLen: 60 },
  { id: 'number_of_hires', cell: 'D11', label: '採用人数', maxLen: 20 },
  { id: 'hiring_background', cell: 'U11', label: '募集背景', maxLen: 60 },
  { id: 'employment_type', cell: 'D12', label: '雇用形態', maxLen: 30 },
  { id: 'relocation', cell: 'U12', label: '転勤', maxLen: 30 },
  { id: 'probation_period', cell: 'D13', label: '試用期間', maxLen: 40 },
  { id: 'contract_period', cell: 'U13', label: '契約期間', maxLen: 40 },
  { id: 'estimated_annual_salary', cell: 'D14', label: '想定年収', maxLen: 40 },
  { id: 'monthly_salary', cell: 'U14', label: '月給', maxLen: 40 },
  { id: 'bonus', cell: 'D15', label: '賞与', maxLen: 40 },
  { id: 'overtime', cell: 'U15', label: '時間外労働', maxLen: 40 },
  { id: 'working_hours', cell: 'D16', label: '勤務時間', maxLen: 80 },
  { id: 'break_time', cell: 'D17', label: '休憩時間', maxLen: 40 },
  { id: 'holidays', cell: 'D18', label: '休日', maxLen: 80 },
  { id: 'benefits', cell: 'D19', label: '福利厚生・待遇', maxLen: 200 },
  { id: 'company_name', cell: 'D21', label: '企業名', maxLen: 40 },
  { id: 'url', cell: 'D22', label: 'URL', maxLen: 80 },
  { id: 'postal_code', cell: 'E23', label: '郵便番号', maxLen: 10, hint: '〒は不要、数字とハイフンのみ' },
  { id: 'head_office_address', cell: 'K23', label: '本社住所', maxLen: 60 },
  { id: 'business_description', cell: 'D24', label: '事業内容', maxLen: 160 },
  { id: 'established', cell: 'D25', label: '設立', maxLen: 30 },
  { id: 'representative', cell: 'W25', label: '代表取締役', maxLen: 30 },
  { id: 'capital', cell: 'D26', label: '資本金', maxLen: 30 },
  { id: 'revenue', cell: 'W26', label: '売上', maxLen: 30 },
  { id: 'recruiter', cell: 'D27', label: '採用担当', maxLen: 30 },
  { id: 'selection_process', cell: 'L27', label: '選考フロー', maxLen: 120 },
];

// 企業名フィールドの id（ファイル名生成などで参照）
export const COMPANY_NAME_ID = 'company_name';

export type JobPosting = Record<string, string>;

export function emptyJobPosting(): JobPosting {
  const o: JobPosting = {};
  for (const f of FIELDS) o[f.id] = '';
  return o;
}

// ファイル名に使えない文字を除去
export function sanitizeFilename(name: string): string {
  return (name || '')
    .replace(/[\\/:*?"<>|\r\n\t]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// 【求人票】タイトル_企業名 を組み立てる（タイトル任意）
export function buildBaseFilename(title: string, company: string): string {
  const t = sanitizeFilename(title);
  const c = sanitizeFilename(company) || '企業名未設定';
  return t ? `【求人票】${t}_${c}` : `【求人票】${c}`;
}
