resource "google_service_account" "osv_job_invoker" {
  account_id   = "osv-job-invoker"
  display_name = "OSV Ingestion Job Invoker"
}

resource "google_project_iam_member" "osv_run_job_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.osv_job_invoker.email}"
}
