import assert from "node:assert/strict";
import test from "node:test";
import {
  GovernanceError,
  assertIndependentApproval,
  assertTransition,
  authorize,
  deduplicationKey,
  initialState,
  reconcileAmounts,
  resolveOfflineVersion,
  transitionNeedsApproval,
  type ActorContext,
} from "./nonprofitGovernance";

const staff: ActorContext = {
  userId: "staff-1",
  organizationId: "org-a",
  roles: ["staff"],
};

test("permissions are role- and organization-scoped", () => {
  assert.doesNotThrow(() => authorize(staff, "record:write", "org-a"));
  assert.throws(
    () => authorize(staff, "record:write", "org-b"),
    (error: unknown) => error instanceof GovernanceError && error.code === "ORG_BOUNDARY",
  );
  assert.throws(
    () => authorize({ ...staff, roles: ["volunteer"] }, "record:write", "org-a"),
    (error: unknown) => error instanceof GovernanceError && error.code === "ROLE_FORBIDDEN",
  );
});

test("beneficiary activation requires current affirmative consent", () => {
  assert.equal(initialState("beneficiary"), "pending_consent");
  assert.throws(
    () => assertTransition("beneficiary", "pending_consent", "active", "pending"),
    (error: unknown) => error instanceof GovernanceError && error.code === "CONSENT_REQUIRED",
  );
  assert.throws(
    () => assertTransition(
      "beneficiary",
      "pending_consent",
      "active",
      "granted",
      new Date("2026-07-19T00:00:00Z"),
      new Date("2026-07-18T00:00:00Z"),
    ),
    (error: unknown) => error instanceof GovernanceError && error.code === "CONSENT_EXPIRED",
  );
  assert.doesNotThrow(() => assertTransition(
    "beneficiary",
    "pending_consent",
    "active",
    "granted",
    new Date("2026-07-19T00:00:00Z"),
    new Date("2027-07-19T00:00:00Z"),
  ));
});

test("invalid lifecycle shortcuts are rejected deterministically", () => {
  assert.throws(
    () => assertTransition("grant", "draft", "awarded", "not_applicable"),
    (error: unknown) => error instanceof GovernanceError && error.code === "INVALID_TRANSITION",
  );
  assert.doesNotThrow(() => assertTransition("grant", "draft", "submitted", "not_applicable"));
  assert.equal(transitionNeedsApproval("grant", "submitted"), true);
  assert.equal(transitionNeedsApproval("donor", "active", 99_999), false);
  assert.equal(transitionNeedsApproval("donor", "active", 100_000), true);
});

test("approval enforces separation of duties", () => {
  assert.throws(
    () => assertIndependentApproval("staff-1", "staff-1"),
    (error: unknown) => error instanceof GovernanceError && error.code === "SEPARATION_OF_DUTIES",
  );
  assert.doesNotThrow(() => assertIndependentApproval("staff-1", "approver-2"));
});

test("connector keys deduplicate formatting variants within an organization", () => {
  assert.equal(
    deduplicationKey("org-a", "QuickBooks", " DONATION   1001 "),
    deduplicationKey("org-a", "quickbooks", "donation 1001"),
  );
  assert.notEqual(
    deduplicationKey("org-a", "quickbooks", "donation 1001"),
    deduplicationKey("org-b", "quickbooks", "donation 1001"),
  );
});

test("reconciliation is exact integer-cent arithmetic", () => {
  assert.deepEqual(reconcileAmounts(12_345, 12_345), {
    expectedCents: 12_345,
    receivedCents: 12_345,
    differenceCents: 0,
    status: "reconciled",
  });
  assert.deepEqual(reconcileAmounts(12_345, 12_300), {
    expectedCents: 12_345,
    receivedCents: 12_300,
    differenceCents: -45,
    status: "exception",
  });
  assert.throws(() => reconcileAmounts(1.5, 2), /integer cents/);
});

test("offline events apply only to their exact base version", () => {
  assert.equal(resolveOfflineVersion(4, 4), 5);
  assert.throws(
    () => resolveOfflineVersion(3, 4),
    (error: unknown) => error instanceof GovernanceError && error.code === "OFFLINE_CONFLICT",
  );
});

test("nonprofit acceptance journey stays deterministic without an LLM", () => {
  const states: string[] = [initialState("program")];
  assertTransition("program", states.at(-1)!, "approved", "not_applicable");
  assert.equal(transitionNeedsApproval("program", "approved"), true);
  assertIndependentApproval("staff-1", "approver-2");
  states.push("approved");
  assertTransition("program", states.at(-1)!, "active", "not_applicable");
  states.push("active");
  assert.deepEqual(states, ["draft", "approved", "active"]);
});
