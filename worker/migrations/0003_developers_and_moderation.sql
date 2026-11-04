-- Pembangun / Developer: Zrain
-- Dicipta / Created: Unknown (rekod asal belum disahkan)
-- Dikemas kini / Last updated: 2026-11-04
-- Fail / File: worker/migrations/0003_developers_and_moderation.sql
-- BM: Fail 0003 developers and moderation dikekalkan mengikut kontrak Zrain Community.
-- EN: Preserve the 0003 developers and moderation file according to Zrain Community contracts.
-- Additive migration. Never alters or removes existing product/community data.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS developer_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  developer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  requested_product_id TEXT NOT NULL,
  requested_product_name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('project','tool')),
  website_origin TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT '',
  verification_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS developer_requests_review_idx ON developer_requests(status,id DESC);
CREATE TABLE IF NOT EXISTS developers (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
  source_request_id INTEGER UNIQUE REFERENCES developer_requests(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS developer_products (
  developer_id TEXT NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  website_origin TEXT NOT NULL,
  PRIMARY KEY (developer_id,product_id)
);
CREATE TABLE IF NOT EXISTS developer_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  developer_id TEXT NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  label TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS developer_keys_account_idx ON developer_keys(developer_id,revoked_at);
CREATE TABLE IF NOT EXISTS moderation_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_type TEXT NOT NULL CHECK(actor_type IN ('admin','developer','visitor')),
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  product_id TEXT NOT NULL,
  comment_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS moderation_audit_idx ON moderation_audit(id DESC);
CREATE TABLE IF NOT EXISTS comment_management (
  comment_id INTEGER PRIMARY KEY REFERENCES comments(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL
);
