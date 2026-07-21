import type { Express, RequestHandler } from "express";
import { z } from "zod";
import { pool } from "./db";
import { storage } from "./storage";
import {
  GovernanceError,
  assertIndependentApproval,
  assertTransition,
  authorize,
  deduplicationKey,
  initialState,
  integrationEventSchema,
  nonprofitRoles,
  offlineBatchSchema,
  reconcileAmounts,
  recordInputSchema,
  resolveOfflineVersion,
  transitionInputSchema,
  transitionNeedsApproval,
  type ActorContext,
} from "./nonprofitGovernance";

type Queryable = { query: (text: string, values?: unknown[]) => Promise<any> };

async function transaction<T>(operation: (client: Queryable) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function sendError(res: any, error: unknown) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ code: "INVALID_INPUT", issues: error.issues });
  }
  if (error instanceof GovernanceError) {
    const status = ["AUTH_REQUIRED", "ROLE_FORBIDDEN", "ORG_BOUNDARY"].includes(error.code)
      ? 403
      : ["OFFLINE_CONFLICT", "SEPARATION_OF_DUTIES", "INVALID_TRANSITION"].includes(error.code)
        ? 409
        : 400;
    return res.status(status).json({ code: error.code, message: error.message });
  }
  console.error("Governed nonprofit operation failed", error);
  return res.status(500).json({ code: "INTERNAL_ERROR", message: "Operation failed" });
}

