import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/ui";

export default function ActionGuidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="guide-shell">
      <header className="guide-header">
        <Link href="/" aria-label="Lifit ホーム">
          <Brand />
        </Link>
        <Link href="/#actions" className="text-button">
          <ArrowLeft size={16} />
          アクションに戻る
        </Link>
      </header>
      <main className="guide-main">{children}</main>
    </div>
  );
}
