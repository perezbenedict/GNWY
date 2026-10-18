CREATE TABLE IF NOT EXISTS used_nicknames (nickname TEXT PRIMARY KEY, created_at TEXT NOT NULL DEFAULT (datetime('now')));
