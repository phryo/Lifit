export interface RiskFactors {
  age: number;
  sex: "male" | "female";
  systolicBloodPressure: number;
  ldl: number;
  hdl: number;
  diabetes: boolean;
  proteinuria: boolean;
  smoking: boolean;
  regularExercise: boolean;
}

export interface HealthAgeInput extends Partial<RiskFactors> {
  /** CHD or ANY ischemic/hemorrhagic stroke, not only ASCVD. */
  cardiovascularHistory?: boolean;
  japanesePopulation?: boolean;
  fastingSample?: boolean;
  triglycerides?: number;
}
export type InputField = keyof HealthAgeInput;
export type AgeBoundary = "within" | "below" | "above";
export interface AgeEstimate {
  age: number;
  boundary: AgeBoundary;
}
export interface HealthAgeResult {
  chronologicalAge: number | null;
  healthAge: number | null;
  ageDifference: number | null;
  estimatedRisk: number | null;
  healthAgeRange: [AgeEstimate, AgeEstimate] | null;
  riskRange: [number, number] | null;
  boundary: AgeBoundary | null;
  calculationStatus: "complete" | "provisional" | "unavailable";
  missingFields: InputField[];
  invalidFields: InputField[];
  modelName: string;
  modelVersion: string;
  eligible: boolean;
  reason: string | null;
}
export interface HealthAgeModel {
  name: string;
  version: string;
  minAge: number;
  maxAge: number;
  calculateRisk: (input: RiskFactors) => number;
}
