import {
  Evidence,
  HealthMetric,
  Recommendation,
  UserData,
  UserProfile,
} from "./types";
export const metrics: HealthMetric[] = [
  {
    id: "systolic",
    name: "収縮期血圧",
    unit: "mmHg",
    group: "血圧",
    reference: "健診票の基準を確認",
    min: 40,
    max: 300,
    step: 1,
    description:
      "心臓が血液を送り出すときの血圧です。測定時の状況によって変わります。",
  },
  {
    id: "diastolic",
    name: "拡張期血圧",
    unit: "mmHg",
    group: "血圧",
    reference: "健診票の基準を確認",
    min: 20,
    max: 200,
    step: 1,
    description: "心臓が次の拍動に備えているときの血圧です。",
  },
  {
    id: "height",
    name: "身長",
    unit: "cm",
    group: "体格",
    reference: "評価対象外",
    min: 80,
    max: 250,
    step: 0.1,
    description: "BMIの計算に使用します。",
  },
  {
    id: "weight",
    name: "体重",
    unit: "kg",
    group: "体格",
    reference: "個人に合わせて設定",
    min: 20,
    max: 400,
    step: 0.1,
    description: "数値だけでなく、無理のない生活習慣と一緒に振り返ります。",
  },
  {
    id: "bmi",
    name: "BMI",
    unit: "kg/m²",
    group: "体格",
    reference: "健診票の基準を確認",
    min: 5,
    max: 150,
    step: 0.1,
    description: "体重と身長から計算する、体格の目安です。",
  },
  {
    id: "ldl",
    name: "LDLコレステロール",
    unit: "mg/dL",
    group: "脂質",
    reference: "健診票の基準を確認",
    min: 1,
    max: 600,
    step: 1,
    description: "血液中でコレステロールを運ぶ粒子のひとつです。",
  },
  {
    id: "hdl",
    name: "HDLコレステロール",
    unit: "mg/dL",
    group: "脂質",
    reference: "健診票の基準を確認",
    min: 1,
    max: 200,
    step: 1,
    description: "余分なコレステロールを回収する働きに関係します。",
  },
  {
    id: "triglycerides",
    name: "中性脂肪",
    unit: "mg/dL",
    group: "脂質",
    reference: "健診票の基準を確認",
    min: 1,
    max: 5000,
    step: 1,
    description:
      "体のエネルギー源になる脂質です。食事のタイミングでも変化します。",
  },
  {
    id: "glucose",
    name: "空腹時血糖",
    unit: "mg/dL",
    group: "糖代謝",
    reference: "健診票の基準を確認",
    min: 20,
    max: 1000,
    step: 1,
    description: "空腹のときの血液中のブドウ糖の量です。",
  },
  {
    id: "hba1c",
    name: "HbA1c",
    unit: "%",
    group: "糖代謝",
    reference: "健診票の基準を確認",
    min: 2,
    max: 20,
    step: 0.1,
    description: "一定期間の血糖の状態を振り返るための指標です。",
  },
  {
    id: "ast",
    name: "AST",
    unit: "U/L",
    group: "肝機能",
    reference: "健診票の基準を確認",
    min: 1,
    max: 10000,
    step: 1,
    description:
      "肝臓などの細胞に含まれる酵素です。ほかの項目と合わせて確認します。",
  },
  {
    id: "alt",
    name: "ALT",
    unit: "U/L",
    group: "肝機能",
    reference: "健診票の基準を確認",
    min: 1,
    max: 10000,
    step: 1,
    description: "主に肝臓に含まれる酵素です。数値だけで原因は判断できません。",
  },
  {
    id: "ggt",
    name: "γ-GTP",
    unit: "U/L",
    group: "肝機能",
    reference: "健診票の基準を確認",
    min: 1,
    max: 10000,
    step: 1,
    description:
      "肝臓・胆道の状態を見る指標のひとつです。飲酒などの影響を受けることがあります。",
  },
  {
    id: "uric",
    name: "尿酸",
    unit: "mg/dL",
    group: "その他",
    reference: "健診票の基準を確認",
    min: 0.1,
    max: 30,
    step: 0.1,
    description:
      "体内でつくられる物質です。ほかの検査や体調と合わせて確認します。",
  },
  {
    id: "egfr",
    name: "eGFR",
    unit: "mL/min/1.73m²",
    group: "その他",
    reference: "健診票の基準を確認",
    min: 1,
    max: 200,
    step: 0.1,
    description:
      "腎臓の働きを推定した値です。経過やほかの検査と合わせて確認します。",
  },
];
export const recommendations: Record<string, Recommendation> = {
  salt: {
    id: "salt",
    title: "まずは、汁を残すことから。",
    subtitle: "麺類のスープを飲みきらない",
    category: "食事",
    icon: "salt",
    why: "血圧を重点に置いたデモプランとして、塩分を意識する習慣を提案しています。",
    steps: [
      "麺類のスープは、飲みきらずに残す",
      "しょうゆやソースは、かける前に小皿へ",
      "買い物で「食塩相当量」を見比べる",
    ],
    expectedEffect:
      "具体的な効果量はEvidence DB接続後、対象者や条件を確認して表示します。",
    tips: "全部変えなくても大丈夫。今日の一食から選びましょう。",
    caution: "治療中の方は、医療者からの食事指導を優先してください。",
    evidenceIds: ["salt-jsh", "salt-review"],
  },
  walk: {
    id: "walk",
    title: "食後に、10分だけ歩こう。",
    subtitle: "いつもの帰り道を少し遠回り",
    category: "運動",
    icon: "walk",
    why: "取り組みやすい運動習慣の入口として、短い散歩を提案するデモです。",
    steps: [
      "予定に合う時間をひとつ決める",
      "話せるくらいの無理のないペースで歩く",
      "難しい日は短い時間でも記録する",
    ],
    expectedEffect:
      "体力や持病によって適した運動は異なります。数値の改善は保証しません。",
    tips: "お気に入りの音楽や、いつもの買い物と組み合わせて。",
    caution:
      "体調が悪いときは休みましょう。運動制限のある方は医療者に相談してください。",
    evidenceIds: ["activity-who", "activity-rct"],
  },
  meal: {
    id: "meal",
    title: "一食を、ゆっくり整える。",
    subtitle: "今日の一食を振り返る",
    category: "食事",
    icon: "meal",
    why: "体重や血糖に目を向けるデモプランとして、食生活を振り返るきっかけをつくります。",
    steps: [
      "今日の一食を振り返る",
      "主食・主菜・副菜があるか見てみる",
      "気づいたことを明日の食事にひとつ取り入れる",
    ],
    expectedEffect:
      "食事内容に応じた効果の説明は、監修済みEvidence DBから取得する想定です。",
    tips: "完璧な献立より、今の生活で続けられる工夫を。",
    caution:
      "厳しい食事制限や急な減量は避け、治療中の方は個別の指導を優先してください。",
    evidenceIds: ["meal-study"],
  },
  drink: {
    id: "drink",
    title: "飲まない日を、決めてみる。",
    subtitle: "今日はノンアルコールを選ぶ",
    category: "飲酒",
    icon: "drink",
    why: "飲酒習慣を振り返るデモプランです。肝機能の数値については医療機関への相談も大切にします。",
    steps: [
      "一週間の飲酒量を振り返る",
      "ノンアルコールの飲み物を用意する",
      "取り組めた日を記録する",
    ],
    expectedEffect:
      "飲酒だけが検査値の原因とは限りません。効果量は監修後に表示します。",
    tips: "飲み物を変えても、くつろぐ時間はそのままに。",
    caution:
      "飲酒を減らすと不調が出る方は、自己判断で進めず医療機関へ相談してください。",
    evidenceIds: ["alcohol-study"],
  },
  sleep: {
    id: "sleep",
    title: "寝る前に、ひと息つこう。",
    subtitle: "就寝前のスマホを少しお休み",
    category: "休息",
    icon: "sleep",
    why: "日々の生活リズムを振り返るためのデモアクションです。",
    steps: [
      "明日の起床時間を決める",
      "寝る前は照明を落として過ごす",
      "朝に休めた感覚を振り返る",
    ],
    expectedEffect: "期待される効果はEvidence DBで確認後に表示します。",
    tips: "一度に変えず、ひとつだけ試してみましょう。",
    caution: "眠れない状態が続く場合は医療者へ相談してください。",
    evidenceIds: ["sleep-study"],
  },
};
export const evidence: Evidence[] = [
  [
    "salt-jsh",
    "減塩",
    "日本高血圧学会ガイドライン（接続先例）",
    "ガイドライン",
  ],
  [
    "salt-review",
    "減塩",
    "減塩に関するレビュー（接続先例）",
    "システマティックレビュー",
  ],
  [
    "activity-who",
    "身体活動",
    "WHO 身体活動ガイドライン（接続先例）",
    "ガイドライン",
  ],
  ["activity-rct", "身体活動", "運動介入の比較試験（接続先例）", "RCT"],
  [
    "meal-study",
    "食生活の振り返り",
    "食生活に関する研究（接続先例）",
    "その他研究",
  ],
  [
    "alcohol-study",
    "飲酒習慣の振り返り",
    "飲酒に関する研究（接続先例）",
    "その他研究",
  ],
  ["sleep-study", "生活リズム", "睡眠に関する研究（接続先例）", "その他研究"],
].map(([id, recommendation, source, level]) => ({
  id,
  recommendation,
  source,
  evidence_level: level as Evidence["evidence_level"],
  evidence: "文献本文・推奨文は未接続です。",
  population: "対象集団は接続後に確認",
  expected_effect: "効果量は未検証・未表示",
  notes: "構造を示すサンプルです。引用・医学的根拠として使用できません。",
  verified: false,
}));
const base: Omit<UserProfile, "id" | "name" | "age" | "sex" | "scenario"> = {
  height: 172,
  weight: 78,
  waist: 92,
  smoking: "吸わない",
  drinking: "週2〜3日",
  exercise: "週1日未満",
  sleep: "6〜7時間",
  diet: "外食・中食が多い",
};
export const demoUsers: UserProfile[] = [
  {
    ...base,
    id: "demo-a",
    name: "田中",
    age: 44,
    sex: "male",
    scenario: "pressure",
  },
  {
    ...base,
    id: "demo-b",
    name: "佐藤",
    age: 53,
    sex: "female",
    height: 158,
    weight: 58,
    waist: 81,
    drinking: "飲まない",
    diet: "甘い間食が多い",
    scenario: "glucose",
  },
  {
    ...base,
    id: "demo-c",
    name: "鈴木",
    age: 36,
    sex: "male",
    height: 175,
    weight: 73,
    waist: 86,
    drinking: "ほぼ毎日",
    scenario: "liver",
  },
];
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function sampleUser(profile: UserProfile): UserData {
  const common = {
    height: profile.height,
    weight: profile.weight,
    systolic: 136,
    diastolic: 86,
    ldl: 142,
    hdl: 52,
    triglycerides: 138,
    glucose: 96,
    hba1c: 5.6,
    ast: 23,
    alt: 25,
    ggt: 36,
    uric: 6.2,
    egfr: 82,
    bmi: Math.round((profile.weight! / (profile.height! / 100) ** 2) * 10) / 10,
  };
  const values =
    profile.scenario === "glucose"
      ? {
          ...common,
          systolic: 122,
          diastolic: 76,
          ldl: 118,
          glucose: 116,
          hba1c: 6.1,
        }
      : profile.scenario === "liver"
        ? {
            ...common,
            systolic: 124,
            diastolic: 78,
            ldl: 116,
            ast: 48,
            alt: 62,
            ggt: 112,
          }
        : common;
  const today = new Date();
  const earlier = new Date(today);
  earlier.setMonth(earlier.getMonth() - 3);
  const middle = new Date(today);
  middle.setMonth(middle.getMonth() - 1);
  return {
    profile,
    checks: [
      {
        id: `${profile.id}-1`,
        userId: profile.id,
        date: localDate(earlier),
        source: "sample",
        metrics: {
          ...values,
          weight: profile.weight! + 2.5,
          bmi:
            Math.round(
              ((profile.weight! + 2.5) / (profile.height! / 100) ** 2) * 10,
            ) / 10,
          systolic: values.systolic + 12,
          hba1c: Math.round((values.hba1c + 0.2) * 10) / 10,
        },
      },
      {
        id: `${profile.id}-2`,
        userId: profile.id,
        date: localDate(middle),
        source: "sample",
        metrics: {
          ...values,
          weight: profile.weight! + 1,
          bmi:
            Math.round(
              ((profile.weight! + 1) / (profile.height! / 100) ** 2) * 10,
            ) / 10,
          systolic: values.systolic + 5,
          hba1c: Math.round((values.hba1c + 0.1) * 10) / 10,
        },
      },
      {
        id: `${profile.id}-3`,
        userId: profile.id,
        date: localDate(today),
        source: "sample",
        metrics: values,
        // Explicit synthetic examination facts, never inferred from lab values.
        // A demonstrates missing proteinuria; B complete; C out of age range.
        healthAgeContext: {
          age: profile.age,
          sex:
            profile.sex === "male" || profile.sex === "female"
              ? profile.sex
              : undefined,
          cardiovascularHistory: false,
          japanesePopulation: true,
          fastingSample: true,
          diabetes: false,
          proteinuria: profile.id === "demo-a" ? undefined : false,
          smoking: false,
          regularExercise: false,
        },
      },
    ],
    logs: [],
    messages: [],
  };
}
