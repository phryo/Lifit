import type { RiskFactors } from "./types";

/** Honda et al., DOI 10.5551/jat.61960, Supplemental Table 3.
 * Assigned reference values (not treatment targets): SBP <120 -> 110,
 * LDL <120 -> 100, HDL >=60 -> 65. Binary values use the low-risk levels.
 * Sex is held equal to the patient; only age varies. See README.md.
 */
export const healthAgeReferenceProfile: Readonly<
  Omit<RiskFactors, "age" | "sex">
> = Object.freeze({
  systolicBloodPressure: 110,
  ldl: 100,
  hdl: 65,
  diabetes: false,
  proteinuria: false,
  smoking: false,
  regularExercise: true,
});
