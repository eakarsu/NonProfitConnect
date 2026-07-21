BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS nonprofit_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id varchar(120) NOT NULL,
  record_type varchar(32) NOT NULL CHECK (record_type IN ('donor','grant','program','beneficiary','outcome')),
  lifecycle_state varchar(40) NOT NULL,
  source varchar(80) NOT NULL,
  external_id varchar(200) NOT NULL,
  deduplication_key char(64) NOT NULL,
  source_occurred_at timestamptz NOT NULL,
  consent_status varchar(32) NOT NULL DEFAULT 'not_applicable',
  consent_expires_at timestamptz,
  retention_until timestamptz NOT NULL,
  data jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by varchar NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (organization_id, deduplication_key)
);

CREATE INDEX IF NOT EXISTS nonprofit_records_org_type_idx
  ON nonprofit_records (organization_id, record_type, lifecycle_state)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS nonprofit_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id varchar(120) NOT NULL,
  record_id uuid NOT NULL REFERENCES nonprofit_records(id),
  requested_by varchar NOT NULL REFERENCES users(id),
  requested_state varchar(40) NOT NULL,
  reason text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  decided_by varchar REFERENCES users(id),
  decision_reason text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS nonprofit_one_pending_approval_idx
  ON nonprofit_approvals (record_id) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS nonprofit_connector_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id varchar(120) NOT NULL,
  connector varchar(80) NOT NULL,
  external_id varchar(200) NOT NULL,
  deduplication_key char(64) NOT NULL,
  source_occurred_at timestamptz NOT NULL,
  expected_cents bigint NOT NULL,
  received_cents bigint NOT NULL,
  difference_cents bigint NOT NULL,
  reconciliation_status varchar(20) NOT NULL CHECK (reconciliation_status IN ('reconciled','exception')),
  payload jsonb NOT NULL,
  received_by varchar NOT NULL REFERENCES users(id),
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, connector, deduplication_key)
);

CREATE TABLE IF NOT EXISTS nonprofit_offline_events (
  event_id uuid PRIMARY KEY,
  organization_id varchar(120) NOT NULL,
  device_id varchar(120) NOT NULL,
  record_id uuid NOT NULL REFERENCES nonprofit_records(id),
  base_version integer NOT NULL,
  applied_version integer,
  captured_at timestamptz NOT NULL,
  changes jsonb NOT NULL,
  status varchar(20) NOT NULL CHECK (status IN ('applied','conflict','duplicate')),
  conflict_reason text,
  received_by varchar NOT NULL REFERENCES users(id),
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nonprofit_audit_events (
  sequence bigserial PRIMARY KEY,
  organization_id varchar(120) NOT NULL,
  actor_id varchar NOT NULL REFERENCES users(id),
  action varchar(100) NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id varchar(200) NOT NULL,
  reason text,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nonprofit_audit_org_sequence_idx
  ON nonprofit_audit_events (organization_id, sequence);

COMMIT;
