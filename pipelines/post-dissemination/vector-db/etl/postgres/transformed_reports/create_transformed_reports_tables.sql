-- 1) Base tables
CREATE TABLE reports (
  report_id   TEXT PRIMARY KEY,
  week        INT,
  year        INT
);

CREATE TABLE directives (
  directive_id    TEXT PRIMARY KEY,    -- e.g. your cluster_id
  summary         TEXT,
  follow_up_sources TEXT[]
);

CREATE TABLE trends (
  trend_id        TEXT PRIMARY KEY,    -- e.g. your cluster_id
  summary         TEXT,
  follow_up_sources TEXT[]
);

CREATE TABLE report_trends (
  report_id  TEXT REFERENCES reports(report_id)   ON DELETE CASCADE,
  trend_id   TEXT REFERENCES trends(trend_id)     ON DELETE CASCADE,
  PRIMARY KEY (report_id, trend_id)
);

CREATE TABLE report_directives (
  report_id    TEXT REFERENCES reports(report_id)      ON DELETE CASCADE,
  directive_id TEXT REFERENCES directives(directive_id) ON DELETE CASCADE,
  PRIMARY KEY (report_id, directive_id)
);

CREATE TABLE directive_labels (
  directive_id TEXT REFERENCES directives(directive_id) ON DELETE CASCADE,
  label_type   VARCHAR(50),
  label_value  TEXT,
  PRIMARY KEY (directive_id, label_type, label_value)
);

CREATE TABLE trend_labels (
  trend_id   TEXT REFERENCES trends(trend_id) ON DELETE CASCADE,
  label_type VARCHAR(50),
  label_value TEXT,
  PRIMARY KEY (trend_id, label_type, label_value)
);