async function audit(
  client: Queryable,
  actor: ActorContext,
  action: string,
  entityType: string,
  entityId: string,
  reason: string | null,
  evidence: Record<string, unknown> = {},
) {
  await client.query(
    `INSERT INTO nonprofit_audit_events
      (organization_id, actor_id, action, entity_type, entity_id, reason, evidence)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [actor.organizationId, actor.userId, action, entityType, entityId, reason, JSON.stringify(evidence)],
  );
}

async function actorFor(req: any, getUserId: (request: any) => string): Promise<ActorContext> {
  const userId = getUserId(req);
  const user = await storage.getUser(userId);
  const organizationId = user?.organization?.trim();
  if (!user || !organizationId) {
    throw new GovernanceError(
      "AUTH_REQUIRED",
      "A persisted user with an organization membership is required",
    );
  }
  return { userId, organizationId, roles: user.roles || [] };
}

export function registerNonprofitOperationsRoutes(
  app: Express,
  unifiedAuth: RequestHandler,
  getUserId: (request: any) => string,
) {
  app.get("/api/nonprofit/records", unifiedAuth, async (req: any, res) => {
    try {
      const actor = await actorFor(req, getUserId);
      const organizationId = z.string().min(1).parse(req.query.organizationId);
      const recordType = req.query.type
        ? z.enum(["donor", "grant", "program", "beneficiary", "outcome"]).parse(req.query.type)
        : null;
      authorize(actor, "record:read", organizationId);
      const result = await pool.query(
        `SELECT id, organization_id AS "organizationId", record_type AS "type",
                lifecycle_state AS "state", source, external_id AS "externalId",
                source_occurred_at AS "sourceOccurredAt", consent_status AS "consentStatus",
                consent_expires_at AS "consentExpiresAt", retention_until AS "retentionUntil",
                data, version, created_at AS "createdAt", updated_at AS "updatedAt"
           FROM nonprofit_records
          WHERE organization_id = $1 AND deleted_at IS NULL
            AND ($2::varchar IS NULL OR record_type = $2)
          ORDER BY updated_at DESC, id
          LIMIT 200`,
        [organizationId, recordType],
      );
      res.json({ data: result.rows, count: result.rows.length });
    } catch (error) {
      sendError(res, error);
    }
  });

  app.post("/api/nonprofit/records", unifiedAuth, async (req: any, res) => {
    try {
      const actor = await actorFor(req, getUserId);
      const input = recordInputSchema.parse(req.body);
      authorize(actor, "record:write", input.organizationId);
      if (input.retentionUntil.getTime() <= input.occurredAt.getTime()) {
        throw new GovernanceError("INVALID_RETENTION", "Retention deadline must follow source occurrence");
      }
      const key = deduplicationKey(input.organizationId, input.source, input.externalId);
      const created = await transaction(async (client) => {
        const result = await client.query(
          `INSERT INTO nonprofit_records
            (organization_id, record_type, lifecycle_state, source, external_id,
             deduplication_key, source_occurred_at, consent_status, consent_expires_at,
             retention_until, data, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12)
           ON CONFLICT (organization_id, deduplication_key) DO NOTHING
           RETURNING id, lifecycle_state AS "state", version`,
          [
            input.organizationId,
            input.type,
            initialState(input.type),
            input.source,
            input.externalId,
            key,
            input.occurredAt,
            input.consentStatus,
            input.consentExpiresAt || null,
            input.retentionUntil,
            JSON.stringify(input.data),
            actor.userId,
          ],
        );
        if (result.rows[0]) {
          await audit(client, actor, "record.created", input.type, result.rows[0].id, null, {
            source: input.source,
            sourceOccurredAt: input.occurredAt.toISOString(),
          });
          return { ...result.rows[0], duplicate: false };
        }
        const existing = await client.query(
          `SELECT id, lifecycle_state AS "state", version
             FROM nonprofit_records WHERE organization_id = $1 AND deduplication_key = $2`,
          [input.organizationId, key],
        );
        return { ...existing.rows[0], duplicate: true };
      });
      res.status(created.duplicate ? 200 : 201).json(created);
    } catch (error) {
      sendError(res, error);
    }
  });

  app.post("/api/nonprofit/records/:id/transitions", unifiedAuth, async (req: any, res) => {
    try {
      const actor = await actorFor(req, getUserId);
      const recordId = z.string().uuid().parse(req.params.id);
      const input = transitionInputSchema.parse(req.body);
      const result = await transaction(async (client) => {
        const selected = await client.query(
          `SELECT id, organization_id, record_type, lifecycle_state, consent_status,
                  consent_expires_at, version
             FROM nonprofit_records WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
          [recordId],
        );
        const record = selected.rows[0];
        if (!record) throw new GovernanceError("NOT_FOUND", "Record not found");
        authorize(actor, "record:transition", record.organization_id);
        assertTransition(
          record.record_type,
          record.lifecycle_state,
          input.toState,
          record.consent_status,
          new Date(),
          record.consent_expires_at,
        );
        if (transitionNeedsApproval(record.record_type, input.toState, input.amountCents)) {
          const approval = await client.query(
            `INSERT INTO nonprofit_approvals
              (organization_id, record_id, requested_by, requested_state, reason)
             VALUES ($1,$2,$3,$4,$5)
             RETURNING id, status, requested_state AS "requestedState", requested_at AS "requestedAt"`,
            [record.organization_id, recordId, actor.userId, input.toState, input.reason],
          );
          await audit(client, actor, "transition.requested", record.record_type, recordId, input.reason, {
            fromState: record.lifecycle_state,
            toState: input.toState,
            approvalId: approval.rows[0].id,
          });
          return { pendingApproval: true, approval: approval.rows[0] };
        }
        const updated = await client.query(
          `UPDATE nonprofit_records
              SET lifecycle_state = $2, version = version + 1, updated_at = now()
            WHERE id = $1
            RETURNING id, lifecycle_state AS "state", version`,
          [recordId, input.toState],
        );
        await audit(client, actor, "record.transitioned", record.record_type, recordId, input.reason, {
          fromState: record.lifecycle_state,
          toState: input.toState,
        });
        return { pendingApproval: false, record: updated.rows[0] };
      });
      res.status(result.pendingApproval ? 202 : 200).json(result);
    } catch (error) {
      sendError(res, error);
    }
  });

  app.post("/api/nonprofit/approvals/:id/decision", unifiedAuth, async (req: any, res) => {
    try {
      const actor = await actorFor(req, getUserId);
      const approvalId = z.string().uuid().parse(req.params.id);
      const input = z.object({
        decision: z.enum(["approved", "rejected"]),
        reason: z.string().trim().min(8).max(500),
      }).parse(req.body);
      const result = await transaction(async (client) => {
        const selected = await client.query(
          `SELECT a.*, r.record_type, r.lifecycle_state, r.consent_status,
                  r.consent_expires_at, r.version
             FROM nonprofit_approvals a
             JOIN nonprofit_records r ON r.id = a.record_id
            WHERE a.id = $1 FOR UPDATE OF a, r`,
          [approvalId],
        );
        const approval = selected.rows[0];
        if (!approval) throw new GovernanceError("NOT_FOUND", "Approval not found");
        if (approval.status !== "pending") {
          throw new GovernanceError("ALREADY_DECIDED", "Approval has already been decided");
        }
        authorize(actor, "approval:decide", approval.organization_id);
        assertIndependentApproval(approval.requested_by, actor.userId);
        if (input.decision === "approved") {
          assertTransition(
            approval.record_type,
            approval.lifecycle_state,
            approval.requested_state,
            approval.consent_status,
            new Date(),
            approval.consent_expires_at,
          );
          await client.query(
            `UPDATE nonprofit_records
                SET lifecycle_state = $2, version = version + 1, updated_at = now()
              WHERE id = $1`,
            [approval.record_id, approval.requested_state],
          );
        }
        await client.query(
          `UPDATE nonprofit_approvals
              SET status = $2, decided_by = $3, decision_reason = $4, decided_at = now()
            WHERE id = $1`,
          [approvalId, input.decision, actor.userId, input.reason],
        );
        await audit(client, actor, `approval.${input.decision}`, approval.record_type, approval.record_id, input.reason, {
          approvalId,
          requestedState: approval.requested_state,
        });
        return { id: approvalId, status: input.decision, recordId: approval.record_id };
      });
      res.json(result);
    } catch (error) {
      sendError(res, error);
    }
  });

  app.post("/api/nonprofit/integrations/:connector/events", unifiedAuth, async (req: any, res) => {
    try {
      const actor = await actorFor(req, getUserId);
      const connector = z.string().regex(/^[a-z0-9_-]{2,40}$/).parse(req.params.connector);
      const input = integrationEventSchema.parse(req.body);
      authorize(actor, "integration:ingest", input.organizationId);
      const key = deduplicationKey(input.organizationId, connector, input.externalId);
      const reconciliation = reconcileAmounts(input.expectedCents, input.receivedCents);
      const result = await transaction(async (client) => {
        const inserted = await client.query(
          `INSERT INTO nonprofit_connector_receipts
            (organization_id, connector, external_id, deduplication_key, source_occurred_at,
             expected_cents, received_cents, difference_cents, reconciliation_status,
             payload, received_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11)
           ON CONFLICT (organization_id, connector, deduplication_key) DO NOTHING
           RETURNING id`,
          [
            input.organizationId,
            connector,
            input.externalId,
            key,
            input.occurredAt,
            input.expectedCents,
            input.receivedCents,
            reconciliation.differenceCents,
            reconciliation.status,
            JSON.stringify(input.payload),
            actor.userId,
          ],
        );
        if (!inserted.rows[0]) return { duplicate: true, reconciliation };
        await client.query(
          `INSERT INTO nonprofit_records
            (organization_id, record_type, lifecycle_state, source, external_id,
             deduplication_key, source_occurred_at, consent_status, retention_until,
             data, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'not_applicable',$8,$9::jsonb,$10)
           ON CONFLICT (organization_id, deduplication_key) DO NOTHING`,
          [
            input.organizationId,
            input.recordType,
            initialState(input.recordType),
            connector,
            input.externalId,
            key,
            input.occurredAt,
            new Date(input.occurredAt.getTime() + 7 * 365 * 24 * 60 * 60 * 1000),
            JSON.stringify(input.payload),
            actor.userId,
          ],
        );
        await audit(client, actor, "integration.received", "connector_receipt", inserted.rows[0].id, null, {
          connector,
          sourceOccurredAt: input.occurredAt.toISOString(),
          reconciliationStatus: reconciliation.status,
        });
        return { id: inserted.rows[0].id, duplicate: false, reconciliation };
      });
      res.status(result.duplicate ? 200 : 202).json(result);
    } catch (error) {
      sendError(res, error);
    }
  });

  app.post("/api/nonprofit/offline/batches", unifiedAuth, async (req: any, res) => {
    try {
      const actor = await actorFor(req, getUserId);
      const input = offlineBatchSchema.parse(req.body);
      authorize(actor, "record:write", input.organizationId);
      const outcomes = await transaction(async (client) => {
        const results: Array<Record<string, unknown>> = [];
        for (const event of input.events) {
          const duplicate = await client.query(
            "SELECT status, applied_version FROM nonprofit_offline_events WHERE event_id = $1",
            [event.eventId],
          );
          if (duplicate.rows[0]) {
            results.push({ eventId: event.eventId, status: "duplicate", appliedVersion: duplicate.rows[0].applied_version });
            continue;
          }
          const selected = await client.query(
            `SELECT organization_id, version FROM nonprofit_records
              WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
            [event.recordId],
          );
          const record = selected.rows[0];
          if (!record || record.organization_id !== input.organizationId) {
            throw new GovernanceError("NOT_FOUND", `Record ${event.recordId} not found in organization`);
          }
          try {
            const appliedVersion = resolveOfflineVersion(event.baseVersion, record.version);
            await client.query(
              `UPDATE nonprofit_records
                  SET data = data || $2::jsonb, version = $3, updated_at = now()
                WHERE id = $1`,
              [event.recordId, JSON.stringify(event.changes), appliedVersion],
            );
            await client.query(
              `INSERT INTO nonprofit_offline_events
                (event_id, organization_id, device_id, record_id, base_version,
                 applied_version, captured_at, changes, status, received_by)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,'applied',$9)`,
              [event.eventId, input.organizationId, input.deviceId, event.recordId, event.baseVersion,
                appliedVersion, event.capturedAt, JSON.stringify(event.changes), actor.userId],
            );
            await audit(client, actor, "offline.applied", "record", event.recordId, null, {
              eventId: event.eventId,
              deviceId: input.deviceId,
              baseVersion: event.baseVersion,
              appliedVersion,
            });
            results.push({ eventId: event.eventId, status: "applied", appliedVersion });
          } catch (error) {
            if (!(error instanceof GovernanceError) || error.code !== "OFFLINE_CONFLICT") throw error;
            await client.query(
              `INSERT INTO nonprofit_offline_events
                (event_id, organization_id, device_id, record_id, base_version,
                 captured_at, changes, status, conflict_reason, received_by)
               VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,'conflict',$8,$9)`,
              [event.eventId, input.organizationId, input.deviceId, event.recordId, event.baseVersion,
                event.capturedAt, JSON.stringify(event.changes), error.message, actor.userId],
            );
            results.push({ eventId: event.eventId, status: "conflict", currentVersion: record.version });
          }
        }
        return results;
      });
      res.status(outcomes.some((item) => item.status === "conflict") ? 207 : 200).json({ outcomes });
    } catch (error) {
      sendError(res, error);
    }
  });

  app.post("/api/nonprofit/privacy/retention", unifiedAuth, async (req: any, res) => {
    try {
      const actor = await actorFor(req, getUserId);
      const input = z.object({
        organizationId: z.string().min(1),
        confirm: z.boolean().default(false),
        justification: z.string().trim().min(12).max(500),
      }).parse(req.body);
      authorize(actor, "privacy:retain", input.organizationId);
      const result = await transaction(async (client) => {
        const candidates = await client.query(
          `SELECT id, record_type
             FROM nonprofit_records
            WHERE organization_id = $1 AND deleted_at IS NULL
              AND (retention_until <= now() OR consent_status = 'withdrawn')
            ORDER BY id FOR UPDATE`,
          [input.organizationId],
        );
        if (!input.confirm) return { dryRun: true, candidateCount: candidates.rows.length };
        for (const candidate of candidates.rows) {
          await client.query(
            `UPDATE nonprofit_records
                SET data = '{"redacted":true}'::jsonb,
                    lifecycle_state = CASE
                      WHEN record_type IN ('donor','beneficiary') THEN 'forgotten'
                      ELSE lifecycle_state
                    END,
                    consent_status = 'withdrawn', deleted_at = now(), updated_at = now(),
                    version = version + 1
              WHERE id = $1`,
            [candidate.id],
          );
          await audit(client, actor, "privacy.redacted", candidate.record_type, candidate.id, input.justification);
        }
        return { dryRun: false, redactedCount: candidates.rows.length };
      });
      res.json(result);
    } catch (error) {
      sendError(res, error);
    }
  });

  app.get("/api/nonprofit/audit", unifiedAuth, async (req: any, res) => {
    try {
      const actor = await actorFor(req, getUserId);
      const organizationId = z.string().min(1).parse(req.query.organizationId);
      const after = z.coerce.number().int().nonnegative().default(0).parse(req.query.after || 0);
      authorize(actor, "audit:export", organizationId);
      const result = await pool.query(
        `SELECT sequence, actor_id AS "actorId", action, entity_type AS "entityType",
                entity_id AS "entityId", reason, evidence, occurred_at AS "occurredAt"
           FROM nonprofit_audit_events
          WHERE organization_id = $1 AND sequence > $2
          ORDER BY sequence LIMIT 1000`,
        [organizationId, after],
      );
      res.json({ organizationId, data: result.rows, nextAfter: result.rows.at(-1)?.sequence || after });
    } catch (error) {
      sendError(res, error);
    }
  });

  app.put("/api/nonprofit/members/:userId", unifiedAuth, async (req: any, res) => {
    try {
      const actor = await actorFor(req, getUserId);
      const userId = z.string().min(1).max(200).parse(req.params.userId);
      const input = z.object({
        organizationId: z.string().trim().min(1).max(120),
        roles: z.array(z.enum(nonprofitRoles)).min(1),
        reason: z.string().trim().min(8).max(500),
      }).parse(req.body);
      authorize(actor, "approval:decide", input.organizationId);
      if (!actor.roles.includes("admin")) {
        throw new GovernanceError("ROLE_FORBIDDEN", "Only organization admins may manage memberships");
      }
      const result = await transaction(async (client) => {
        const updated = await client.query(
          `UPDATE users SET organization = $2, roles = $3::varchar[], updated_at = now()
            WHERE id = $1 RETURNING id, organization, roles`,
          [userId, input.organizationId, input.roles],
        );
        if (!updated.rows[0]) throw new GovernanceError("NOT_FOUND", "User not found");
        await audit(client, actor, "membership.updated", "user", userId, input.reason, { roles: input.roles });
        return updated.rows[0];
      });
      res.json(result);
    } catch (error) {
      sendError(res, error);
    }
  });
}
