import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import { pool } from "./db";
import { registerNonprofitOperationsRoutes } from "./nonprofitOperationsRoutes";

const organizationId = "org-integration-test";
const staffId = "integration-staff";
const approverId = "integration-approver";

async function json(response: Response) {
  const body = await response.json();
  return { response, body };
}

test("HTTP + PostgreSQL grant journey is idempotent, scoped, approved, and audited", async () => {
  await pool.query(
    `INSERT INTO users (id, email, organization, roles)
     VALUES ($1, $2, $3, ARRAY['staff']::varchar[]),
            ($4, $5, $3, ARRAY['finance_approver']::varchar[])
     ON CONFLICT (id) DO UPDATE SET organization = excluded.organization, roles = excluded.roles`,
    [staffId, "integration-staff@example.invalid", organizationId,
      approverId, "integration-approver@example.invalid"],
  );

  const app = express();
  app.use(express.json());
  registerNonprofitOperationsRoutes(
    app,
    ((_req, _res, next) => next()) as any,
    (request) => String(request.headers["x-test-user"] || ""),
  );
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address && typeof address === "object");
  const base = `http://127.0.0.1:${address.port}`;
  const headers = { "content-type": "application/json", "x-test-user": staffId };

  try {
    const recordInput = {
      organizationId,
      type: "grant",
      source: "manual",
      externalId: "grant-acceptance-001",
      occurredAt: "2026-07-19T12:00:00.000Z",
      retentionUntil: "2033-07-19T12:00:00.000Z",
      consentStatus: "not_applicable",
      data: { funder: "Acceptance Foundation", requestedCents: 250_000 },
    };
    const created = await json(await fetch(`${base}/api/nonprofit/records`, {
      method: "POST", headers, body: JSON.stringify(recordInput),
    }));
    assert.equal(created.response.status, 201);
    assert.equal(created.body.duplicate, false);

    const duplicate = await json(await fetch(`${base}/api/nonprofit/records`, {
      method: "POST", headers, body: JSON.stringify(recordInput),
    }));
    assert.equal(duplicate.response.status, 200);
    assert.equal(duplicate.body.duplicate, true);
    assert.equal(duplicate.body.id, created.body.id);

    const forbidden = await json(await fetch(`${base}/api/nonprofit/records`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...recordInput, organizationId: "different-org", externalId: "forbidden" }),
    }));
    assert.equal(forbidden.response.status, 403);
    assert.equal(forbidden.body.code, "ORG_BOUNDARY");

    const requested = await json(await fetch(
      `${base}/api/nonprofit/records/${created.body.id}/transitions`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          toState: "submitted",
          reason: "Grant package is complete and ready for independent review",
          amountCents: 250_000,
        }),
      },
    ));
    assert.equal(requested.response.status, 202);
    assert.equal(requested.body.pendingApproval, true);

    const selfApproval = await json(await fetch(
      `${base}/api/nonprofit/approvals/${requested.body.approval.id}/decision`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ decision: "approved", reason: "Requester cannot approve this grant" }),
      },
    ));
    assert.equal(selfApproval.response.status, 403);

    const approved = await json(await fetch(
      `${base}/api/nonprofit/approvals/${requested.body.approval.id}/decision`,
      {
        method: "POST",
        headers: { ...headers, "x-test-user": approverId },
        body: JSON.stringify({ decision: "approved", reason: "Independent finance review completed successfully" }),
      },
    ));
    assert.equal(approved.response.status, 200);
    assert.equal(approved.body.status, "approved");

    const records = await json(await fetch(
      `${base}/api/nonprofit/records?organizationId=${organizationId}&type=grant`,
      { headers: { "x-test-user": approverId } },
    ));
    assert.equal(records.response.status, 200);
    assert.equal(records.body.data.find((item: any) => item.id === created.body.id)?.state, "submitted");

    const audit = await json(await fetch(
      `${base}/api/nonprofit/audit?organizationId=${organizationId}`,
      { headers: { "x-test-user": approverId } },
    ));
    assert.equal(audit.response.status, 200);
    assert.deepEqual(
      audit.body.data.map((event: any) => event.action),
      ["record.created", "transition.requested", "approval.approved"],
    );
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await pool.query("DELETE FROM nonprofit_audit_events WHERE organization_id = $1", [organizationId]);
    await pool.query("DELETE FROM nonprofit_offline_events WHERE organization_id = $1", [organizationId]);
    await pool.query("DELETE FROM nonprofit_connector_receipts WHERE organization_id = $1", [organizationId]);
    await pool.query("DELETE FROM nonprofit_approvals WHERE organization_id = $1", [organizationId]);
    await pool.query("DELETE FROM nonprofit_records WHERE organization_id = $1", [organizationId]);
    await pool.query("DELETE FROM users WHERE id = ANY($1::varchar[])", [[staffId, approverId]]);
    await pool.end();
  }
});
