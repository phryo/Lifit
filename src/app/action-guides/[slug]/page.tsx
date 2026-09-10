import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { actionGuideGroups } from "@/lib/action-guides";

const guides = actionGuideGroups.flatMap((group) => [...group.items]);

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.id }));
}

export const metadata = { title: "詳細ページ（テスト） | Lifit" };

export default async function ActionGuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = guides.find((item) => item.id === slug);
  if (!guide) notFound();

  return (
    <section className="card guide-placeholder">
      <span className="pill light">{guide.title}</span>
      <h1>詳細ページはテストです</h1>
      <Link href="/action-guides" className="button dark">
        <ArrowLeft size={17} />
        紹介一覧に戻る
      </Link>
    </section>
  );
}
