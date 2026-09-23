import type { HealthAgeInput } from "@/lib/health-age/types";

export const healthAgeQuestions = [
  [
    "cardiovascularHistory",
    "健診時までに冠動脈疾患・脳卒中（脳出血を含む）の既往がありますか",
  ],
  ["japanesePopulation", "この研究の対象集団（日本人）に該当しますか"],
  ["fastingSample", "一晩絶食して採血しましたか"],
  ["diabetes", "研究定義に該当する糖尿病がありますか（下の説明を確認）"],
  ["proteinuria", "健診の尿蛋白は1＋以上ですか"],
  ["smoking", "健診時に毎日1本以上、習慣的に喫煙していましたか"],
  [
    "regularExercise",
    "健診時に余暇のスポーツ・運動を週3回以上行っていましたか",
  ],
] as const;

export default function HealthAgeFields({
  value,
  onChange,
}: {
  value: HealthAgeInput;
  onChange: (value: HealthAgeInput) => void;
}) {
  return (
    <>
      <div className="form-grid">
        {healthAgeQuestions.map(([key, label]) => (
          <label key={key}>
            {label}
            <select
              value={typeof value[key] === "boolean" ? String(value[key]) : ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  [key]:
                    e.target.value === ""
                      ? undefined
                      : e.target.value === "true",
                })
              }
            >
              <option value="">不明・未回答</option>
              <option value="true">はい</option>
              <option value="false">いいえ</option>
            </select>
          </label>
        ))}
      </div>
      <p className="field-note">
        糖尿病の研究定義：空腹時血糖7.0 mmol/L以上、随時または75g負荷2時間値11.1
        mmol/L以上、または糖尿病の薬を使用。健診結果や医療者の確認に基づき回答し、判断できない場合は「不明」のままにしてください。HbA1cだけから判定しません。
      </p>
      <p className="field-note">
        尿蛋白が陰性・±なら「いいえ」、未測定なら「不明」。健康年齢は診断ではありません。
      </p>
    </>
  );
}
