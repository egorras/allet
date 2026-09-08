CREATE TABLE source_schedules (source_key TEXT PRIMARY KEY REFERENCES sources(key), enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0, 1)), window_months INTEGER NOT NULL DEFAULT 3 CHECK(window_months BETWEEN 1 AND 12), interval_minutes INTEGER NOT NULL DEFAULT 1440 CHECK(interval_minutes BETWEEN 60 AND 43200));
INSERT INTO source_schedules(source_key) VALUES ('budapest-opera');
CREATE TABLE sync_tasks (source_key TEXT NOT NULL REFERENCES sources(key), month TEXT NOT NULL, origin TEXT NOT NULL CHECK(origin IN ('window', 'request')), due_at TEXT NOT NULL, last_run_at TEXT, last_status TEXT CHECK(last_status IN ('success', 'error', 'deferred')), failures INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (source_key, month));
CREATE INDEX sync_tasks_due ON sync_tasks(due_at);
CREATE TABLE run_log (id INTEGER PRIMARY KEY, run_id TEXT NOT NULL REFERENCES import_runs(id), at TEXT NOT NULL, code TEXT NOT NULL CHECK(code IN ('started', 'fetched', 'parsed', 'stored', 'failed')), detail TEXT NOT NULL DEFAULT '{}');
CREATE INDEX run_log_run ON run_log(run_id, id);
ALTER TABLE import_runs ADD COLUMN trigger TEXT NOT NULL DEFAULT 'manual' CHECK(trigger IN ('manual', 'scheduled'));
