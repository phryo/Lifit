import {
  binaryRiskFields,
  hisayamaModel,
  numericInputLimits,
} from "./hisayama";
import { healthAgeReferenceProfile } from "./referenceProfile";
import type {
  AgeEstimate,
  HealthAgeInput,
  HealthAgeModel,
  HealthAgeResult,
  InputField,
  RiskFactors,
} from "./types";

export const fieldLabels: Record<InputField, string> = {
  age: "健診時の年齢",
  sex: "モデルで用いる性別（男性・女性）",
  systolicBloodPressure: "収縮期血圧",
  ldl: "LDLコレステロール",
  hdl: "HDLコレステロール",
  diabetes: "糖尿病",
  proteinuria: "蛋白尿",
  smoking: "喫煙",
  regularExercise: "運動習慣",
  cardiovascularHistory: "冠動脈疾患・脳卒中の既往歴",
  japanesePopulation: "対象集団（日本人）の確認",
  fastingSample: "空腹時採血の確認",
  triglycerides: "中性脂肪",
};

export function findEquivalentAge(
  risk: number,
  sex: RiskFactors["sex"],
  model: HealthAgeModel = hisayamaModel,
): AgeEstimate {
  if (!Number.isFinite(risk) || risk < 0 || risk > 1)
    throw new RangeError("Invalid risk");
  const at = (age: number) =>
    model.calculateRisk({ ...healthAgeReferenceProfile, age, sex });
  if (risk < at(model.minAge)) return { age: model.minAge, boundary: "below" };
  if (risk > at(model.maxAge)) return { age: model.maxAge, boundary: "above" };
  let age = model.minAge;
  let distance = Infinity;
  for (let candidate = model.minAge; candidate <= model.maxAge; candidate++) {
    const next = Math.abs(at(candidate) - risk);
    if (next < distance) {
      age = candidate;
      distance = next;
    }
  }
  return { age, boundary: "within" }; // Exact ties select the younger age.
}

export function calculateHealthAge(input: HealthAgeInput): HealthAgeResult {
  const model = hisayamaModel;
  const required: InputField[] = [
    "age",
    "sex",
    "systolicBloodPressure",
    "ldl",
    "hdl",
    ...binaryRiskFields,
    "cardiovascularHistory",
    "japanesePopulation",
    "fastingSample",
    "triglycerides",
  ];
  const missingFields = required.filter((key) => input[key] == null);
  const invalidFields: InputField[] = [];
  if (
    input.age != null &&
    (!Number.isInteger(input.age) || !Number.isFinite(input.age))
  )
    invalidFields.push("age");
  if (input.sex != null && !["male", "female"].includes(input.sex))
    invalidFields.push("sex");
  for (const key of [
    ...binaryRiskFields,
    "cardiovascularHistory",
    "japanesePopulation",
    "fastingSample",
  ] as const) {
    if (input[key] != null && typeof input[key] !== "boolean")
      invalidFields.push(key);
  }
  for (const [key, [min, max]] of Object.entries(numericInputLimits)) {
    const field = key as keyof typeof numericInputLimits;
    const value = input[field];
    if (
      value != null &&
      (!Number.isFinite(value) || value < min || value > max)
    )
      invalidFields.push(field);
  }
  if (
    input.triglycerides != null &&
    (!Number.isFinite(input.triglycerides) ||
      input.triglycerides < 1 ||
      input.triglycerides > 5000)
  )
    invalidFields.push("triglycerides");
  const result: HealthAgeResult = {
    chronologicalAge: Number.isFinite(input.age) ? input.age! : null,
    healthAge: null,
    ageDifference: null,
    estimatedRisk: null,
    healthAgeRange: null,
    riskRange: null,
    boundary: null,
    calculationStatus: "unavailable",
    missingFields,
    invalidFields,
    modelName: model.name,
    modelVersion: model.version,
    eligible: false,
    reason: null,
  };
  if (invalidFields.length)
    return { ...result, reason: "入力値を確認してください。" };
  if (
    input.age != null &&
    (input.age < model.minAge || input.age > model.maxAge)
  )
    return {
      ...result,
      reason:
        "健診時の年齢では、この健康年齢モデルの対象範囲外です（40〜84歳）。",
    };
  if (input.cardiovascularHistory === true)
    return {
      ...result,
      reason: "冠動脈疾患・脳卒中の既往がある方は、このモデルの対象外です。",
    };
  if (input.japanesePopulation === false)
    return {
      ...result,
      reason:
        "このモデルは日本人の集団を対象としており、対象集団外の健康年齢は算出しません。",
    };
  if (
    input.fastingSample === false ||
    (input.triglycerides != null && input.triglycerides >= 400)
  )
    return {
      ...result,
      reason:
        "このLDLモデルでの算出には、空腹時かつ中性脂肪400 mg/dL未満の検査条件が必要です。",
    };
  if (
    [
      "age",
      "sex",
      "cardiovascularHistory",
      "japanesePopulation",
      "fastingSample",
      "triglycerides",
    ].some((key) => missingFields.includes(key as InputField))
  )
    return {
      ...result,
      reason: "算出には追加情報が必要です。対象条件を確認してください。",
    };
  result.eligible = true;
  if (
    ["systolicBloodPressure", "ldl", "hdl"].some((key) =>
      missingFields.includes(key as InputField),
    )
  )
    return {
      ...result,
      reason: "算出には追加情報が必要です。血圧・脂質の欠損値は補完しません。",
    };

  // Enumerate every possible binary completion. This is a sensitivity envelope,
  // NOT imputation, a point estimate, probability distribution or confidence interval.
  let scenarios = [{ ...input }];
  for (const key of binaryRiskFields) {
    if (input[key] == null)
      scenarios = scenarios.flatMap((s) => [
        { ...s, [key]: false },
        { ...s, [key]: true },
      ]);
  }
  const risks = scenarios.map((s) => model.calculateRisk(s as RiskFactors));
  const low = Math.min(...risks),
    high = Math.max(...risks);
  const lowerAge = findEquivalentAge(low, input.sex!),
    upperAge = findEquivalentAge(high, input.sex!);
  if (missingFields.length)
    return {
      ...result,
      calculationStatus: "provisional",
      riskRange: [low, high],
      healthAgeRange: [lowerAge, upperAge],
    };
  return {
    ...result,
    calculationStatus: "complete",
    estimatedRisk: low,
    healthAge: lowerAge.age,
    boundary: lowerAge.boundary,
    ageDifference:
      lowerAge.boundary === "within" ? lowerAge.age - input.age! : null,
  };
}
