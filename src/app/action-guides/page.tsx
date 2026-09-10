import Link from "next/link";
import { ArrowRight, Footprints, Utensils } from "lucide-react";
import { actionGuideGroups } from "@/lib/action-guides";

export const metadata = { title: "食事・運動のアイデア | Lifit" };

export default function ActionGuidesPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">SMALL STEPS, EVERY DAY</div>
          <h1>食事・運動のアイデア</h1>
          <p>具体的なやり方から、今日の自分に合う一歩を。</p>
        </div>
        <span className="pill light">サンプル一覧</span>
      </div>
      {actionGuideGroups.map((group) => {
        const Icon = group.id === "meals" ? Utensils : Footprints;
        return (
          <section
            className="guide-section"
            key={group.id}
            aria-labelledby={group.id}
          >
            <div className="section-heading">
              <div>
                <h2 id={group.id}>{group.title}</h2>
                <p>{group.description}</p>
              </div>
              <span className="muted">{group.items.length}件</span>
            </div>
            <ul className="guide-grid">
              {group.items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/action-guides/${item.id}`}
                    className="guide-card card"
                  >
                    <div className={`guide-art ${group.id}`}>
                      <Icon size={42} strokeWidth={1.4} />
                    </div>
                    <div className="guide-card-copy">
                      <span className="pill category">{item.tag}</span>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <span className="guide-card-link">
                        詳しく見る
                        <ArrowRight size={17} />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
