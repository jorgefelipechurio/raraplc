-- physical-ai-radar: esquema inicial (30-oct-2026)

CREATE TABLE IF NOT EXISTS findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  family TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  published_at TEXT,
  excerpt_for_llm TEXT,
  status TEXT NOT NULL DEFAULT 'pending',      -- pending | classified | irrelevant | failed
  attempts INTEGER NOT NULL DEFAULT 0,
  relevance INTEGER,
  layer TEXT,
  vertical TEXT,
  signal TEXT,
  niche TEXT,
  amount_usd INTEGER,
  entities TEXT,                               -- JSON array
  open_source INTEGER,
  region TEXT,
  pain TEXT,
  summary TEXT,
  language TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  classified_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_findings_status ON findings (status, id);
CREATE INDEX IF NOT EXISTS idx_findings_niche ON findings (niche, created_at);
CREATE INDEX IF NOT EXISTS idx_findings_created ON findings (created_at);

CREATE TABLE IF NOT EXISTS niches (
  label TEXT PRIMARY KEY,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cursors (
  source_key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usage_daily (
  day TEXT PRIMARY KEY,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  usd REAL NOT NULL DEFAULT 0,
  calls INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT,
  new_items INTEGER,
  classified INTEGER,
  stopped_by TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS digests (
  week TEXT PRIMARY KEY,                       -- 2026-W45
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  text TEXT NOT NULL,
  model TEXT,
  synthesis TEXT,                              -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at TEXT,
  notes TEXT
);
