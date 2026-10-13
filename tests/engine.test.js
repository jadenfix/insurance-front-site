import { test } from "node:test";
import assert from "node:assert/strict";
import { defaults, compare, validateScenario, payout } from "../engine.js";
test("higher coverage increases sample premium", () =>
  assert.ok(
    compare({ ...defaults, coverage: 600000 })[0].annual >
      compare(defaults)[0].annual,
  ));
test("higher deductible reduces sample premium", () =>
  assert.ok(
    compare({ ...defaults, deductible: 5000 })[0].annual <
      compare(defaults)[0].annual,
  ));
test("claim is bounded, deductible floor zero", () => {
  assert.equal(payout(500, 300000, 1000), 0);
  assert.equal(payout(400000, 300000, 1000), 299000);
});
test("invalid inputs rejected", () => {
  for (const s of [
    { coverage: NaN },
    { deductible: 3 },
    { age: -1 },
    { property: "unknown" },
  ])
    assert.throws(() => validateScenario({ ...defaults, ...s }));
});
test("three ordered plan tiers and exact deterministic values", () => {
  assert.deepEqual(
    compare(defaults).map((x) => x.annual),
    [919, 1085, 1305],
  );
});
