-- Pembangun / Developer: Zrain
-- Dicipta / Created: Unknown (rekod asal belum disahkan)
-- Dikemas kini / Last updated: 2026-11-04
-- Fail / File: worker/migrations/0001_init.sql
-- BM: Fail 0001 init dikekalkan mengikut kontrak Zrain Community.
-- EN: Preserve the 0001 init file according to Zrain Community contracts.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'project',
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL REFERENCES products(id),
  parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('discussion','suggestion','bug_report','appreciation')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','hidden','rejected')),
  roadmap_status TEXT CHECK (roadmap_status IN ('under_review','planned','implemented') OR roadmap_status IS NULL),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS comments_public_idx ON comments (product_id,status,parent_id,id DESC);
CREATE INDEX IF NOT EXISTS comments_pending_idx ON comments (status,id DESC);
CREATE INDEX IF NOT EXISTS comments_parent_idx ON comments (parent_id,status,id ASC);
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL REFERENCES products(id),
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam','abusive','off_topic','other')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS reports_admin_idx ON reports(status,id DESC);
CREATE TABLE IF NOT EXISTS quota_counters (
  scope TEXT NOT NULL,
  quota_key TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(scope,quota_key,day)
);
