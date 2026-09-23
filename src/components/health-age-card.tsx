import { calculateHealthAge, fieldLabels } from "@/lib/health-age/healthAge";
import { toHealthAgeInput } from "@/lib/health-age/adapter";
import { healthAgeReferenceProfile } from "@/lib/health-age/referenceProfile";
import type { AgeEstimate } from "@/lib/health-age/types";
import type { HealthCheck } from "@/lib/types";

function ageLabel(value: AgeEstimate) {
  return `${value.age}歳${value.boundary === "below" ? "未満" : value.boundary === "above" ? "超" : ""}`;
}

export default function HealthAgeCard({
  check,
  onAdd,
}: {
  check: HealthCheck;
  onAdd: () => void;
}) {
  const input = toHealthAgeInput(check);
  const result = calculateHealthAge(input);
  const provisional = result.calculationStatus === "provisional";
  return (
    <section
      className="card health-age-card"
      aria-labelledby="health-age-title"
    >
      <div className="section-title">
        <h2 id="health-age-title">健康年齢</h2>
        <span className="pill light">
          {check.source === "sample" ? "サンプル · " : ""}
          {provisional ? "暫定値" : "参考指標"}
        </span>
      </div>
      <p className="health-age-caption">
        {check.date.replaceAll("-", " / ")} の健診結果
      </p>
      {result.healthAge !== null && result.boundary && (
        <>
          <p className="health-age-value">
            {ageLabel({ age: result.healthAge, boundary: result.boundary })}
          </p>
          <p>
            実年齢（健診時） {result.chronologicalAge}歳
            {result.ageDifference !== null && (
              <span>
                {" "}
                · 年齢差 {result.ageDifference > 0 ? "+" : ""}
                {result.ageDifference}歳
              </span>
            )}
          </p>
        </>
      )}
      {result.healthAgeRange && (
        <>
          <p className="health-age-value">
            {ageLabel(result.healthAgeRange[0])} 〜{" "}
            {ageLabel(result.healthAgeRange[1])}
          </p>
          <p>実年齢（健診時） {result.chronologicalAge}歳</p>
        </>
      )}
      {result.reason && <p className="health-age-info">{result.reason}</p>}
      <p className="health-age-caption">
        現在の心血管リスクを、年齢としてわかりやすく表した参考指標です。
      </p>
      {provisional && (
        <p className="health-age-info">
          暫定的な健康年齢です。不足項目の「あり・なし」両方を計算した範囲で、信頼区間ではありません。
        </p>
      )}
      {((result.boundary && result.boundary !== "within") ||
        result.healthAgeRange?.some((v) => v.boundary !== "within")) && (
        <p className="health-age-info">
          基準人物の40〜84歳のリスク範囲を超える部分は「40歳未満」「84歳超」と表示しています。範囲外の年齢は推定していません。
        </p>
      )}
      {result.missingFields.length > 0 && (
        <div className="health-age-info">
          <p>より正確な計算には以下の情報が必要です。</p>
          <ul>
            {result.missingFields.map((key) => (
              <li key={key}>{fieldLabels[key]}</li>
            ))}
          </ul>
          <button className="text-button" onClick={onAdd}>
            健診結果・追加情報を入力する
          </button>
        </div>
      )}
      {result.invalidFields.length > 0 && (
        <p className="health-age-info">
          確認が必要な項目：
          {result.invalidFields.map((key) => fieldLabels[key]).join("、")}
        </p>
      )}
      <details className="health-age-details">
        <summary>健康年齢とは？</summary>
        <p>
          血圧、コレステロール、喫煙などから推定した10年間の心血管リスクを、同じ性別で基準的に良好なリスク因子を持つ人の年齢に置き換えています。診断・生物学的年齢・寿命を示すものではありません。
        </p>
        <p>
          基準：収縮期血圧{healthAgeReferenceProfile.systolicBloodPressure}{" "}
          mmHg、LDL {healthAgeReferenceProfile.ldl} mg/dL、HDL{" "}
          {healthAgeReferenceProfile.hdl}
          mg/dL、糖尿病{healthAgeReferenceProfile.diabetes ? "あり" : "なし"}
          ・蛋白尿{healthAgeReferenceProfile.proteinuria ? "あり" : "なし"}
          ・喫煙{healthAgeReferenceProfile.smoking ? "あり" : "なし"}
          、定期的運動
          {healthAgeReferenceProfile.regularExercise ? "あり" : "なし"}
          。治療の目標値ではありません。
        </p>
        {result.estimatedRisk !== null && (
          <p>推定10年ASCVDリスク：{(result.estimatedRisk * 100).toFixed(2)}%</p>
        )}
        {result.riskRange && (
          <p>
            推定10年ASCVDリスクの暫定範囲：
            {result.riskRange.map((r) => (r * 100).toFixed(2)).join("〜")}%
          </p>
        )}
        <p>
          久山町研究のリスクモデルを使用しています。年齢換算はLifit独自の参考表示で、臨床的な妥当性は未検証です。
        </p>
      </details>
      {process.env.NODE_ENV === "development" && (
        <details className="health-age-details">
          <summary>開発用：計算情報</summary>
          <pre>
            {JSON.stringify(
              { input, result, referenceProfile: healthAgeReferenceProfile },
              null,
              2,
            )}
          </pre>
        </details>
      )}
    </section>
  );
}
