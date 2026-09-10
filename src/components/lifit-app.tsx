"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Activity,
  House,
  ListChecks,
  ChartNoAxesCombined,
  MessageCircle,
  UserRound,
  Sprout,
  ChevronRight,
  HeartPulse,
  Footprints,
  Utensils,
  Check,
  Plus,
  ShieldCheck,
  FlaskConical,
  BookOpen,
  Send,
  CircleHelp,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  ActionLog,
  AppState,
  HealthAssessment,
  HealthCheck,
  LogStatus,
  Recommendation,
  UserData,
  UserProfile,
} from "@/lib/types";
import { demoUsers, localDate, metrics } from "@/lib/mock-data";
import {
  askAI,
  assessHealth,
  createActionPlan,
  getEvidence,
  getReferral,
} from "@/lib/services";
import { initialState, isValidState, STORAGE_KEY } from "@/lib/storage";
import { ActionIcon, Brand, Modal } from "./ui";
import EntryFlow from "./entry-flow";
import HistoryView from "./history-view";
type Tab = "home" | "actions" | "history" | "chat" | "profile";
const tabs = [
  { id: "home", label: "ホーム", icon: House },
  { id: "actions", label: "アクション", icon: ListChecks },
  { id: "history", label: "記録", icon: ChartNoAxesCombined },
  { id: "chat", label: "AI相談", icon: MessageCircle },
  { id: "profile", label: "マイページ", icon: UserRound },
] as const;
export default function LifitApp() {
  const [state, setState] = useState<AppState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [flow, setFlow] = useState<"new" | "edit" | null>(null);
  const [selectedAction, setSelectedAction] = useState<Recommendation | null>(
    null,
  );
  const [selectedMetric, setSelectedMetric] = useState<HealthAssessment | null>(
    null,
  );
  const [showResults, setShowResults] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [showConsult, setShowConsult] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [toast, setToast] = useState("");
  const [storageError, setStorageError] = useState("");
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);
  const sendLock = useRef(false);
  const user = state.users[state.activeUserId];
  const check = [...user.checks]
    .sort((a, b) => a.date.localeCompare(b.date))
    .at(-1)!;
  const plan = createActionPlan(user.profile);
  const assessments = assessHealth(user.profile, check);
  const today = localDate();
  const todayLogs = user.logs.filter((l) => l.date === today);
  const achieved = plan.recommendations.filter((r) =>
    todayLogs.some((l) => l.recommendationId === r.id && l.status === "done"),
  ).length;
  const recorded = plan.recommendations.filter((r) =>
    todayLogs.some((l) => l.recommendationId === r.id),
  ).length;
  const referral = getReferral(user.profile, check);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValidState(parsed)) setState(parsed);
        else
          setStorageError(
            "保存データを読み込めなかったため、サンプルを表示しています。",
          );
      }
    } catch {
      setStorageError(
        "ブラウザ保存を利用できません。この画面を開いている間は操作できます。",
      );
    }
    const initialTab = window.location.hash.slice(1);
    if (tabs.some((t) => t.id === initialTab)) setTab(initialTab as Tab);
    setLoaded(true);
  }, []);
  useEffect(() => {
    const restoreTab = () => {
      const next = window.location.hash.slice(1);
      setTab(tabs.some((t) => t.id === next) ? (next as Tab) : "home");
      setFlow(null);
    };
    window.addEventListener("popstate", restoreTab);
    return () => window.removeEventListener("popstate", restoreTab);
  }, []);
  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        setStorageError(
          "ブラウザに保存できませんでした。画面を閉じると変更が失われる場合があります。",
        );
      }
    }
  }, [state, loaded]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (tab === "chat")
      chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [user.messages, sending, tab]);
  function navigate(next: Tab) {
    if (window.location.hash !== `#${next}`)
      window.history.pushState(null, "", `#${next}`);
    setTab(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function updateUser(id: string, fn: (u: UserData) => UserData) {
    setState((s) =>
      s.users[id] ? { ...s, users: { ...s.users, [id]: fn(s.users[id]) } } : s,
    );
  }
  function switchUser(id: string) {
    setState((s) => ({ ...s, activeUserId: id, onboarded: true }));
    setShowDemo(false);
    setFlow(null);
    setSelectedAction(null);
    setSelectedMetric(null);
    setShowEvidence(false);
    setQuestion("");
    navigate("home");
    setToast("デモプロフィールを切り替えました");
  }
  function record(id: string, status: LogStatus) {
    const log: ActionLog = {
      id: `${user.profile.id}-${today}-${id}`,
      userId: user.profile.id,
      recommendationId: id,
      date: today,
      status,
    };
    updateUser(user.profile.id, (u) => ({
      ...u,
      logs: [...u.logs.filter((l) => l.id !== log.id), log],
    }));
    setToast(
      status === "done"
        ? "今日の一歩を記録しました！"
        : status === "partial"
          ? "少しできたことも、大切な一歩。"
          : "記録しました。また自分のペースで。",
    );
  }
  function complete(profile: UserProfile, newCheck: HealthCheck) {
    if (flow === "new") {
      const id = `user-${crypto.randomUUID()}`;
      setState((s) => ({
        ...s,
        onboarded: true,
        activeUserId: id,
        users: {
          ...s.users,
          [id]: {
            profile: { ...profile, id },
            checks: [{ ...newCheck, userId: id }],
            logs: [],
            messages: [],
          },
        },
      }));
    } else {
      updateUser(user.profile.id, (u) => ({
        ...u,
        profile,
        checks: [...u.checks, newCheck],
      }));
      setState((s) => ({ ...s, onboarded: true }));
    }
    setFlow(null);
    navigate("home");
    setToast("健診結果を保存しました");
  }
  async function send(text = question) {
    const trimmed = text.trim();
    if (!trimmed || sendLock.current) return;
    sendLock.current = true;
    const id = user.profile.id;
    setQuestion("");
    setSending(true);
    updateUser(id, (u) => ({
      ...u,
      messages: [
        ...u.messages,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: trimmed,
          createdAt: new Date().toISOString(),
          source: "mock",
        },
      ],
    }));
    try {
      const content = await askAI(trimmed, user.profile, check);
      updateUser(id, (u) => ({
        ...u,
        messages: [
          ...u.messages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content,
            createdAt: new Date().toISOString(),
            source: "mock",
          },
        ],
      }));
    } catch {
      setToast("回答を取得できませんでした。もう一度お試しください。");
    } finally {
      setSending(false);
      sendLock.current = false;
    }
  }
  const modelRef = useRef(state);
  modelRef.current = state;
  useEffect(() => {
    type Context = {
      registerTool: (
        tool: {
          name: string;
          description: string;
          inputSchema: object;
          annotations: object;
          execute: (input: unknown) => unknown;
        },
        options: { signal: AbortSignal },
      ) => void | Promise<void>;
    };
    const ctx = (document as Document & { modelContext?: Context })
      .modelContext;
    if (!ctx) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        ctx.registerTool(
          {
            name: "lifit_read_demo_state",
            description:
              "Read the current demo profile, active theme, and number of saved action logs.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute: (input) => {
              if (
                !input ||
                typeof input !== "object" ||
                Array.isArray(input) ||
                Object.keys(input).length
              )
                throw new Error("Expected an empty input object");
              const s = modelRef.current;
              const u = s.users[s.activeUserId];
              return {
                profile: u.profile.name,
                scenario: u.profile.scenario,
                actionLogCount: u.logs.length,
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, []);
  if (flow)
    return (
      <EntryFlow
        profile={
          flow === "edit"
            ? user.profile
            : {
                id: "new",
                name: "あなた",
                sex: "unspecified",
                smoking: "未回答",
                drinking: "未回答",
                exercise: "未回答",
                sleep: "未回答",
                diet: "未回答",
                scenario: "pressure",
              }
        }
        editing={flow === "edit"}
        onCancel={() => setFlow(null)}
        onComplete={complete}
        onDemo={switchUser}
      />
    );
  const ranked = [...assessments].sort(
    (a, b) =>
      ["first", "next", "stable", "unknown"].indexOf(a.priority) -
      ["first", "next", "stable", "unknown"].indexOf(b.priority),
  );
  const primaryCards = ranked
    .filter((a) => a.priority !== "stable")
    .slice(0, 3);
  const visibleCards =
    primaryCards.length === 1
      ? [
          ...primaryCards,
          ...ranked.filter((a) => a.priority === "stable").slice(0, 2),
        ]
      : primaryCards;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand-button"
          onClick={() => navigate("home")}
          aria-label="Lifit ホーム"
        >
          <Brand />
        </button>
        <div className="brand-caption">健診の、その先へ。</div>
        <nav aria-label="メインナビゲーション">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              className={`nav-item ${tab === id ? "active" : ""}`}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => navigate(id)}
              key={id}
            >
              <Icon size={20} />
              {label}
              {tab === id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <ShieldCheck size={20} />
          <p>
            あなたのペースで、
            <br />
            健やかな毎日へ。
          </p>
          <button className="demo-switch" onClick={() => setShowDemo(true)}>
            <FlaskConical size={15} />
            デモプロフィールを切替
          </button>
          <span className="tiny">PROTOTYPE · LOCAL DATA</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>
            マイヘルス <ChevronRight size={14} />{" "}
            <b>{tabs.find((t) => t.id === tab)!.label}</b>
          </span>
          <div className="topbar-actions">
            <button className="demo-pill" onClick={() => setShowDemo(true)}>
              <i />
              デモモード
              <SlidersHorizontal size={12} />
            </button>
            <button
              className="avatar"
              onClick={() => navigate("profile")}
              aria-label="マイページ"
            >
              {user.profile.name.slice(0, 1)}
            </button>
          </div>
        </header>
        <main>
          {storageError && (
            <div className="notice warning" role="alert">
              {storageError}
            </div>
          )}
          {!state.onboarded && tab === "home" && (
            <div className="welcome-banner">
              <span>
                <Sparkles size={17} />
                <b>健診の、その先へ。</b>
                <span>自分に合う一歩を見つけよう。</span>
              </span>
              <button className="text-button" onClick={() => setFlow("new")}>
                初めての方はこちら
                <ArrowRight size={15} />
              </button>
            </div>
          )}
          {tab === "home" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">YOUR HEALTH, YOUR PACE</div>
                  <h1>
                    こんにちは、{user.profile.name}さん
                    <span className="wave">☀</span>
                  </h1>
                  <p>小さな一歩が、これからのあなたを変えていく。</p>
                </div>
                <button
                  className="button secondary"
                  onClick={() => setFlow("edit")}
                >
                  <Plus size={17} />
                  健診結果を追加
                </button>
              </div>
              <div className="home-grid">
                <section className="focus-card">
                  <div className="focus-copy">
                    <span className="pill light">
                      <Sprout size={15} />
                      今月のフォーカス
                    </span>
                    <h2>
                      {plan.focus.split("、")[0]}、<br />
                      {plan.focus.split("、")[1]}
                    </h2>
                    <p>
                      一度にすべて変えなくて大丈夫。
                      <br />
                      {user.profile.scenario === "liver"
                        ? "まずは、飲酒と休息の振り返りから。"
                        : "まずは、食事と歩く時間から。"}
                    </p>
                    <button
                      className="button dark"
                      onClick={() => navigate("actions")}
                    >
                      あなたのアクションを見る
                      <ArrowRight size={17} />
                    </button>
                  </div>
                  <div className="focus-orbit" aria-hidden="true">
                    <div className="orbit-center">
                      <HeartPulse size={37} strokeWidth={1.3} />
                      <span>一歩ずつ、健やかに。</span>
                    </div>
                    <span className="orbit-badge b1">
                      <Utensils size={22} />
                    </span>
                    <span className="orbit-badge b2">
                      <Footprints size={24} />
                    </span>
                    <span className="orbit-badge b3">
                      <Sprout size={23} />
                    </span>
                  </div>
                  <span className="focus-note">
                    選択テーマに合わせたサンプルプラン
                  </span>
                </section>
                <section className="card today-summary">
                  <div className="section-title">
                    <h3>今日の積み重ね</h3>
                    <span className="muted">TODAY</span>
                  </div>
                  <div
                    className="progress-ring"
                    style={{
                      background: `conic-gradient(#789558 ${(achieved / 3) * 360}deg,#edf0e7 0deg)`,
                    }}
                  >
                    <div>
                      <strong>
                        {achieved}
                        <span>/ 3</span>
                      </strong>
                      <p>アクション達成</p>
                    </div>
                  </div>
                  <p>
                    {achieved === 3
                      ? "今日の小さな一歩、積み重なりました。"
                      : "まずはひとつ、できることから。"}
                  </p>
                  <button
                    className="text-button"
                    onClick={() => navigate("actions")}
                  >
                    今日のアクションを記録
                    <ArrowRight size={16} />
                  </button>
                </section>
                <section className="overview">
                  <div className="section-heading">
                    <div>
                      <h2>からだの現在地</h2>
                      <p>
                        {check.source === "sample"
                          ? "今、気にかけたい項目を整理しました。"
                          : "入力した結果を確認しましょう。医学評価は未実施です。"}
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setShowResults(true)}
                    >
                      すべての結果
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                  <div className="metric-grid">
                    {visibleCards.map((a) => {
                      const metricId =
                        a.metricIds.find(
                          (id) => check.metrics[id] !== undefined,
                        ) ?? a.metricIds[0];
                      const m = metrics.find((m) => m.id === metricId)!;
                      return (
                        <button
                          className={`metric-card ${a.priority === "first" ? "priority" : ""}`}
                          key={a.id}
                          onClick={() => setSelectedMetric(a)}
                        >
                          <div className="metric-label">
                            <span className="metric-icon">
                              {a.id === "pressure" ? (
                                <HeartPulse size={18} />
                              ) : (
                                <Activity size={18} />
                              )}
                            </span>
                            <ChevronRight size={16} />
                          </div>
                          <span
                            className={`status ${a.priority === "first" ? "amber" : ""}`}
                          >
                            {
                              {
                                first: "まず取り組みたい",
                                next: "次に取り組みたい",
                                stable: "経過を見守る",
                                unknown:
                                  check.metrics[metricId] === undefined
                                    ? "未入力"
                                    : "評価未実施",
                              }[a.priority]
                            }
                          </span>
                          <h3>{a.title}</h3>
                          <div className="metric-value">
                            {check.metrics[metricId] ?? "—"}
                            <span>{m.unit}</span>
                          </div>
                          <p>
                            {a.id === "pressure" && check.metrics.diastolic
                              ? `拡張期 ${check.metrics.diastolic} mmHg`
                              : m.name}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  <div className="stable-strip">
                    <Check size={17} />
                    <b>
                      {check.source === "sample"
                        ? "経過を見守る項目"
                        : "入力データを保存済み"}
                    </b>
                    <span>
                      {check.source === "sample"
                        ? assessments
                            .filter((a) => a.priority === "stable")
                            .map((a) => a.title)
                            .join("・")
                        : "健診票の判定も確認してください"}
                    </span>
                    <span className="tiny">
                      {check.source === "sample"
                        ? "サンプル評価"
                        : "評価未実施"}
                    </span>
                  </div>
                </section>
                <section className="card encouragement">
                  <span className="icon-tile">
                    <Sprout />
                  </span>
                  <h3>完璧より、続けられること。</h3>
                  <p>
                    「少しできた」も、大切な一歩。
                    <br />
                    自分に合ったペースで進めましょう。
                  </p>
                </section>
              </div>
              {referral && (
                <button
                  className="referral-banner"
                  onClick={() => setShowConsult(true)}
                >
                  <ShieldCheck size={22} />
                  <span>
                    <b>{referral.title}</b>
                    <small>{referral.message}</small>
                  </span>
                  <ChevronRight size={18} />
                </button>
              )}
              <>
                {check.source === "manual" && (
                  <button
                    className="manual-consult"
                    onClick={() => setShowConsult(true)}
                  >
                    <ShieldCheck size={17} />
                    <span>健診で受診・再検査を勧められた方へ</span>
                    <ChevronRight size={16} />
                  </button>
                )}
              </>
              <section className="today-section">
                <div className="section-heading">
                  <div>
                    <h2>今日の、小さな一歩</h2>
                    <p>
                      {today.replaceAll("-", " / ")} · {recorded} / 3
                      件を記録済み
                    </p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("actions")}
                  >
                    プランを見る
                    <ArrowRight size={15} />
                  </button>
                </div>
                <div className="daily-grid">
                  {plan.recommendations.map((r) => (
                    <div className="daily-card" key={r.id}>
                      <button
                        className="daily-title"
                        onClick={() => setSelectedAction(r)}
                      >
                        <span className={`action-icon ${r.icon}`}>
                          <ActionIcon kind={r.icon} />
                        </span>
                        <div>
                          <small>{r.category}</small>
                          <h3>{r.subtitle}</h3>
                        </div>
                        <ChevronRight size={16} />
                      </button>
                      <LogButtons
                        current={
                          todayLogs.find((l) => l.recommendationId === r.id)
                            ?.status
                        }
                        onChange={(status) => record(r.id, status)}
                      />
                    </div>
                  ))}
                </div>
              </section>
              <button className="chat-invite" onClick={() => navigate("chat")}>
                <span className="chat-icon">
                  <Sparkles size={22} />
                </span>
                <span>
                  <b>「これって、どうしたらいい？」</b>
                  <small>食事や運動の疑問を、Lifitに相談してみよう。</small>
                </span>
                <ArrowUpRight size={20} />
              </button>
            </>
          )}
          {tab === "actions" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">YOUR ACTION PLAN</div>
                  <h1>今日からできる、あなたの一歩。</h1>
                  <p>全部できなくても大丈夫。取り組みやすいものから。</p>
                </div>
                <span className="pill light">
                  <Sprout size={15} />
                  今月の重点 · {plan.recommendations.length}アクション
                </span>
              </div>
              <Link href="/action-guides" className="action-guide-banner">
                <BookOpen size={28} />
                <span>
                  <strong>具体的なやり方を見る</strong>
                  <small>
                    食事や運動のアイデアから、できそうな一歩を見つけよう。
                  </small>
                </span>
                <ArrowRight size={24} />
              </Link>
              <div className="plan-intro">
                <div>
                  <span className="eyebrow">THIS MONTH’S FOCUS</span>
                  <h2>{plan.focus}</h2>
                  <p>選択したテーマと生活習慣を振り返るサンプルプランです。</p>
                </div>
                <div className="plan-progress">
                  <strong>
                    {achieved}
                    <span>/3</span>
                  </strong>
                  <span>今日できた</span>
                </div>
              </div>
              <div className="action-list">
                {plan.recommendations.map((r, i) => (
                  <article className="action-card card" key={r.id}>
                    <div className="action-topline">
                      <span className={`action-icon ${r.icon}`}>
                        <ActionIcon kind={r.icon} size={26} />
                      </span>
                      <span className="action-number">ACTION 0{i + 1}</span>
                      <span className="pill category">{r.category}</span>
                    </div>
                    <button
                      className="action-detail-button"
                      onClick={() => setSelectedAction(r)}
                    >
                      <h2>{r.title}</h2>
                      <p>{r.subtitle}</p>
                      <span>
                        アクションの説明を見る
                        <ArrowUpRight size={16} />
                      </span>
                    </button>
                    <Link href="/action-guides" className="button dark full">
                      具体的なやり方を見る
                      <ArrowRight size={16} />
                    </Link>
                    <div className="action-footer">
                      <button
                        className="text-button"
                        onClick={() => {
                          setSelectedAction(r);
                          setShowEvidence(true);
                        }}
                      >
                        <BookOpen size={15} />
                        根拠を見る
                      </button>
                      <span>今日の取り組み</span>
                    </div>
                    <LogButtons
                      current={
                        todayLogs.find((l) => l.recommendationId === r.id)
                          ?.status
                      }
                      onChange={(s) => record(r.id, s)}
                    />
                  </article>
                ))}
              </div>
              <div className="notice">
                <ShieldCheck size={19} />
                <span>
                  これは健康支援のサンプルです。治療中の方は医療者からの指示を優先してください。
                </span>
              </div>
              <button
                className="text-button"
                onClick={() => setShowConsult(true)}
              >
                医療機関への相談について
                <ArrowRight size={15} />
              </button>
            </>
          )}
          {tab === "history" && (
            <HistoryView user={user} onAdd={() => setFlow("edit")} />
          )}
          {tab === "chat" && (
            <div className="chat-page">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">LET’S TALK ABOUT YOUR HEALTH</div>
                  <h1>気になることを、気軽に。</h1>
                  <p>あなたの健診結果を振り返りながら、次の一歩を。</p>
                </div>
                <span className="pill category">AI回答はモック</span>
              </div>
              <div className="chat-context">
                <Activity size={17} />
                <span>相談のテーマ：{plan.focus}</span>
                <button
                  className="text-button"
                  onClick={() => setShowResults(true)}
                >
                  健診結果を見る
                </button>
              </div>
              <div
                className="chat-messages"
                aria-live="polite"
                aria-label="相談履歴"
              >
                <div className="message assistant">
                  <span className="chat-icon">
                    <Sprout size={20} />
                  </span>
                  <div>
                    <b>Lifit</b>
                    <p>
                      {user.profile.name}さん、こんにちは。
                      <br />
                      食事や運動など、毎日の「どうしたらいい？」を一緒に考えましょう。
                    </p>
                    <small>サンプル回答 · 診断や治療の判断は行いません</small>
                  </div>
                </div>
                {user.messages.map((m) => (
                  <div className={`message ${m.role}`} key={m.id}>
                    {m.role === "assistant" && (
                      <span className="chat-icon">
                        <Sprout size={20} />
                      </span>
                    )}
                    <div>
                      {m.role === "assistant" && <b>Lifit</b>}
                      <p>{m.content}</p>
                      {m.role === "assistant" && (
                        <small>モック回答 · 医学的根拠は未接続</small>
                      )}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="typing" role="status">
                    Lifitが回答を準備しています<span>•••</span>
                  </div>
                )}
                <div ref={chatEnd} />
              </div>
              <div className="suggested-questions">
                {[
                  "ラーメンは食べない方がいい？",
                  "週何回運動すればいい？",
                  "血圧が高いと何が問題なの？",
                ].map((q) => (
                  <button disabled={sending} onClick={() => send(q)} key={q}>
                    {q}
                    <Plus size={13} />
                  </button>
                ))}
              </div>
              <form
                className="chat-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                <input
                  aria-label="相談内容"
                  placeholder="気になっていることを聞いてみましょう"
                  maxLength={1000}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
                <button
                  aria-label="送信"
                  className="button dark"
                  disabled={!question.trim() || sending}
                >
                  <Send size={20} />
                </button>
              </form>
              <p className="field-note chat-disclaimer">
                強い症状や急な体調変化がある場合は、チャットを待たず医療機関へ。
              </p>
            </div>
          )}
          {tab === "profile" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">MY PROFILE</div>
                  <h1>あなたのこと。</h1>
                  <p>健診と暮らしの情報を、ひとつに。</p>
                </div>
              </div>
              <div className="profile-grid">
                <section className="card">
                  <div className="profile-title">
                    <span className="avatar large">
                      {user.profile.name.slice(0, 1)}
                    </span>
                    <div>
                      <h2>{user.profile.name}さん</h2>
                      <p>
                        {user.profile.age
                          ? `${user.profile.age}歳`
                          : "年齢未入力"}{" "}
                        ·{" "}
                        {
                          {
                            male: "男性",
                            female: "女性",
                            other: "その他",
                            unspecified: "性別未回答",
                          }[user.profile.sex]
                        }
                      </p>
                    </div>
                    <span className="pill category">
                      {user.profile.id.startsWith("demo")
                        ? "デモプロフィール"
                        : "この端末のプロフィール"}
                    </span>
                  </div>
                  <dl className="profile-facts">
                    {[
                      [
                        "身長",
                        user.profile.height
                          ? `${user.profile.height} cm`
                          : "未入力",
                      ],
                      [
                        "体重",
                        check.metrics.weight
                          ? `${check.metrics.weight} kg`
                          : "未入力",
                      ],
                      [
                        "腹囲",
                        user.profile.waist
                          ? `${user.profile.waist} cm`
                          : "未入力",
                      ],
                      ["喫煙", user.profile.smoking],
                      ["飲酒", user.profile.drinking],
                      ["運動", user.profile.exercise],
                      ["睡眠", user.profile.sleep],
                      ["食生活", user.profile.diet],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    className="button secondary full"
                    onClick={() => setFlow("new")}
                  >
                    <Plus size={16} />
                    別のプロフィールで入力を始める
                  </button>
                </section>
                <section className="card">
                  <span className="icon-tile">
                    <FlaskConical />
                  </span>
                  <h2>デモで、体験を広げよう。</h2>
                  <p className="intro">
                    3つのプロフィールで、重点テーマやアクションの違いを確認できます。
                  </p>
                  <button
                    className="button dark full"
                    onClick={() => setShowDemo(true)}
                  >
                    デモプロフィールを切替
                    <ArrowRight size={16} />
                  </button>
                  <div className="profile-link">
                    <button onClick={() => setFlow("new")}>
                      <CircleHelp size={18} />
                      サービスの説明を見る
                      <ChevronRight size={16} />
                    </button>
                    <button onClick={() => setShowConsult(true)}>
                      <ShieldCheck size={18} />
                      医療機関への相談について
                      <ChevronRight size={16} />
                    </button>
                    <button onClick={() => setShowReset(true)}>
                      <RotateCcw size={18} />
                      このブラウザの記録をリセット
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </section>
              </div>
              <div className="notice">
                <ShieldCheck size={20} />
                <span>
                  入力・相談内容はこのブラウザ内に保存されます。外部のAIや医療機関には送信していません。共有端末では利用後に記録をリセットしてください。
                </span>
              </div>
            </>
          )}
          <footer className="app-footer">
            <span>
              <Sprout size={13} />
              Lifit — あなたのペースで、健やかに。
            </span>
            <span>
              健康支援プロトタイプ · 診断・治療を行うものではありません
            </span>
          </footer>
        </main>
      </div>
      <Modal
        open={!!selectedAction}
        onClose={() => {
          setSelectedAction(null);
          setShowEvidence(false);
        }}
        title={
          showEvidence ? "アクションの根拠" : (selectedAction?.title ?? "")
        }
        description={
          showEvidence
            ? "Evidence DBとの接続を想定した表示です。文献内容・効果量は未検証です。"
            : selectedAction?.subtitle
        }
      >
        {selectedAction &&
          (showEvidence ? (
            <>
              <button
                className="text-button"
                onClick={() => setShowEvidence(false)}
              >
                ← アクションに戻る
              </button>
              {getEvidence(selectedAction.evidenceIds).map((e) => (
                <div className="evidence-card" key={e.id}>
                  <span className="pill category">{e.evidence_level}</span>
                  <h3>{e.source}</h3>
                  <dl>
                    <dt>推奨項目</dt>
                    <dd>{e.recommendation}</dd>
                    <dt>対象</dt>
                    <dd>{e.population}</dd>
                    <dt>期待される効果</dt>
                    <dd>{e.expected_effect}</dd>
                  </dl>
                  <p>{e.notes}</p>
                </div>
              ))}
              <div className="notice">
                <BookOpen size={18} />
                <span>
                  今後、監修済みの文献・発行年・推奨強度・本文リンクを表示します。現在は引用として利用できません。
                </span>
              </div>
            </>
          ) : (
            <>
              <span className={`action-icon ${selectedAction.icon}`}>
                <ActionIcon kind={selectedAction.icon} size={28} />
              </span>
              <div className="detail-section">
                <h3>なぜ、このアクション？</h3>
                <p>{selectedAction.why}</p>
              </div>
              <div className="detail-section">
                <h3>具体的にやってみること</h3>
                <ol>
                  {selectedAction.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                <Link href="/action-guides" className="button dark full">
                  食事・運動の具体的なやり方を見る
                  <ArrowRight size={16} />
                </Link>
              </div>
              {[
                ["期待できること", selectedAction.expectedEffect],
                ["続けるコツ", selectedAction.tips],
                ["気をつけたいこと", selectedAction.caution],
              ].map(([title, body]) => (
                <div className="detail-section" key={title}>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
              <button
                className="button secondary full"
                onClick={() => setShowEvidence(true)}
              >
                <BookOpen size={17} />
                根拠を見る
                <ArrowUpRight size={16} />
              </button>
              <div className="detail-section">
                <h3>今日はどうでしたか？</h3>
                <LogButtons
                  current={
                    todayLogs.find(
                      (l) => l.recommendationId === selectedAction.id,
                    )?.status
                  }
                  onChange={(s) => record(selectedAction.id, s)}
                />
              </div>
            </>
          ))}
      </Modal>
      <Modal
        open={!!selectedMetric}
        onClose={() => setSelectedMetric(null)}
        title={selectedMetric?.title ?? ""}
        description="検査値の意味を、ひとつずつ。"
      >
        {selectedMetric && (
          <>
            <div className="notice">
              {check.source === "sample"
                ? "優先順位はデモ用です。実際の正常・異常の判定ではありません。"
                : "入力値の保存のみ行っています。医学的評価は未実施です。"}
            </div>
            {selectedMetric.metricIds.map((id) => {
              const m = metrics.find((m) => m.id === id)!;
              return (
                <div className="result-row" key={id}>
                  <div>
                    <b>{m.name}</b>
                    <p>参考範囲：{m.reference}</p>
                  </div>
                  <strong>
                    {check.metrics[id] ?? "未入力"} <small>{m.unit}</small>
                  </strong>
                </div>
              );
            })}
            <div className="detail-section">
              <h3>今の状態を知る</h3>
              <p>{selectedMetric.explanation}</p>
            </div>
            <div className="detail-section">
              <h3>なぜ大切？</h3>
              <p>{selectedMetric.importance}</p>
            </div>
            <div className="detail-section">
              <h3>これからできること</h3>
              <p>{selectedMetric.opportunity}</p>
            </div>
            <button
              className="button dark full"
              onClick={() => {
                setSelectedMetric(null);
                navigate("actions");
              }}
            >
              アクションを見る
              <ArrowRight size={16} />
            </button>
            <button
              className="text-button"
              onClick={() => {
                setSelectedMetric(null);
                setShowConsult(true);
              }}
            >
              医療機関への相談について
            </button>
          </>
        )}
      </Modal>
      <Modal
        open={showResults}
        onClose={() => setShowResults(false)}
        title="健診結果の一覧"
        description={`${check.date} · ${check.source === "sample" ? "サンプルデータ" : "入力データ"}`}
      >
        {metrics.map((m) => (
          <div className="result-row" key={m.id}>
            <div>
              <b>{m.name}</b>
              <p>{m.reference}</p>
            </div>
            <strong>
              {check.metrics[m.id] ?? "—"} <small>{m.unit}</small>
            </strong>
          </div>
        ))}
        <div className="notice">
          参考範囲は検査機関や個人の状況により異なります。お手元の健診票の基準をご確認ください。
        </div>
        <button
          className="button dark full"
          onClick={() => {
            setShowResults(false);
            setFlow("edit");
          }}
        >
          健診結果を追加
          <Plus size={16} />
        </button>
      </Modal>
      <Modal
        open={showDemo}
        onClose={() => setShowDemo(false)}
        title="3つのストーリーを体験"
        description="切り替えても、プロフィールごとの行動記録や相談履歴は保持されます。"
      >
        {demoUsers.map((p, i) => (
          <button
            className={`demo-option ${state.activeUserId === p.id ? "selected" : ""}`}
            key={p.id}
            onClick={() => switchUser(p.id)}
          >
            <span className="avatar large">{String.fromCharCode(65 + i)}</span>
            <span>
              <b>
                {p.age}歳・{p.sex === "male" ? "男性" : "女性"}　{p.name}さん
              </b>
              <small>
                {
                  [
                    "血圧・BMI・LDLが気になる",
                    "血糖の変化が気になる",
                    "肝機能・飲酒習慣が気になる",
                  ][i]
                }
              </small>
            </span>
            {state.activeUserId === p.id ? (
              <Check size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        ))}
        {Object.values(state.users)
          .filter((u) => !u.profile.id.startsWith("demo"))
          .map((u) => (
            <button
              className="demo-option"
              key={u.profile.id}
              onClick={() => switchUser(u.profile.id)}
            >
              <span className="avatar">{u.profile.name.slice(0, 1)}</span>
              <span>
                <b>{u.profile.name}さん</b>
                <small>このブラウザで作成したプロフィール</small>
              </span>
              <ChevronRight size={18} />
            </button>
          ))}
        <p className="field-note">
          3つのデモは架空のプロフィールです。評価・プラン・過去の検査結果はデモ用のサンプルです。
        </p>
      </Modal>
      <Modal
        open={showConsult}
        onClose={() => setShowConsult(false)}
        title="医療者と、一緒に確認する。"
        description="生活改善と、必要な相談を両方大切に。"
      >
        <div className="notice">
          <ShieldCheck size={22} />
          <span>
            {referral?.message ??
              "健診票で受診・再検査を勧められた場合は、生活改善だけで済ませず医療機関へ相談してください。このデモは受診の要否を数値から判定しません。"}
          </span>
        </div>
        <div className="detail-section">
          <h3>相談するときに持っていくもの</h3>
          <ul>
            <li>今回と過去の健診結果</li>
            <li>服用している薬・サプリの情報</li>
            <li>気になる症状や、聞きたいことのメモ</li>
          </ul>
        </div>
        <div className="detail-section">
          <h3>こんなことを聞いてみましょう</h3>
          <p>
            「追加の検査は必要ですか？」
            <br />
            「自分に合った生活改善の目標は？」
          </p>
        </div>
        <p className="urgent-note">
          急な強い症状があるときは、このアプリで様子を見ずに医療機関へ。日本国内で緊急の場合は119番へ。
        </p>
        <button
          className="button dark full"
          onClick={() => {
            setShowConsult(false);
            setShowResults(true);
          }}
        >
          相談に使う健診結果を確認
          <BookOpen size={17} />
        </button>
      </Modal>
      <Modal
        open={showReset}
        onClose={() => setShowReset(false)}
        title="このブラウザの記録をリセット"
        description="入力した健診結果・行動記録・AI相談履歴を削除し、初期のデモに戻します。元には戻せません。"
      >
        <button
          className="button danger full"
          onClick={() => {
            setState(initialState());
            setShowReset(false);
            setStorageError("");
            navigate("home");
            setToast("記録をリセットしました");
          }}
        >
          すべてのローカル記録をリセット
        </button>
      </Modal>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
function LogButtons({
  current,
  onChange,
}: {
  current?: LogStatus;
  onChange: (status: LogStatus) => void;
}) {
  return (
    <div className="log-buttons" aria-label="今日の行動記録">
      {(
        [
          { id: "done", symbol: "○", label: "できた" },
          { id: "partial", symbol: "△", label: "一部できた" },
          { id: "missed", symbol: "−", label: "できなかった" },
        ] as const
      ).map((s) => (
        <button
          aria-pressed={current === s.id}
          className={current === s.id ? `selected ${s.id}` : ""}
          key={s.id}
          onClick={() => onChange(s.id)}
        >
          <span>{s.symbol}</span>
          {s.label}
        </button>
      ))}
    </div>
  );
}
