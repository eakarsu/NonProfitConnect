import test from "node:test";
import assert from "node:assert/strict";
import { fallbackProjectHealth, fallbackFundingFocus, fallbackReviewQueue, readableSections, hasProvider } from "./featureAi";
test("deterministic AI fallback is labelled and grounded in projects", () => {
  const out = fallbackProjectHealth([{ title: "A", status: "pending_review", category: "health", requestedAmount: 0 }, { title: "B", status: "approved", category: "health", requestedAmount: 50 }]);
  assert.equal(out.aiGenerated, false); assert.equal(out.sections.totalProjects, 2); assert.equal(out.sections.pendingReview, 1);
  assert.equal(fallbackFundingFocus([{ priority: "high", requestedAmount: 0 }]).sections.zeroAmountCount, 1);
  assert.equal(fallbackReviewQueue([{ title: "A", status: "submitted" }]).sections.awaitingReview, 1);
  assert.equal(hasProvider({} as any), false);
});
test("readable sections preserve false, 0 and empty", () => {
  const text = readableSections({ count: 0, active: false, note: "" });
  assert.match(text, /Count: 0/); assert.match(text, /Active: false/); assert.match(text, /Note: \(empty\)/);
});
