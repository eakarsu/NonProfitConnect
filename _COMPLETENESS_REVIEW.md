# Completeness Review: NonProfitConnect

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source and configuration only; no dependency installation, build, database migration, external-service call, or runtime launch was performed. The scan considered 178 project files (128 source files), 1 manifest(s), 0 test-like file(s), and 0 CI workflow(s), excluding dependency/generated directories.

## Classification

**Functional but incomplete**

This is a substantive but unfinished nonprofit operations application, not just an empty scaffold. Inspection found 128 source files across `client/`, `attached_assets/`, `server/`, `shared/` using Next.js, React, Express; however, the checked-in workflow and delivery controls do not yet demonstrate a complete, production-operable product.

## Why it is not complete

- Generated gap/visualization routes describe missing capabilities or simulate recommendations; they do not implement the underlying domain operation.
- Generic LLM calls are used as product behavior without enough typed tools, grounded evidence, deterministic rules, or output evaluation.
- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No recognizable project-owned automated tests were found for the main workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Implement enforceable organization/role permissions for staff, volunteers, partners, and field teams.
2. Add donor, grant, program, beneficiary, outcome, and consent records with auditable lifecycle transitions.
3. Integrate fundraising/accounting and communications systems with deduplication and reconciliation.
4. Add privacy retention controls, offline field capture, approval workflows, and nonprofit-specific acceptance tests.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Credential/configuration exposure: environment files are present in the repository tree and must be checked against Git history and rotated if real.
- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.
- AI-provider availability, cost, privacy, prompt injection, and unvalidated output are launch risks until bounded and evaluated.

## Evidence inspected

- `README.md`
- `server/index.ts:7`
- `client/src/components/ApplicationModal.tsx:126`
- `server/db.ts`
- `package.json`
- `start.sh`

## Recommended next action

Choose one real nonprofit operations journey, define acceptance criteria and external contracts, then close its persistence, permission, integration, failure, and test gaps before expanding features.

## Implementation progress (2026-07-19)

The implemented slice is an organization-scoped grant/program/beneficiary operations journey. It is deliberately deterministic: LLM output cannot grant permissions, activate beneficiaries, change lifecycle state, approve material actions, reconcile money, resolve offline conflicts, or apply retention.

1. **Organization and role permissions implemented.** `server/nonprofitGovernance.ts` defines fail-closed capabilities for staff, volunteers, partners, field teams, finance approvers, privacy officers, and administrators, and rejects cross-organization access. `server/nonprofitOperationsRoutes.ts` resolves membership from the persisted user rather than trusting request bodies. `PUT /api/nonprofit/members/:userId` is organization-admin-only and audit logged. Public registration in `server/multiAuth.ts` no longer accepts caller-selected privileged roles.
2. **Auditable nonprofit records and lifecycles implemented.** `migrations/001_governed_nonprofit_operations.sql` adds organization-scoped donor, grant, program, beneficiary, and outcome records with source timestamps, exact lifecycle state, consent, retention, versioning, creator identity, approvals, connector receipts, offline events, and append-only audit evidence. `POST /api/nonprofit/records` is idempotent, and transition routes enforce per-record state machines. Beneficiaries cannot become active without current affirmative consent. Grant/program/verified-outcome and material-value transitions require a separate approver.
3. **Connector deduplication and reconciliation implemented at the application boundary.** `POST /api/nonprofit/integrations/:connector/events` persists the source occurrence time and original payload, normalizes a stable SHA-256 organization/connector/external-ID key, prevents duplicate receipts, creates the corresponding governed donor/grant record, and reconciles exact integer-cent amounts into either `reconciled` or visible `exception` state. A real fundraising, accounting, or communications provider still requires its licensed credentials, signed-webhook contract, staging replay, and reconciliation-owner acceptance.
4. **Privacy, offline field capture, and approvals implemented.** Offline batches use globally unique event IDs and optimistic base versions; duplicates are idempotent and stale changes are persisted as conflicts instead of silently overwriting newer data. Retention runs default to preview and require a privacy officer/admin plus a justification before irreversible redaction. Consent withdrawal and expired retention are enforced in the database workflow. Approval decisions enforce separation of duties and are emitted into the sequence-ordered organization audit export. Safe startup no longer kills unrelated processes, installs dependencies, migrates, or seeds implicitly; migration and demo seed are explicit opt-ins documented in `RUNBOOK_NONPROFIT_OPERATIONS.md`.
5. **Risk-based verification and CI added.** `server/nonprofitGovernance.test.ts` covers organization isolation, least privilege, consent/expiry, invalid transitions, material approvals, separation of duties, normalized deduplication, integer-cent reconciliation, offline conflicts, and a deterministic program journey. `server/nonprofitDatabase.integration.test.ts` drives a live HTTP + PostgreSQL grant creation, duplicate replay, cross-organization denial, pending transition, independent approval, persisted state, and ordered audit export. `.github/workflows/governed-nonprofit-operations.yml` provisions PostgreSQL, applies the base schema and additive migration, runs unit and database acceptance tests, type-checks, builds, and rejects high-severity production dependency advisories.

### Validation performed

- `npm test`: 8/8 deterministic governance/acceptance tests passed.
- `npm run test:db`: 1/1 live HTTP + isolated PostgreSQL workflow test passed.
- `npm run check`: TypeScript passed after repairing the existing untyped query/gap-page boundary and legacy strictness failures.
- `npm run build`: Vite client and bundled Express server production build passed.
- The governed migration applied successfully to a disposable PostgreSQL 15 cluster after the base Drizzle schema and then applied a second time successfully, proving repeatability; five governed tables were present.
- `npm audit --omit=dev`: zero production dependency vulnerabilities after compatible security upgrades, including the Drizzle, Express, rate-limit, WebSocket, and PDF chains.
- `bash -n start.sh`: safe launcher syntax passed.

### External blockers that source changes cannot close

Production remains blocked on Git-history secret review and rotation; real provider OAuth/webhook credentials and staging contract tests; backup/restore and migration rehearsal; monitoring and incident-response evidence; privacy-counsel approval of retention/consent policy; security and accessibility assessment; and nonprofit finance, program-owner, and field-team acceptance. The four remaining moderate development-tool audit findings are transitive through `drizzle-kit`'s deprecated loader chain and are not present in `npm audit --omit=dev`; deployment should keep development dependencies out of the production image and revisit the toolchain when its upstream fix is compatible.
