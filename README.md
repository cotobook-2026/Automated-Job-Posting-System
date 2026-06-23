# 求人票自動作成システム（株式会社コトブック）

受領した資料（求人票PDF／画像・会議メモ・HP）を読み込み、Claude API でコトブックの
求人票テンプレートに沿った求人票を作成し、**Excel（.xlsx）/ CSV（.csv）** で出力する
1画面の Web アプリです。

## 特長 / 守っている制約

- **受領情報以外は推測で入れない**：資料に無い項目は空欄のまま出力。
- **テンプレートを一切変更しない**：`templates/求人票テンプレート.xlsx` を読み込み、
  値だけを所定のセルに流し込みます。セル結合・フォント・文字サイズ・印刷設定
  （A4縦・fitToPage）は変更しません。
- **A4縦2枚に収める**：各項目に文字数の上限を設け、Claude 側で文章量を調整します。
- **追加費用は Claude API のみ**：PDF・画像は Claude にそのまま渡し（OCR等の外部APIなし）、
  HP は サーバーの `fetch` で取得。DB やストレージは使いません。

## 画面の使い方

1. 求人票タイトル（任意）、企業名（任意・空欄なら資料から自動抽出）を入力
2. ファイル（PDF・画像・Excel など、複数可）／会議メモ／HP URL を入力
3. 「求人票を作成」を押すと結果が表示されます（内容を確認・手修正可能）
4. 「Excel でダウンロード」または「CSV でダウンロード」で出力
   - ファイル名：`【求人票】タイトル_企業名.xlsx`（タイトル空欄時は `【求人票】企業名.xlsx`）

## 技術構成

- Next.js 14（App Router / TypeScript）
- `@anthropic-ai/sdk`（モデル：`claude-sonnet-4-6`、PDF/画像を直接入力）
- `exceljs`（テンプレート体裁を保持して値のみ書き込み）
- ホスティング：Vercel（Hobby）

## ローカル開発

```bash
npm install
cp .env.example .env      # ANTHROPIC_API_KEY を設定
npm run dev               # http://localhost:3000
```

### 環境変数

| 変数 | 必須 | 説明 |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | ✅ | Claude API キー |
| `ANTHROPIC_MODEL` | 任意 | 既定 `claude-sonnet-4-6` |

## デプロイ（GitHub → Vercel）

1. このリポジトリを GitHub（コトブックの組織）に push
2. Vercel で New Project → 当該リポジトリを Import（Framework は Next.js 自動検出）
3. Environment Variables に `ANTHROPIC_API_KEY` を登録（必要なら `ANTHROPIC_MODEL` も）
4. Deploy

> Hobby プランの関数実行上限に合わせ、API ルートは `maxDuration = 60` を設定済みです。

## テンプレートの差し替え

`templates/求人票テンプレート.xlsx` を新しいファイルに置き換えてください。
レイアウト（セル位置）を変えた場合は `lib/fields.ts` のセル対応表（`cell`）を合わせて更新します。
