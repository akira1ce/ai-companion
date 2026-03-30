import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '小薇 - AI 伴侣',
  description: '你的专属 AI 伴侣',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
