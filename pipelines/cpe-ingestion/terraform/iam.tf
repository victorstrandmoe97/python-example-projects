resource "google_service_account" "cpe_job_invoker" {
  account_id   = "cpe-job-invoker"
  display_name = "CPE Ingestion Job Invoker"
}

resource "google_project_iam_member" "cpe_run_job_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.cpe_job_invoker.email}"
}
