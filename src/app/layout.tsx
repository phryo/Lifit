import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Lifit — 健診の、その先へ。",
  description:
    "健診結果を理解して、あなたに合った小さな健康習慣を。Lifit インタラクティブデモ。",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
