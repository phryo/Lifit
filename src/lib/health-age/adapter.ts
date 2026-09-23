import type { HealthCheck } from "../types";
import type { HealthAgeInput } from "./types";

export function toHealthAgeInput(check: HealthCheck): HealthAgeInput {
  return {
    ...check.healthAgeContext,
    systolicBloodPressure: check.metrics.systolic,
    ldl: check.metrics.ldl,
    hdl: check.metrics.hdl,
    triglycerides: check.metrics.triglycerides,
  };
}
