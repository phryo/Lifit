export type Scenario = "pressure" | "glucose" | "liver";
export interface UserProfile {
  id: string;
  name: string;
  age?: number;
  sex: "male" | "female" | "other" | "unspecified";
  height?: number;
  weight?: number;
  waist?: number;
  smoking: string;
  drinking: string;
  exercise: string;
  sleep: string;
  diet: string;
  scenario: Scenario;
}
export type MetricId =
  | "systolic"
  | "diastolic"
  | "height"
  | "weight"
  | "bmi"
  | "ldl"
  | "hdl"
  | "triglycerides"
  | "glucose"
  | "hba1c"
  | "ast"
  | "alt"
  | "ggt"
  | "uric"
  | "egfr";
export interface HealthMetric {
  id: MetricId;
  name: string;
  unit: string;
  group: string;
  reference: string;
  min: number;
  max: number;
  step: number;
  description: string;
}
export interface HealthCheck {
  id: string;
  userId: string;
  date: string;
  metrics: Partial<Record<MetricId, number>>;
  source: "sample" | "manual";
  /** Snapshot at examination time. Older saved checks remain unknown. */
  healthAgeContext?: Omit<
    import("./health-age/types").HealthAgeInput,
    "systolicBloodPressure" | "ldl" | "hdl" | "triglycerides"
  >;
}
export interface HealthAssessment {
  id: string;
  metricIds: MetricId[];
  title: string;
  priority: "first" | "next" | "stable" | "unknown";
  explanation: string;
  importance: string;
  opportunity: string;
  isMock: true;
}
export interface Evidence {
  id: string;
  recommendation: string;
  evidence: string;
  source: string;
  evidence_level:
    "ガイドライン" | "システマティックレビュー" | "RCT" | "その他研究";
  population: string;
  expected_effect: string;
  notes: string;
  verified: false;
}
export interface Recommendation {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  icon: "salt" | "walk" | "meal" | "drink" | "sleep";
  why: string;
  steps: string[];
  expectedEffect: string;
  tips: string;
  caution: string;
  evidenceIds: string[];
}
export interface ActionPlan {
  id: string;
  userId: string;
  focus: string;
  recommendations: Recommendation[];
  generatedBy: "mock";
}
export type LogStatus = "done" | "partial" | "missed";
export interface ActionLog {
  id: string;
  userId: string;
  recommendationId: string;
  date: string;
  status: LogStatus;
}
export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  source: "mock";
}
export interface Referral {
  title: string;
  message: string;
  urgency: "consult" | "urgent";
  source: "demo-scenario" | "user-reported";
}
export interface UserData {
  profile: UserProfile;
  checks: HealthCheck[];
  logs: ActionLog[];
  messages: AIMessage[];
}
export interface AppState {
  version: 1;
  activeUserId: string;
  users: Record<string, UserData>;
  onboarded: boolean;
}
