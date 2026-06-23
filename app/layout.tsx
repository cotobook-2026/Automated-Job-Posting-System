import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '求人票自動作成システム | 株式会社コトブック',
  description: '受領資料から求人票テンプレートに沿った求人票を自動作成し、Excel / CSV で出力します。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
