# Governed nonprofit operations runbook

The governed operations API is a deterministic companion to the existing funding UI. It does not use an LLM to authorize users, change lifecycle state, reconcile money, decide approvals, or process privacy retention.

## Safe setup

1. Copy `.env.example` to an untracked `.env`, set a random `SESSION_SECRET` of at least 32 characters, and provision a dedicated PostgreSQL database.
2. Run `npm ci`.
3. Apply `npm run db:migrate:governed` against that dedicated database. The migration is additive and repeatable.
4. Run `npm test`, `npm run check`, and `npm run build`.
5. Start with `./start.sh`. It never kills other processes, installs packages, migrates, or seeds unless the corresponding opt-in variable is set.

`APPLY_MIGRATIONS=1 ./start.sh` applies the governed migration before development startup. `SEED_DEMO_DATA=1 ./start.sh` is allowed only outside production and must never point at shared or production data.

## Roles and boundaries

All `/api/nonprofit/*` operations require a persisted user organization. An existing organization `admin` provisions `staff`, `volunteer`, `partner`, `field_team`, `finance_approver`, and `privacy_officer` memberships through `PUT /api/nonprofit/members/:userId`. Public registration cannot choose privileged roles.

- Volunteers and partners are read-only.
- Field teams can capture and sync records but cannot approve lifecycle changes.
- Staff can create and request transitions.
- Finance approvers decide approval-gated transitions and reconcile connector receipts.
- Privacy officers run retention previews/confirmed redaction and export audit evidence.
- Organization identifiers are enforced on every governed route; cross-organization access fails closed.

## Operational journeys

- `POST /api/nonprofit/records` persists donor, grant, program, beneficiary, or outcome records with source timestamps, consent state, retention deadlines, organization scope, and normalized idempotency keys.
- `POST /api/nonprofit/records/:id/transitions` validates deterministic lifecycle transitions. Grant, program, verified-outcome, and material-value transitions create pending approvals.
- `POST /api/nonprofit/approvals/:id/decision` requires an independent approver. A requester cannot approve their own request.
- `POST /api/nonprofit/integrations/:connector/events` records source timestamps and payloads, deduplicates connector events, and reconciles exact integer-cent amounts. Exceptions remain visible and are not silently rounded.
- `POST /api/nonprofit/offline/batches` applies idempotent device events only when their base version matches. Conflicts are stored for human resolution.
- `POST /api/nonprofit/privacy/retention` defaults to preview. Confirmed runs irreversibly redact records whose consent was withdrawn or retention deadline passed, with a justification in the append-only audit log.
- `GET /api/nonprofit/audit` exports an organization-scoped, sequence-ordered evidence stream.

## Provider and launch gates

Before a real fundraising, accounting, or communications connector is enabled, document its OAuth scopes, webhook signature algorithm, replay window, pagination/cursor behavior, rate limits, deletion semantics, source-of-truth rules, and reconciliation owner. Use staging credentials and replay duplicate, delayed, out-of-order, partial, and provider-outage cases.

Production launch still requires secret-history review and rotation, backup/restore evidence, migration rehearsal, monitoring/alerts, privacy counsel approval of retention periods, security testing, accessibility testing, and nonprofit finance/program-owner acceptance. This repository cannot supply licensed provider access or professional validation by itself.
