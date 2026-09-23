import type { HealthAgeModel, RiskFactors } from "./types";

// Honda et al. (online 2021; print 2022), DOI 10.5551/jat.61960.
// Table 2 and Results' explicit LDL multivariable equation. No interactions.
// Published rounded coefficients are intentional; do not infer extra digits
// from the simplified score's weights. 2023 erratum concerns Fig.1 only.
export const hisayamaCoefficients = Object.freeze({
  age: 0.077,
  male: 0.984,
  systolicBloodPressure: 0.01,
  diabetes: 0.459,
  hdl: -0.012,
  ldl: 0.005,
  proteinuria: 0.632,
  smoking: 0.336,
  noRegularExercise: 0.339,
});
export const hisayamaBaselineSurvival = 0.9696;
export const hisayamaCenter = 6.7963;
// Input sanity limits match the existing entry form; NOT validated model ranges.
export const numericInputLimits = {
  systolicBloodPressure: [40, 300],
  ldl: [1, 600],
  hdl: [1, 200],
} as const;
export const binaryRiskFields = [
  "diabetes",
  "proteinuria",
  "smoking",
  "regularExercise",
] as const;

export function calculateHisayamaRisk(x: RiskFactors): number {
  if (
    !Number.isInteger(x.age) ||
    x.age < 40 ||
    x.age > 84 ||
    !["male", "female"].includes(x.sex) ||
    binaryRiskFields.some((key) => typeof x[key] !== "boolean") ||
    Object.entries(numericInputLimits).some(([key, [min, max]]) => {
      const value = x[key as keyof typeof numericInputLimits];
      return !Number.isFinite(value) || value < min || value > max;
    })
  )
    throw new RangeError(
      "Hisayama requires valid, complete predictors aged 40–84",
    );
  const b = hisayamaCoefficients;
  const linearPredictor =
    b.age * x.age +
    b.male * Number(x.sex === "male") +
    b.systolicBloodPressure * x.systolicBloodPressure +
    b.diabetes * Number(x.diabetes) +
    b.hdl * x.hdl +
    b.ldl * x.ldl +
    b.proteinuria * Number(x.proteinuria) +
    b.smoking * Number(x.smoking) +
    b.noRegularExercise * Number(!x.regularExercise);
  return -Math.expm1(
    Math.log(hisayamaBaselineSurvival) *
      Math.exp(linearPredictor - hisayamaCenter),
  );
}
export const hisayamaModel: HealthAgeModel = Object.freeze({
  name: "久山町ASCVDモデル",
  version: "hisayama-2021-ldl-continuous-published-v1",
  minAge: 40,
  maxAge: 84,
  calculateRisk: calculateHisayamaRisk,
});
