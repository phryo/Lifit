import type { HealthAgeInput, RiskFactors } from "./types";
import { healthAgeReferenceProfile } from "./referenceProfile";

export const lowRiskFixture: HealthAgeInput & RiskFactors = {
  ...healthAgeReferenceProfile,
  age: 50,
  sex: "female",
  cardiovascularHistory: false,
  japanesePopulation: true,
  fastingSample: true,
  triglycerides: 100,
};
export const healthAgeFixtures = {
  low: lowRiskFixture,
  moderate: {
    ...lowRiskFixture,
    systolicBloodPressure: 140,
    ldl: 150,
    hdl: 50,
  },
  high: {
    ...lowRiskFixture,
    systolicBloodPressure: 170,
    ldl: 180,
    hdl: 35,
    diabetes: true,
    smoking: true,
  },
  missing: {
    ...lowRiskFixture,
    proteinuria: undefined,
    regularExercise: undefined,
  },
} satisfies Record<string, HealthAgeInput>;
