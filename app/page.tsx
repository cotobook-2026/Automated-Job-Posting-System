'use client';

import { useState } from 'react';
import { FIELDS, FieldKey } from '@/lib/fields';

type JobData = Record<string, string>;

export default function Home() {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [memo, setMemo] = useState('');
  const [url, setUrl] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<'xlsx' | 'csv' | null>(null);
  const [error, setError] = useState('');
  const [data, setData] = useState<JobData | null>(null);
  const [baseFilename, setBaseFilename] = useState('');

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setData(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('company', company);
      fd.append('memo', memo);
      fd.append('url', url);
      if (files) Array.from(files).forEach((f) => fd.append('files', f));

      const res = await fetch('/api/generate', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '生成に失敗しました。');
      setData(json.data);
      setBaseFilename(json.baseFilename);
      if (!company && json.company) setCompany(json.company);
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  }

  function updateField(key: FieldKey, value: string) {
    setData((d) => (d ? { ...d, [key]: value } : d));
  }

  async function onDownload(format: 'xlsx' | 'csv') {
    if (!data) return;
    setExporting(format);
    setError('');
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, title, company: company || data['企業名'], format }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || '出力に失敗しました。');
      }
      const blob = await res.blob();
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `${baseFilename || '【求人票】'}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(dlUrl);
    } catch (err: any) {
      setError(err.message || 'ダウンロードに失敗しました。');
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="wrap">
      <header>
        <h1>求人票自動作成システム</h1>
        <p>株式会社コトブック ｜ 受領資料から求人票テンプレートに沿った求人票を作成し、Excel / CSV で出力します。</p>
      </header>

      {error && <div className="error">{error}</div>}

      <form onSubmit={onGenerate}>
        <div className="card">
          <div className="row">
            <div className="field">
              <label>
                求人票タイトル<span className="opt">任意</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 2026年度 営業職"
              />
            </div>
            <div className="field">
              <label>
                企業名<span className="opt">任意・空欄なら資料から自動抽出</span>
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="例: 株式会社〇〇"
              />
            </div>
          </div>

          <div className="field">
            <label>
              ファイル<span className="opt">任意・複数可（PDF / 画像 / Excel など）</span>
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.xlsx,.xls,.xlsm,.txt,.csv"
              onChange={(e) => setFiles(e.target.files)}
            />
            <div className="hint">求人票・募集要項・会社案内など。PDF・画像はそのまま読み取ります。</div>
          </div>

          <div className="field">
            <label>
              会議メモ<span className="opt">任意</span>
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="ヒアリング内容・補足事項を貼り付け"
            />
          </div>

          <div className="field">
            <label>
              HP URL<span className="opt">任意</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.co.jp"
            />
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading && <span className="spin" />}
            {loading ? '求人票を作成中…' : '求人票を作成'}
          </button>
        </div>
      </form>

      {data && (
        <div className="card">
          <p className="section-title">作成結果（内容を確認・修正してから出力できます）</p>
          <div className="notice">
            受領資料に記載が無い項目は空欄です（推測では補完しません）。必要に応じて手修正してください。
          </div>
          <div className="preview-grid">
            {FIELDS.map((f) => (
              <FieldRow key={f.key} label={f.label} value={data[f.key] || ''} onChange={(v) => updateField(f.key, v)} />
            ))}
          </div>

          <div className="actions">
            <button className="btn-out" onClick={() => onDownload('xlsx')} disabled={exporting !== null}>
              {exporting === 'xlsx' && <span className="spin" style={{ borderColor: '#1f6feb', borderTopColor: 'transparent' }} />}
              Excel（.xlsx）でダウンロード
            </button>
            <button className="btn-out" onClick={() => onDownload('csv')} disabled={exporting !== null}>
              {exporting === 'csv' && <span className="spin" style={{ borderColor: '#1f6feb', borderTopColor: 'transparent' }} />}
              CSV（.csv）でダウンロード
            </button>
            <span className="fname">ファイル名: {baseFilename}.xlsx / .csv</span>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <>
      <div className="k">{label}</div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={value.length > 40 ? 3 : 1} />
    </>
  );
}
