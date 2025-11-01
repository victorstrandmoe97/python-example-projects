set -e

# 1) Slurp your JSON file into a variable
JSON="$(< ../../transformed_reports.json)"

# 2) Exec into Postgres and run the INSERTs inline
docker exec -i postgres bash -c "\
  set -e; \
  export PGPASSWORD=postgres; \
  psql -v ON_ERROR_STOP=1 -U postgres -d postgres" <<EOF
-- reports
INSERT INTO reports(report_id, week, year)
SELECT
  elem->>'report_id',
  (elem->>'week')::int,
  (elem->>'year')::int
FROM jsonb_array_elements((\$json\$${JSON}\$json\$)::jsonb->'reports') AS elem;

-- directives
INSERT INTO directives(directive_id, summary, follow_up_sources)
SELECT
  elem->>'directive_id',
  elem->>'summary',
  ARRAY(SELECT jsonb_array_elements_text(elem->'follow_up_sources'))
FROM jsonb_array_elements((\$json\$${JSON}\$json\$)::jsonb->'directives') AS elem;

-- trends
INSERT INTO trends(trend_id, summary, follow_up_sources)
SELECT
  elem->>'trend_id',
  elem->>'summary',
  ARRAY(SELECT jsonb_array_elements_text(elem->'follow_up_sources'))
FROM jsonb_array_elements((\$json\$${JSON}\$json\$)::jsonb->'trends') AS elem;

-- directive_labels
INSERT INTO directive_labels(directive_id, label_type, label_value)
SELECT
  arr->>0,
  arr->>1,
  arr->>2
FROM jsonb_array_elements((\$json\$${JSON}\$json\$)::jsonb->'directive_labels') AS arr;

-- trend_labels
INSERT INTO trend_labels(trend_id, label_type, label_value)
SELECT
  arr->>0,
  arr->>1,
  arr->>2
FROM jsonb_array_elements((\$json\$${JSON}\$json\$)::jsonb->'trend_labels') AS arr;

-- report_directives
INSERT INTO report_directives(report_id, directive_id)
SELECT
  arr->>'report_id',
  arr->>'directive_id'
FROM jsonb_array_elements((\$json\$${JSON}\$json\$)::jsonb->'report_directives') AS arr;

-- report_trends
INSERT INTO report_trends(report_id, trend_id)
SELECT
  arr->>'report_id',
  arr->>'trend_id'
FROM jsonb_array_elements((\$json\$${JSON}\$json\$)::jsonb->'report_trends') AS arr;

EOF

echo "✅ JSON data loaded into Postgres via Docker exec."
