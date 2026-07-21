import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const nonprofitRoles = [
  "staff",
  "volunteer",
  "partner",
  "field_team",
  "finance_approver",
  "privacy_officer",
  "admin",
] as const;

export type NonprofitRole = (typeof nonprofitRoles)[number];
export type NonprofitRecordType =
  | "donor"
  | "grant"
  | "program"
  | "beneficiary"
  | "outcome";

export type NonprofitAction =
  | "record:read"
  | "record:write"
  | "record:transition"
  | "approval:decide"
  | "integration:ingest"
  | "audit:export"
  | "privacy:retain";

export interface ActorContext {
  userId: string;
  organizationId: string;
  roles: string[];
}

const actions = (...values: NonprofitAction[]): ReadonlySet<NonprofitAction> => new Set(values);

const roleActions: Record<NonprofitRole, ReadonlySet<NonprofitAction>> = {
  staff: actions("record:read", "record:write", "record:transition"),
  volunteer: actions("record:read"),
  partner: actions("record:read"),
  field_team: actions("record:read", "record:write"),
  finance_approver: actions(
    "record:read",
    "record:transition",
    "approval:decide",
    "integration:ingest",
    "audit:export",
  ),
  privacy_officer: actions(
    "record:read",
    "audit:export",
    "privacy:retain",
  ),
  admin: actions(
    "record:read",
    "record:write",
    "record:transition",
    "approval:decide",
    "integration:ingest",
    "audit:export",
    "privacy:retain",
  ),
};

export function authorize(
  actor: ActorContext,
  action: NonprofitAction,
  organizationId: string,
): void {
  if (!actor.userId || !actor.organizationId) {
    throw new GovernanceError("AUTH_REQUIRED", "Authenticated organization membership is required");
  }
  if (actor.organizationId !== organizationId) {
    throw new GovernanceError("ORG_BOUNDARY", "Cross-organization access is forbidden");
  }
  const allowed = actor.roles.some((role) =>
    nonprofitRoles.includes(role as NonprofitRole)
      ? roleActions[role as NonprofitRole].has(action)
      : false,
  );
  if (!allowed) {
    throw new GovernanceError("ROLE_FORBIDDEN", `Missing permission: ${action}`);
  }
}

const lifecycleStates: Record<NonprofitRecordType, readonly string[]> = {
  donor: ["prospect", "active", "inactive", "forgotten"],
  grant: ["draft", "submitted", "awarded", "closed", "rejected"],
  program: ["draft", "approved", "active", "closed"],
  beneficiary: ["pending_consent", "active", "exited", "forgotten"],
  outcome: ["draft", "submitted", "verified", "rejected"],
};

const transitions: Record<NonprofitRecordType, Record<string, readonly string[]>> = {
  donor: {
    prospect: ["active", "inactive"],
    active: ["inactive", "forgotten"],
    inactive: ["active", "forgotten"],
    forgotten: [],
  },
  grant: {
    draft: ["submitted"],
    submitted: ["awarded", "rejected"],
    awarded: ["closed"],
    closed: [],
    rejected: ["draft"],
  },
  program: {
    draft: ["approved"],
    approved: ["active"],
    active: ["closed"],
    closed: [],
  },
  beneficiary: {
    pending_consent: ["active", "forgotten"],
    active: ["exited", "forgotten"],
    exited: ["forgotten"],
    forgotten: [],
  },
  outcome: {
    draft: ["submitted"],
    submitted: ["verified", "rejected"],
    verified: [],
    rejected: ["draft"],
  },
};

export function initialState(type: NonprofitRecordType): string {
  if (type === "donor") return "prospect";
  if (type === "beneficiary") return "pending_consent";
  return "draft";
}

export function assertTransition(
  type: NonprofitRecordType,
  from: string,
  to: string,
  consentStatus: string,
  now = new Date(),
  consentExpiresAt?: Date | null,
): void {
  if (!lifecycleStates[type].includes(from) || !lifecycleStates[type].includes(to)) {
    throw new GovernanceError("INVALID_STATE", `Unknown ${type} lifecycle state`);
  }
  if (!transitions[type][from]?.includes(to)) {
    throw new GovernanceError("INVALID_TRANSITION", `${type} cannot transition from ${from} to ${to}`);
  }
  if (type === "beneficiary" && to === "active") {
    if (consentStatus !== "granted") {
      throw new GovernanceError("CONSENT_REQUIRED", "Active beneficiary records require granted consent");
    }
    if (consentExpiresAt && consentExpiresAt.getTime() <= now.getTime()) {
      throw new GovernanceError("CONSENT_EXPIRED", "Beneficiary consent has expired");
    }
  }
}

