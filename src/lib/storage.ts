import { AppState, UserData } from "./types";
import { demoUsers, sampleUser, metrics } from "./mock-data";
export const STORAGE_KEY = "lifit-prototype-v1";
function validHealthAgeContext(value: unknown): boolean {
  if (value === undefined) return true; // Backwards compatible; no fabricated facts.
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value).every(([key, item]) => {
    if (item === undefined) return true;
    if (key === "age") return typeof item === "number" && Number.isFinite(item);
    if (key === "sex") return item === "male" || item === "female";
    return (
      [
        "diabetes",
        "proteinuria",
        "smoking",
        "regularExercise",
        "cardiovascularHistory",
        "japanesePopulation",
        "fastingSample",
      ].includes(key) && typeof item === "boolean"
    );
  });
}
export function initialState(): AppState {
  return {
    version: 1,
    activeUserId: "demo-a",
    users: Object.fromEntries(demoUsers.map((p) => [p.id, sampleUser(p)])),
    onboarded: false,
  };
}
export function isValidState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const s = value as AppState;
  if (
    s.version !== 1 ||
    typeof s.onboarded !== "boolean" ||
    !s.users ||
    !s.users[s.activeUserId]
  )
    return false;
  return Object.values(s.users).every(
    (u: UserData) =>
      u &&
      u.profile &&
      typeof u.profile.id === "string" &&
      typeof u.profile.name === "string" &&
      ["male", "female", "other", "unspecified"].includes(u.profile.sex) &&
      ["pressure", "glucose", "liver"].includes(u.profile.scenario) &&
      ["smoking", "drinking", "exercise", "sleep", "diet"].every(
        (k) => typeof u.profile[k as "smoking"] === "string",
      ) &&
      ["age", "height", "weight", "waist"].every(
        (k) =>
          u.profile[k as "age"] === undefined ||
          Number.isFinite(u.profile[k as "age"]),
      ) &&
      Array.isArray(u.checks) &&
      u.checks.length > 0 &&
      u.checks.every(
        (c) =>
          c &&
          typeof c.id === "string" &&
          typeof c.date === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(c.date) &&
          c.metrics &&
          validHealthAgeContext(c.healthAgeContext) &&
          typeof c.metrics === "object" &&
          Object.entries(c.metrics).every(
            ([key, value]) =>
              metrics.some((m) => m.id === key) &&
              (value === undefined ||
                (typeof value === "number" && Number.isFinite(value))),
          ) &&
          ["sample", "manual"].includes(c.source),
      ) &&
      Array.isArray(u.logs) &&
      u.logs.every(
        (l) =>
          l &&
          typeof l.id === "string" &&
          typeof l.recommendationId === "string" &&
          typeof l.date === "string" &&
          ["done", "partial", "missed"].includes(l.status),
      ) &&
      Array.isArray(u.messages) &&
      u.messages.every(
        (m) =>
          m &&
          typeof m.id === "string" &&
          typeof m.content === "string" &&
          ["user", "assistant"].includes(m.role),
      ),
  );
}
