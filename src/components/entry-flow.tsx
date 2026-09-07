"use client";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FlaskConical,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { HealthCheck, UserProfile } from "@/lib/types";
import { demoUsers, localDate, metrics, sampleUser } from "@/lib/mock-data";
import { calculateBMI } from "@/lib/services";
import { Brand } from "./ui";
export default function EntryFlow({
  profile,
  editing = false,
  onCancel,
  onComplete,
  onDemo,
}: {
  profile: UserProfile;
  editing?: boolean;
  onCancel: () => void;
  onComplete: (profile: UserProfile, check: HealthCheck) => void;
  onDemo: (id: string) => void;
}) {
  const [step, setStep] = useState(editing ? 2 : 0);
  const [p, setP] = useState<UserProfile>(profile);
  const [values, setValues] = useState<HealthCheck["metrics"]>({
    height: profile.height,
    weight: profile.weight,
  });
  const [date, setDate] = useState(localDate());
  const [error, setError] = useState("");
  const [sample, setSample] = useState(false);
  function changeProfile(key: keyof UserProfile, value: string) {
    setP((prev) => ({
      ...prev,
      [key]: ["age", "height", "weight", "waist"].includes(key)
        ? value === ""
          ? undefined
          : Number(value)
        : value,
    }));
  }
  function complete() {
    const computed = {
      ...values,
      bmi: calculateBMI(values.height, values.weight),
    };
    if (
      !metrics.some(
        (m) =>
          !["height", "weight", "bmi"].includes(m.id) &&
          computed[m.id] !== undefined,
      )
    ) {
      setError("血圧や血液検査など、健診結果を1項目以上入力してください。");
      return;
    }
    if (
      values.systolic !== undefined &&
      values.diastolic !== undefined &&
      values.systolic <= values.diastolic
    ) {
      setError("収縮期血圧と拡張期血圧の入力を確認してください。");
      return;
    }
    onComplete(
      { ...p, height: values.height, weight: values.weight },
      {
        id: crypto.randomUUID(),
        userId: p.id,
        date,
        metrics: computed,
        source: sample ? "sample" : "manual",
      },
    );
  }
  return (
    <div className="entry-shell">
      <header className="entry-header">
        <Brand />
        <button className="text-button" onClick={onCancel}>
          {editing ? "ホームに戻る" : "デモを閉じる"}
        </button>
      </header>
      {step === 0 ? (
        <div className="welcome">
          <div className="eyebrow">A LITTLE CHANGE. A HEALTHIER YOU.</div>
          <div className="welcome-mark">
            <Sparkles size={38} strokeWidth={1.2} />
          </div>
          <h1>
            健診の結果を、
            <br />
            明日への一歩に。
          </h1>
          <p>
            気になる数値を、わかりやすく。
            <br />
            あなたの毎日に合う、小さな健康習慣を見つけよう。
          </p>
          <div className="welcome-steps">
            {["からだを知る", "一歩を決める", "変化を感じる"].map((v, i) => (
              <div key={v}>
                <span>0{i + 1}</span>
                {v}
              </div>
            ))}
          </div>
          <button className="button dark full" onClick={() => setStep(1)}>
            健診結果を入力して始める
            <ArrowRight size={18} />
          </button>
          <button
            className="button secondary full"
            onClick={() => onDemo("demo-a")}
          >
            <FlaskConical size={17} />
            サンプルで体験する
          </button>
          <div className="privacy-note">
            <ShieldCheck size={18} />
            <span>
              Lifitは診断や治療ではなく、健康づくりを支援するデモです。入力はこのブラウザに保存されます。実際の個人情報の入力はお控えください。
            </span>
          </div>
        </div>
      ) : (
        <div className="entry-form">
          <div className="step-track">
            <span className={step === 1 ? "current" : "complete"}>
              {step === 2 ? <Check size={13} /> : 1}
            </span>
            <b>あなたについて</b>
            <i />
            <span className={step === 2 ? "current" : ""}>2</span>
            <b>健診の結果</b>
          </div>
          <h1>
            {step === 1
              ? "まずは、あなたのこと。"
              : "健診結果を教えてください。"}
          </h1>
          <p className="intro">
            {step === 1
              ? "わかる範囲で大丈夫。今の暮らしに合う一歩を考えましょう。"
              : "健診票を見ながら、わかる項目だけ入力できます。"}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              if (step === 1) {
                setValues((v) => ({
                  ...v,
                  height: p.height,
                  weight: p.weight,
                }));
                setStep(2);
                window.scrollTo(0, 0);
              } else complete();
            }}
          >
            {step === 1 ? (
              <>
                <section className="card form-section">
                  <h2>基本情報</h2>
                  <div className="form-grid">
                    <label>
                      呼び名
                      <input
                        value={p.name}
                        maxLength={20}
                        required
                        onChange={(e) => changeProfile("name", e.target.value)}
                        placeholder="例：田中"
                      />
                    </label>
                    <label>
                      年齢
                      <div className="input-unit">
                        <input
                          type="number"
                          min="18"
                          max="120"
                          value={p.age ?? ""}
                          onChange={(e) => changeProfile("age", e.target.value)}
                        />
                        <span>歳</span>
                      </div>
                    </label>
                    <label>
                      性別
                      <select
                        value={p.sex}
                        onChange={(e) => changeProfile("sex", e.target.value)}
                      >
                        <option value="unspecified">回答しない</option>
                        <option value="male">男性</option>
                        <option value="female">女性</option>
                        <option value="other">その他</option>
                      </select>
                    </label>
                    {[
                      ["height", "身長", "cm", 80, 250],
                      ["weight", "体重", "kg", 20, 400],
                      ["waist", "腹囲", "cm", 30, 250],
                    ].map(([key, label, unit, min, max]) => (
                      <label key={key}>
                        {label}
                        <div className="input-unit">
                          <input
                            type="number"
                            step="0.1"
                            min={min}
                            max={max}
                            value={p[key as "height"] ?? ""}
                            onChange={(e) =>
                              changeProfile(
                                key as keyof UserProfile,
                                e.target.value,
                              )
                            }
                          />
                          <span>{unit}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </section>
                <section className="card form-section">
                  <h2>いつもの生活</h2>
                  <div className="form-grid">
                    {[
                      [
                        "smoking",
                        "喫煙",
                        ["未回答", "吸わない", "以前吸っていた", "吸っている"],
                      ],
                      [
                        "drinking",
                        "飲酒",
                        [
                          "未回答",
                          "飲まない",
                          "週1日以下",
                          "週2〜3日",
                          "ほぼ毎日",
                        ],
                      ],
                      [
                        "exercise",
                        "運動習慣",
                        ["未回答", "週1日未満", "週1〜2日", "週3日以上"],
                      ],
                      [
                        "sleep",
                        "睡眠時間",
                        [
                          "未回答",
                          "6時間未満",
                          "6〜7時間",
                          "7〜8時間",
                          "8時間以上",
                        ],
                      ],
                      [
                        "diet",
                        "食生活",
                        [
                          "未回答",
                          "自炊が多い",
                          "外食・中食が多い",
                          "甘い間食が多い",
                          "食事時間が不規則",
                        ],
                      ],
                    ].map(([key, label, options]) => (
                      <label key={String(key)}>
                        {label}
                        <select
                          value={String(p[key as keyof UserProfile])}
                          onChange={(e) =>
                            changeProfile(
                              key as keyof UserProfile,
                              e.target.value,
                            )
                          }
                        >
                          {(options as string[]).map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <>
                <div className="sample-toolbar">
                  <span>
                    <FlaskConical size={18} />
                    まずは試してみたい方へ
                  </span>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      const u = sampleUser(
                        demoUsers.find((d) => d.scenario === p.scenario)!,
                      );
                      const sampleValues = u.checks.at(-1)!.metrics;
                      setValues({
                        ...sampleValues,
                        height: p.height ?? sampleValues.height,
                        weight: p.weight ?? sampleValues.weight,
                      });
                      setSample(true);
                      setError("");
                    }}
                  >
                    サンプルデータを入力
                    <ArrowRight size={15} />
                  </button>
                </div>
                <section className="card form-section">
                  <div className="form-grid">
                    <label>
                      健診日
                      <input
                        type="date"
                        required
                        max={localDate()}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </label>
                    <label>
                      体験する重点テーマ
                      <select
                        value={p.scenario}
                        onChange={(e) => {
                          changeProfile("scenario", e.target.value);
                          setSample(false);
                        }}
                      >
                        <option value="pressure">血圧・体重</option>
                        <option value="glucose">血糖</option>
                        <option value="liver">飲酒・肝機能</option>
                      </select>
                    </label>
                  </div>
                  <p className="field-note">
                    テーマはサンプルプランの選択です。入力値による医学判定は行いません。
                  </p>
                </section>
                {[...new Set(metrics.map((m) => m.group))].map((group) => (
                  <section key={group} className="card form-section">
                    <h2>{group}</h2>
                    <div className="form-grid">
                      {metrics
                        .filter((m) => m.group === group)
                        .map((m) => (
                          <label key={m.id}>
                            {m.name}
                            {m.id === "bmi" ? (
                              <div className="computed-value">
                                {calculateBMI(values.height, values.weight) ??
                                  "—"}
                                <span>kg/m² · 自動計算</span>
                              </div>
                            ) : (
                              <div className="input-unit">
                                <input
                                  aria-label={m.name}
                                  type="number"
                                  inputMode="decimal"
                                  min={m.min}
                                  max={m.max}
                                  step={m.step}
                                  value={values[m.id] ?? ""}
                                  placeholder="未入力"
                                  onChange={(e) => {
                                    setSample(false);
                                    setValues((v) => ({
                                      ...v,
                                      [m.id]:
                                        e.target.value === ""
                                          ? undefined
                                          : Number(e.target.value),
                                    }));
                                  }}
                                />
                                <span>{m.unit}</span>
                              </div>
                            )}
                          </label>
                        ))}
                    </div>
                  </section>
                ))}
                {sample && (
                  <p className="success-note">
                    <Check size={16} />
                    サンプルデータを入力しました
                  </p>
                )}
                <p className="field-note">
                  入力範囲のチェックは誤入力防止用です。正常・異常を判定するものではありません。
                </p>
              </>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  if (step === 2) {
                    setP((current) => ({
                      ...current,
                      height: values.height,
                      weight: values.weight,
                    }));
                  }
                  setStep(step - 1);
                  setError("");
                }}
              >
                <ArrowLeft size={16} />
                戻る
              </button>
              <button className="button dark" type="submit">
                {step === 1 ? "健診結果の入力へ" : "結果とアクションを見る"}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
