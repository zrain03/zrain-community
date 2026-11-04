-- Pembangun / Developer: Zrain
-- Dicipta / Created: Unknown (rekod asal belum disahkan)
-- Dikemas kini / Last updated: 2026-11-04
-- Fail / File: worker/migrations/0004_add_zrain_ecosystem.sql
-- BM: Fail 0004 add zrain ecosystem dikekalkan mengikut kontrak Zrain Community.
-- EN: Preserve the 0004 add zrain ecosystem file according to Zrain Community contracts.
-- Add the Zrain Ecosystem homepage itself as a public community space.
INSERT OR IGNORE INTO products (id, name, kind) VALUES ('zrain-ecosystem', 'Zrain Ecosystem', 'project');