export function transitionNeedsApproval(
  type: NonprofitRecordType,
  to: string,
  amountCents = 0,
): boolean {
  return (
    (type === "grant" && ["submitted", "awarded", "closed"].includes(to)) ||
    (type === "program" && ["approved", "active", "closed"].includes(to)) ||
    (type === "outcome" && to === "verified") ||
    amountCents >= 100_000
  );
}

export function assertIndependentApproval(requestedBy: string, decidedBy: string): void {
  if (!requestedBy || !decidedBy || requestedBy === decidedBy) {
    throw new GovernanceError(
      "SEPARATION_OF_DUTIES",
      "Approval must be decided by a different authenticated user",
    );
  }
}

export function normalizeExternalId(value: string): string {
  return value.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

export function deduplicationKey(
  organizationId: string,
  connector: string,
  externalId: string,
): string {
  return createHash("sha256")
    .update(`${organizationId}\u0000${normalizeExternalId(connector)}\u0000${normalizeExternalId(externalId)}`)
    .digest("hex");
}

export function reconcileAmounts(expectedCents: number, receivedCents: number) {
  if (!Number.isSafeInteger(expectedCents) || !Number.isSafeInteger(receivedCents)) {
    throw new GovernanceError("INVALID_AMOUNT", "Reconciliation amounts must be integer cents");
  }
  const differenceCents = receivedCents - expectedCents;
  return {
    expectedCents,
    receivedCents,
    differenceCents,
    status: differenceCents === 0 ? "reconciled" : "exception",
  } as const;
}

export function resolveOfflineVersion(baseVersion: number, currentVersion: number): number {
  if (!Number.isSafeInteger(baseVersion) || baseVersion < 1) {
    throw new GovernanceError("INVALID_VERSION", "baseVersion must be a positive integer");
  }
  if (baseVersion !== currentVersion) {
    throw new GovernanceError(
      "OFFLINE_CONFLICT",
      `Offline event is based on version ${baseVersion}; current version is ${currentVersion}`,
    );
  }
  return currentVersion + 1;
}

export function verifyConnectorSignature(rawBody: string, provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided || "", "utf8");
  const expectedBuffer = Buffer.from(expected || "", "utf8");
  if (!rawBody || providedBuffer.length === 0 || providedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export const recordInputSchema = z.object({
  organizationId: z.string().trim().min(1).max(120),
  type: z.enum(["donor", "grant", "program", "beneficiary", "outcome"]),
  source: z.string().trim().min(1).max(80).default("manual"),
  externalId: z.string().trim().min(1).max(200),
  occurredAt: z.coerce.date(),
  consentStatus: z.enum(["not_applicable", "pending", "granted", "withdrawn"]).default("not_applicable"),
  consentExpiresAt: z.coerce.date().nullable().optional(),
  retentionUntil: z.coerce.date(),
  data: z.record(z.unknown()),
});

export const transitionInputSchema = z.object({
  toState: z.string().trim().min(1).max(40),
  reason: z.string().trim().min(8).max(500),
  amountCents: z.number().int().nonnegative().default(0),
});

export const integrationEventSchema = z.object({
  organizationId: z.string().trim().min(1).max(120),
  externalId: z.string().trim().min(1).max(200),
  occurredAt: z.coerce.date(),
  expectedCents: z.number().int(),
  receivedCents: z.number().int(),
  recordType: z.enum(["donor", "grant"]),
  payload: z.record(z.unknown()),
});

export const offlineBatchSchema = z.object({
  organizationId: z.string().trim().min(1).max(120),
  deviceId: z.string().trim().min(1).max(120),
  events: z.array(z.object({
    eventId: z.string().uuid(),
    recordId: z.string().uuid(),
    baseVersion: z.number().int().positive(),
    capturedAt: z.coerce.date(),
    changes: z.record(z.unknown()),
  })).min(1).max(100),
});

export class GovernanceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "GovernanceError";
  }
}
