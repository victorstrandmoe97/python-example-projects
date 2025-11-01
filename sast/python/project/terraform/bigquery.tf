resource "google_bigquery_dataset" "vuln_registry" {
  dataset_id = "vulnerabilities_registry"
  location   = var.region
}

resource "google_bigquery_table" "osv_ingestion_audit" {
  dataset_id = google_bigquery_dataset.vuln_registry.dataset_id
  table_id   = "osv_ingestion_audit"

  schema = file("${path.module}/schemas/audit_schema.json")
  deletion_protection = false
  lifecycle {
    prevent_destroy = true
  }
}

#⚠️ Note: This defines a static table. 
#this table may not be used directly, or you might need to create it initially just once and then let your script manage it from there.
resource "google_bigquery_table" "vuln_dictionary" {
  dataset_id = google_bigquery_dataset.vuln_registry.dataset_id
  table_id   = "vuln_dictionary"

  schema = file("${path.module}/schemas/vuln_dictionary_schema.json")
  deletion_protection = false
   lifecycle {
    prevent_destroy = true
  }
}