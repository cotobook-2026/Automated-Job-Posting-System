// 求人票テンプレートのフィールド定義。
// Claude が返す JSON のキー / Excel の書き込み先セル / 推奨文字数（A4縦2枚に収めるため）を
// 1か所で一元管理する。テンプレートのセル結合・書式は変更しないため、結合範囲の左上セルに書き込む。

export type FieldKey =
  | '企業'
  | '募集職種'
  | '業務内容'
  | '求める人材像'
  | '企業の特色'
  | '勤務地'
  | '受動喫煙防止措置'
  | '採用人数'
  | '募集背景'
  | '雇用形態'
  | '転勤'
  | '試用期間'
  | '契約期間'
  | '想定年収'
  | '月給'
  | '賞与'
  | '時間外労働'
  | '勤務時間'
  | '休憩時間'
  | '休日'
  | '福利厚生待遇'
  | '企業名'
  | 'URL'
  | '郵便番号'
  | '本社住所'
  | '事業内容'
  | '設立'
  | '代表取締役'
  | '資本金'
  | '売上'
  | '採用担当'
  | '選考フロー';

export interface FieldDef {
  key: FieldKey;
  cell: string; // 結合セルの左上アドレス
  label: string; // CSV 用の表示名
  maxLen: number; // A4縦2枚に収めるための目安文字数
  hint?: string; // Claude への補足指示
}

export const FIELDS: FieldDef[] = [
  { key: '企業', cell: 'D3', label: '企業', maxLen: 40, hint: '企業の一言キャッチ。なければ企業名と同じで可' },
  { key: '募集職種', cell: 'D4', label: '募集職種', maxLen: 40 },
  { key: '業務内容', cell: 'D5', label: '業務内容', maxLen: 280 },
  { key: '求める人材像', cell: 'D6', label: '求める人材像', maxLen: 220 },
  { key: '企業の特色', cell: 'D7', label: '企業の特色', maxLen: 220 },
  { key: '勤務地', cell: 'D9', label: '勤務地', maxLen: 80 },
  { key: '受動喫煙防止措置', cell: 'D10', label: '受動喫煙防止措置', maxLen: 60 },
  { key: '採用人数', cell: 'D11', label: '採用人数', maxLen: 20 },
  { key: '募集背景', cell: 'U11', label: '募集背景', maxLen: 60 },
  { key: '雇用形態', cell: 'D12', label: '雇用形態', maxLen: 30 },
  { key: '転勤', cell: 'U12', label: '転勤', maxLen: 30 },
  { key: '試用期間', cell: 'D13', label: '試用期間', maxLen: 40 },
  { key: '契約期間', cell: 'U13', label: '契約期間', maxLen: 40 },
  { key: '想定年収', cell: 'D14', label: '想定年収', maxLen: 40 },
  { key: '月給', cell: 'U14', label: '月給', maxLen: 40 },
  { key: '賞与', cell: 'D15', label: '賞与', maxLen: 40 },
  { key: '時間外労働', cell: 'U15', label: '時間外労働', maxLen: 40 },
  { key: '勤務時間', cell: 'D16', label: '勤務時間', maxLen: 80 },
  { key: '休憩時間', cell: 'D17', label: '休憩時間', maxLen: 40 },
  { key: '休日', cell: 'D18', label: '休日', maxLen: 80 },
  { key: '福利厚生待遇', cell: 'D19', label: '福利厚生・待遇', maxLen: 200 },
  { key: '企業名', cell: 'D21', label: '企業名', maxLen: 40 },
  { key: 'URL', cell: 'D22', label: 'URL', maxLen: 80 },
  { key: '郵便番号', cell: 'E23', label: '郵便番号', maxLen: 10, hint: '〒は不要、数字とハイフンのみ' },
  { key: '本社住所', cell: 'K23', label: '本社住所', maxLen: 60 },
  { key: '事業内容', cell: 'D24', label: '事業内容', maxLen: 160 },
  { key: '設立', cell: 'D25', label: '設立', maxLen: 30 },
  { key: '代表取締役', cell: 'W25', label: '代表取締役', maxLen: 30 },
  { key: '資本金', cell: 'D26', label: '資本金', maxLen: 30 },
  { key: '売上', cell: 'W26', label: '売上', maxLen: 30 },
  { key: '採用担当', cell: 'D27', label: '採用担当', maxLen: 30 },
  { key: '選考フロー', cell: 'L27', label: '選考フロー', maxLen: 120 },
];

export type JobPosting = Record<FieldKey, string>;

export function emptyJobPosting(): JobPosting {
  const o = {} as JobPosting;
  for (const f of FIELDS) o[f.key] = '';
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
