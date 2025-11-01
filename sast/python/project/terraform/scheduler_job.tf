##TEMP DISABLED
# resource "google_cloud_scheduler_job" "trigger_ingestion_job" {
#   name        = "trigger-cpe-ingestion-job"
#   description = "Trigger the CPE ingestion Cloud Run Job"
#   schedule    = var.schedule
#   time_zone   = "UTC"

#   http_target {
#     http_method = "POST"
#     uri = "https://${var.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_id}/jobs/${google_cloud_run_v2_job.cpe_ingestor_job.name}:run"

#     oidc_token {
#       service_account_email = google_service_account.cpe_job_invoker.email
#     }
#   }
# }
