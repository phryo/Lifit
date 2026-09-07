import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateBMI,
  assessHealth,
  createActionPlan,
  getEvidence,
  getReferral,
  askAI,
} from "../src/lib/services";
import { demoUsers, sampleUser } from "../src/lib/mock-data";
import { initialState, isValidState } from "../src/lib/storage";
test("BMI is calculated with centimeters; incomplete values stay unknown", () => {
  assert.equal(calculateBMI(172, 78), 26.4);
  assert.equal(calculateBMI(undefined, 78), undefined);
  assert.equal(calculateBMI(0, 78), undefined);
});
test("three scenarios have different first priorities and fully connected evidence", () => {
  for (const profile of demoUsers) {
    const user = sampleUser(profile);
    const check = user.checks.at(-1)!;
    assert.equal(
      assessHealth(profile, check).find((a) => a.priority === "first")?.id,
      profile.scenario,
    );
    const plan = createActionPlan(profile);
    assert.equal(plan.recommendations.length, 3);
    for (const r of plan.recommendations) {
      assert.ok(r.steps.length > 0);
      assert.equal(getEvidence(r.evidenceIds).length, r.evidenceIds.length);
      assert.ok(getEvidence(r.evidenceIds).every((e) => e.verified === false));
    }
  }
});
test("arbitrary manual values never receive a normal or abnormal medical classification", () => {
  const p = demoUsers[0];
  const check = sampleUser(p).checks.at(-1)!;
  check.source = "manual";
  check.metrics.systolic = 250;
  assert.ok(assessHealth(p, check).every((a) => a.priority === "unknown"));
});
test("missing results are unknown even in a sample scenario", () => {
  const p = demoUsers[0];
  const check = sampleUser(p).checks.at(-1)!;
  delete check.metrics.systolic;
  delete check.metrics.diastolic;
  assert.equal(
    assessHealth(p, check).find((a) => a.id === "pressure")?.priority,
    "unknown",
  );
});
test("referral is an explicit fixture, not an invented medical threshold", () => {
  const p = demoUsers[2];
  const check = sampleUser(p).checks.at(-1)!;
  assert.equal(getReferral(p, check)?.source, "demo-scenario");
  check.source = "manual";
  assert.equal(getReferral(p, check), null);
});
test("saved state can be round-tripped and corrupt structures are rejected", () => {
  const s = initialState();
  assert.ok(isValidState(JSON.parse(JSON.stringify(s))));
  assert.equal(
    isValidState({
      version: 1,
      users: {},
      activeUserId: "missing",
      onboarded: true,
    }),
    false,
  );
  const broken = JSON.parse(JSON.stringify(s));
  broken.users["demo-a"].checks = [];
  assert.equal(isValidState(broken), false);
});
test("mock conversation uses active profile and does not provide medication instructions", async () => {
  const p = demoUsers[1];
  const check = sampleUser(p).checks.at(-1)!;
  const reply = await askAI("ラーメンは食べない方がいい？", p, check);
  assert.match(reply, /佐藤/);
  assert.match(reply, /血糖/);
  assert.match(reply, /6.1/);
  assert.match(await askAI("薬をやめていい？", p, check), /医師・薬剤師/);
  assert.match(await askAI("胸が痛い", p, check), /119/);
});
