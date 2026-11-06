-- Fail / File: worker/migrations/0005_add_current_community_ids.sql
-- Pembangun / Developer: Zrain
-- Dicipta / Created: 2026-11-06
-- Dikemas kini / Last updated: 2026-11-06
-- BM: Tambah ruang komen untuk lima keluarga Tools dan empat tools baharu. Jangan padam ID lama.
-- EN: Register five tool families and four new tools. Preserve historical IDs and comments.
INSERT OR IGNORE INTO products (id, name, kind) VALUES ('zrain-image-tools', 'Zrain Image Tools', 'project');
INSERT OR IGNORE INTO products (id, name, kind) VALUES ('zrain-pdf-tools', 'Zrain PDF Tools', 'project');
INSERT OR IGNORE INTO products (id, name, kind) VALUES ('zrain-document-tools', 'Zrain Document Tools', 'project');
INSERT OR IGNORE INTO products (id, name, kind) VALUES ('zrain-developer-tools', 'Zrain Developer Tools', 'project');
INSERT OR IGNORE INTO products (id, name, kind) VALUES ('zrain-productivity-tools', 'Zrain Productivity Tools', 'project');
INSERT OR IGNORE INTO products (id, name, kind) VALUES ('text-counter', 'Text Counter', 'tool');
INSERT OR IGNORE INTO products (id, name, kind) VALUES ('image-to-ascii-art', 'Image to ASCII Art', 'tool');
INSERT OR IGNORE INTO products (id, name, kind) VALUES ('image-to-binary-art', 'Image to Binary Art', 'tool');
INSERT OR IGNORE INTO products (id, name, kind) VALUES ('image-to-block-art', 'Image to Block Art', 'tool');
