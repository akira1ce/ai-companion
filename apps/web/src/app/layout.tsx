import type { Metadata } from 'next';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: '小薇 - AI 伴侣',
  description: '你的专属 AI 伴侣',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" className={cn("font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  );
}
