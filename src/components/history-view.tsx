"use client";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowRight, CalendarDays } from "lucide-react";
import { UserData, MetricId } from "@/lib/types";
import { localDate, recommendations } from "@/lib/mock-data";
const options: { id: MetricId; label: string; unit: string }[] = [
  { id: "weight", label: "体重", unit: "kg" },
  { id: "systolic", label: "収縮期血圧", unit: "mmHg" },
  { id: "hba1c", label: "HbA1c", unit: "%" },
  { id: "ggt", label: "γ-GTP", unit: "U/L" },
];
export default function HistoryView({
  user,
  onAdd,
}: {
  user: UserData;
  onAdd: () => void;
}) {
  const [selected, setSelected] = useState<MetricId>("weight");
  const metric = options.find((o) => o.id === selected)!;
  const checks = [...user.checks].sort((a, b) => a.date.localeCompare(b.date));
  const points = checks.map((c) => ({
    date: c.date,
    value: c.metrics[selected],
  }));
  const valid = points.filter((p) => p.value !== undefined);
  const first = valid[0]?.value;
  const last = valid.at(-1)?.value;
  const [tab, setTab] = useState("checks");
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">SMALL STEPS, REAL PROGRESS</div>
          <h1>変化を、見つめる。</h1>
          <p>日々の積み重ねを、あなた自身のペースで。</p>
        </div>
        <button className="button secondary" onClick={onAdd}>
          健診結果を追加
        </button>
      </div>
      <div className="chart-summary">
        {options.slice(0, 3).map((o) => {
          const p = checks.filter((c) => c.metrics[o.id] !== undefined);
          return (
            <button
              className={`card ${selected === o.id ? "selected" : ""}`}
              key={o.id}
              onClick={() => setSelected(o.id)}
            >
              <span>{o.label}</span>
              <div>
                {p[0]?.metrics[o.id] ?? "—"}
                <ArrowRight size={18} />
                <strong>{p.at(-1)?.metrics[o.id] ?? "—"}</strong>
                <small>{o.unit}</small>
              </div>
              <p>
                {p.length > 1 ? "初回から今回の変化" : "次の結果で変化を確認"}
              </p>
            </button>
          );
        })}
      </div>
      <section className="card chart-card">
        <div className="section-heading">
          <div>
            <h2>{metric.label}の推移</h2>
            <p>記録した健診結果を表示 · {metric.unit}</p>
          </div>
          <select
            aria-label="グラフの項目"
            value={selected}
            onChange={(e) => setSelected(e.target.value as MetricId)}
          >
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {valid.length > 1 ? (
          <>
            <div className="change-indicator">
              <ArrowDownRight size={18} />
              {first} → {last} {metric.unit}
              <span>変化は生活改善の効果を証明するものではありません</span>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={points}
                  margin={{ top: 18, right: 18, left: -18, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="4 5"
                    vertical={false}
                    stroke="#e7ebe2"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => String(v).slice(5).replace("-", "/")}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#83917e", fontSize: 12 }}
                    dy={12}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#83917e", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      border: "1px solid #e1e8dc",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v) => [`${v} ${metric.unit}`, metric.label]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#6e8e51"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#fff", strokeWidth: 3 }}
                    activeDot={{ r: 7 }}
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <CalendarDays />
            <h3>
              {valid.length === 1
                ? "最初の一歩を記録しました"
                : "この項目はまだ未入力です"}
            </h3>
            <p>2回以上の結果を登録すると、ここに変化が表示されます。</p>
          </div>
        )}
        <p className="field-note">
          {checks.some((c) => c.source === "sample")
            ? "サンプル履歴を含みます。実際の改善実績ではありません。"
            : "手入力の記録です。評価には健診票や医療者の説明もご確認ください。"}
        </p>
      </section>
      <div className="segment-tabs">
        <button
          className={tab === "checks" ? "active" : ""}
          onClick={() => setTab("checks")}
        >
          健診の履歴
        </button>
        <button
          className={tab === "logs" ? "active" : ""}
          onClick={() => setTab("logs")}
        >
          行動の履歴
        </button>
      </div>
      <section className="card history-list">
        {tab === "checks" ? (
          checks.toReversed().map((c) => (
            <div className="history-row" key={c.id}>
              <span className="icon-tile">
                <CalendarDays size={19} />
              </span>
              <div>
                <b>{c.date.replaceAll("-", " / ")}</b>
                <p>
                  {c.source === "sample" ? "サンプル健診" : "登録した健診"} ·{" "}
                  {
                    Object.values(c.metrics).filter((v) => v !== undefined)
                      .length
                  }
                  項目
                </p>
              </div>
              <div className="history-number">
                {c.metrics[selected] ?? "—"} <span>{metric.unit}</span>
              </div>
            </div>
          ))
        ) : user.logs.length ? (
          user.logs
            .toSorted((a, b) => b.date.localeCompare(a.date))
            .map((l) => (
              <div className="history-row" key={l.id}>
                <span className={`log-symbol ${l.status}`}>
                  {l.status === "done"
                    ? "○"
                    : l.status === "partial"
                      ? "△"
                      : "−"}
                </span>
                <div>
                  <b>
                    {recommendations[l.recommendationId]?.subtitle ??
                      l.recommendationId}
                  </b>
                  <p>{l.date === localDate() ? "今日" : l.date}</p>
                </div>
                <span className="history-status">
                  {
                    {
                      done: "今日できた",
                      partial: "一部できた",
                      missed: "できなかった",
                    }[l.status]
                  }
                </span>
              </div>
            ))
        ) : (
          <div className="empty-state">
            <CalendarDays />
            <h3>今日から、積み重ねていこう。</h3>
            <p>アクション画面で記録すると、ここに履歴が残ります。</p>
          </div>
        )}
      </section>
    </>
  );
}
