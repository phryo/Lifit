import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateHisayamaRisk,
  hisayamaCoefficients,
  hisayamaBaselineSurvival,
} from "../src/lib/health-age/hisayama";
import {
  calculateHealthAge,
  findEquivalentAge,
} from "../src/lib/health-age/healthAge";
import {
  lowRiskFixture as low,
  healthAgeFixtures,
} from "../src/lib/health-age/fixtures";
import { toHealthAgeInput } from "../src/lib/health-age/adapter";
import { initialState, isValidState } from "../src/lib/storage";
import type { HealthAgeInput, RiskFactors } from "../src/lib/health-age/types";

test("published Table 2 coefficients and Supplemental Table 1 baseline", () => {
  assert.deepEqual(hisayamaCoefficients, {
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
  assert.equal(hisayamaBaselineSurvival, 0.9696);
  // Construct LP = published center 6.7963: risk must equal I_event(10)=0.0304,
  // NOT the unadjusted 1-S_event(10)=0.0312 from Supplemental Table 1.
  const ldl = (6.7963 - (0.077 * 60 + 0.984 + 0.01 * 130 - 0.012 * 50)) / 0.005;
  assert.ok(
    Math.abs(
      calculateHisayamaRisk({
        ...low,
        age: 60,
        sex: "male",
        systolicBloodPressure: 130,
        hdl: 50,
        ldl,
      }) - 0.0304,
    ) < 1e-12,
  );
});

test("independent substitution in the paper's explicit continuous equation", () => {
  const x = {
    ...low,
    age: 60,
    sex: "male" as const,
    systolicBloodPressure: 150,
    ldl: 150,
    hdl: 50,
    diabetes: true,
    proteinuria: true,
    smoking: true,
    regularExercise: false,
  };
  // Hand summed from Results equation: 4.620+.984+1.500+.459-.600+.750+.632+.336+.339 = 9.020
  assert.ok(
    Math.abs(
      calculateHisayamaRisk(x) - (1 - 0.9696 ** Math.exp(9.02 - 6.7963)),
    ) < 1e-12,
  );
});

test("corrected Fig.1 zero-score chart provides an approximate cross-check, not a continuous-model oracle", () => {
  // DOI 10.5551/jat.ER61960, Correct Fig.1: score 0, 60–69 => 1.3%,
  // 70–79 => 2.6%, 80–84 => 4.5%. At assigned category ages, rounded
  // continuous coefficients differ from the integer score, so use 0.3 pp.
  for (const [age, chartRisk] of [
    [65, 0.013],
    [75, 0.026],
    [82, 0.045],
  ]) {
    assert.ok(
      Math.abs(calculateHisayamaRisk({ ...low, age }) - chartRisk) < 0.003,
    );
  }
});

test("reference users reproduce their age across both sexes and every eligible year", () => {
  for (const sex of ["male", "female"] as const)
    for (let age = 40; age <= 84; age++) {
      const result = calculateHealthAge({ ...low, age, sex });
      assert.equal(result.healthAge, age);
      assert.equal(result.ageDifference, 0);
      assert.equal(result.calculationStatus, "complete");
      assert.equal(result.boundary, "within");
    }
});

for (const [name, change] of Object.entries({
  "higher SBP": { systolicBloodPressure: 150 },
  "higher LDL": { ldl: 180 },
  smoking: { smoking: true },
  diabetes: { diabetes: true },
  proteinuria: { proteinuria: true },
  "no exercise": { regularExercise: false },
  "lower HDL": { hdl: 35 },
}))
  test(`${name} increases risk and age with other predictors held constant`, () => {
    const before = calculateHealthAge(low),
      after = calculateHealthAge({ ...low, ...change });
    assert.ok(after.healthAge! > before.healthAge!);
    assert.ok(after.estimatedRisk! > before.estimatedRisk!);
  });

test("improvement lowers age and risk; saturation is labelled instead of extrapolated", () => {
  const high = calculateHealthAge(healthAgeFixtures.high),
    moderate = calculateHealthAge(healthAgeFixtures.moderate);
  assert.ok(high.healthAge! > moderate.healthAge!);
  assert.ok(high.estimatedRisk! > moderate.estimatedRisk!);
  const upper = calculateHealthAge({ ...healthAgeFixtures.high, age: 84 });
  assert.equal(upper.boundary, "above");
  assert.equal(upper.healthAge, 84);
  assert.equal(upper.ageDifference, null);
  const lower = calculateHealthAge({
    ...low,
    age: 40,
    systolicBloodPressure: 100,
  });
  assert.equal(lower.boundary, "below");
  assert.equal(lower.ageDifference, null);
});

test("missing binary values enumerate both extremes without assigning a point estimate", () => {
  const input = healthAgeFixtures.missing,
    result = calculateHealthAge(input);
  assert.equal(result.calculationStatus, "provisional");
  assert.deepEqual(result.missingFields, ["proteinuria", "regularExercise"]);
  assert.equal(result.healthAge, null);
  assert.equal(result.estimatedRisk, null);
  assert.equal(result.ageDifference, null);
  assert.equal(
    result.riskRange![0],
    calculateHisayamaRisk({
      ...low,
      proteinuria: false,
      regularExercise: true,
    }),
  );
  assert.equal(
    result.riskRange![1],
    calculateHisayamaRisk({
      ...low,
      proteinuria: true,
      regularExercise: false,
    }),
  );
  assert.equal(input.proteinuria, undefined); // no mutation
});

test("each missing required field is reported; major missing fields stop calculation", () => {
  for (const key of Object.keys(low) as (keyof HealthAgeInput)[]) {
    const result = calculateHealthAge({ ...low, [key]: undefined });
    assert.ok(result.missingFields.includes(key));
    const binary = [
      "proteinuria",
      "regularExercise",
      "diabetes",
      "smoking",
    ].includes(key);
    assert.equal(
      result.calculationStatus,
      binary ? "provisional" : "unavailable",
    );
  }
});

test("eligibility gates reject age, all CVD history, outside population and invalid LDL conditions", () => {
  for (const patch of [
    { age: 39 },
    { age: 85 },
    { cardiovascularHistory: true },
    { japanesePopulation: false },
    { fastingSample: false },
    { triglycerides: 400 },
    { cardiovascularHistory: undefined },
  ]) {
    const result = calculateHealthAge({ ...low, ...patch });
    assert.equal(result.eligible, false);
    assert.equal(result.calculationStatus, "unavailable");
    assert.equal(result.healthAge, null);
    assert.equal(result.estimatedRisk, null);
  }
});

test("malformed values cannot become normal values or finite-looking risk", () => {
  for (const patch of [
    { age: NaN },
    { age: 40.5 },
    { ldl: Infinity },
    { hdl: 0 },
    { systolicBloodPressure: -1 },
    { smoking: "false" },
    { sex: "other" },
    { triglycerides: NaN },
  ]) {
    const result = calculateHealthAge({ ...low, ...patch } as HealthAgeInput);
    assert.equal(result.calculationStatus, "unavailable");
    assert.ok(result.invalidFields.length);
  }
  assert.throws(() => calculateHisayamaRisk({ ...low, hdl: NaN }));
  assert.throws(() =>
    calculateHisayamaRisk({
      ...low,
      diabetes: undefined,
    } as unknown as RiskFactors),
  );
});

test("equivalent age is deterministic and minimizes risk distance", () => {
  const risk = calculateHisayamaRisk({ ...low, systolicBloodPressure: 147 });
  const first = findEquivalentAge(risk, "female");
  assert.deepEqual(findEquivalentAge(risk, "female"), first);
  const distance = Math.abs(
    calculateHisayamaRisk({ ...low, age: first.age }) - risk,
  );
  for (let age = 40; age <= 84; age++)
    assert.ok(
      Math.abs(calculateHisayamaRisk({ ...low, age }) - risk) >= distance,
    );
  assert.throws(() => findEquivalentAge(NaN, "female"));
});

test("demo A provisional, B complete, C excluded; saved snapshots and legacy data remain safe", () => {
  const state = initialState();
  for (const [id, status] of [
    ["demo-a", "provisional"],
    ["demo-b", "complete"],
    ["demo-c", "unavailable"],
  ]) {
    const check = state.users[id].checks.at(-1)!;
    assert.equal(
      calculateHealthAge(toHealthAgeInput(check)).calculationStatus,
      status,
    );
  }
  assert.ok(isValidState(JSON.parse(JSON.stringify(state))));
  const check = state.users["demo-a"].checks.at(-1)!;
  const before = calculateHealthAge(toHealthAgeInput(check));
  state.users["demo-a"].profile.age = 80;
  assert.deepEqual(calculateHealthAge(toHealthAgeInput(check)), before);
  delete check.healthAgeContext;
  assert.ok(isValidState(state));
  assert.equal(
    calculateHealthAge(toHealthAgeInput(check)).calculationStatus,
    "unavailable",
  );
  (check as unknown as Record<string, unknown>).healthAgeContext = {
    diabetes: "false",
  };
  assert.equal(isValidState(state), false);
});
