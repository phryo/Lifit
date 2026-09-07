import {
  ActionPlan,
  HealthAssessment,
  HealthCheck,
  Referral,
  Scenario,
  UserProfile,
} from "./types";
import { evidence, metrics, recommendations } from "./mock-data";
export function calculateBMI(height?: number, weight?: number) {
  return height && weight
    ? Math.round((weight / (height / 100) ** 2) * 10) / 10
    : undefined;
}
// Scenario fixtures only: never infer a medical classification from arbitrary input.
export function assessHealth(
  profile: UserProfile,
  check: HealthCheck,
): HealthAssessment[] {
  const groups = [
    { id: "pressure", title: "血圧", metricIds: ["systolic", "diastolic"] },
    { id: "weight", title: "体重・BMI", metricIds: ["weight", "bmi"] },
    {
      id: "lipid",
      title: "コレステロール",
      metricIds: ["ldl", "hdl", "triglycerides"],
    },
    { id: "glucose", title: "血糖", metricIds: ["glucose", "hba1c"] },
    { id: "liver", title: "肝機能", metricIds: ["ast", "alt", "ggt"] },
    { id: "kidney", title: "尿酸・腎機能", metricIds: ["uric", "egfr"] },
  ] as const;
  return groups.map((g) => {
    const available = g.metricIds.some((id) => check.metrics[id] !== undefined);
    const isFirst = g.id === profile.scenario;
    const isNext =
      profile.scenario === "pressure" && ["weight", "lipid"].includes(g.id);
    return {
      id: g.id,
      title: g.title,
      metricIds: [...g.metricIds],
      priority:
        !available || check.source === "manual"
          ? "unknown"
          : isFirst
            ? "first"
            : isNext
              ? "next"
              : "stable",
      explanation: !available
        ? "結果が未入力です。わかる項目から追加できます。"
        : check.source === "manual"
          ? "入力した値を保存しました。医療評価は行っていません。"
          : isFirst
            ? "今月はこの項目を意識した習慣から始めましょう。"
            : isNext
              ? "重点項目と一緒に、少しずつ振り返りましょう。"
              : "このサンプルでは、経過を見守る項目です。",
      importance: metrics.find((m) => m.id === g.metricIds[0])!.description,
      opportunity:
        "取り組みを記録し、次の健診で変化を振り返りましょう。改善の見込みや目標値は医療者と相談して決めます。",
      isMock: true,
    };
  });
}
export function createActionPlan(profile: UserProfile): ActionPlan {
  const ids: Record<Scenario, string[]> = {
    pressure: ["salt", "walk", "meal"],
    glucose: ["meal", "walk", "sleep"],
    liver: ["drink", "walk", "sleep"],
  };
  return {
    id: `plan-${profile.id}`,
    userId: profile.id,
    focus: {
      pressure: "血圧を意識した、小さな習慣。",
      glucose: "食事と運動を、心地よい習慣に。",
      liver: "飲酒と休息を、見つめ直す。",
    }[profile.scenario],
    recommendations: ids[profile.scenario].map((id) => recommendations[id]),
    generatedBy: "mock",
  };
}
export function getEvidence(ids: string[]) {
  return evidence.filter((e) => ids.includes(e.id));
}
export function getReferral(
  profile: UserProfile,
  check: HealthCheck,
): Referral | null {
  return check.source === "sample" && profile.scenario === "liver"
    ? {
        title: "健診結果を、医療者と一緒に確認しましょう",
        message:
          "このデモは肝機能の結果について相談が必要なケースを想定しています。生活改善だけで済ませず、健診票を持って医療機関に相談しましょう。",
        urgency: "consult",
        source: "demo-scenario",
      }
    : null;
}
export async function askAI(
  question: string,
  profile: UserProfile,
  check: HealthCheck,
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 550));
  if (/胸.*痛|息苦|意識|激しい|倒れ|ろれつ/.test(question))
    return "急な強い症状や意識の異常などは、このチャットでは判断できません。日本国内で緊急の場合は119番に連絡してください。生活改善のアドバイスを待たず、医療機関に相談してください。";
  if (/薬|診断|治療|病気|やめて|やめる/.test(question))
    return "診断やお薬の変更について、このデモでは判断できません。健診結果と服用中のお薬を医師・薬剤師に伝えて相談してください。相談時に確認したいことをまとめておくと安心です。";
  const focus = {
    pressure: "血圧",
    glucose: "血糖",
    liver: "飲酒習慣・肝機能",
  }[profile.scenario];
  const value =
    check.metrics[
      { pressure: "systolic", glucose: "hba1c", liver: "ggt" }[
        profile.scenario
      ] as "systolic" | "hba1c" | "ggt"
    ];
  const unit = { pressure: "mmHg", glucose: "%", liver: "U/L" }[
    profile.scenario
  ];
  const intro = `${profile.name}さんの${check.source === "sample" ? "デモプラン" : "選択したサンプルプラン"}では、${focus}を重点にしています。${value !== undefined ? `入力値は${value} ${unit}です。` : ""}\n\n`;
  if (/ラーメン|塩|スープ/.test(question))
    return (
      intro +
      "食べる・食べないの二択ではなく、食べ方をひとつ工夫してみませんか。たとえば「スープを飲みきらない」「調味料を追加する前に味わう」から選べます。\n\n今日はひとつできたら、アクション画面に記録してみましょう。"
    );
  if (/運動|歩|週何/.test(question))
    return (
      intro +
      "まずは予定に合う日に、無理のない短い散歩を入れる例を用意しています。「夕食のあとに10分」など、時間を決めると振り返りやすくなります。\n\n適した頻度や強さは体調・持病によって異なります。運動制限がある場合は医療者に確認してください。"
    );
  if (/酒|飲/.test(question))
    return (
      intro +
      "まずは一週間の飲酒習慣を振り返るところから。ノンアルコールを選ぶ日を予定に入れるのもひとつの例です。\n\n肝機能の数値の原因はここでは判断できません。健診で相談を勧められた場合は、医療機関で結果を確認しましょう。"
    );
  return (
    intro +
    "このチャットは、健診結果と重点テーマを参照したサンプル回答です。個別の医学的な判断はできません。\n\nまずはアクション画面の「今日できそうなこと」をひとつ選びましょう。検査値の意味や適した目標は、健診票を見ながら医療者と確認してください。"
  );
}
