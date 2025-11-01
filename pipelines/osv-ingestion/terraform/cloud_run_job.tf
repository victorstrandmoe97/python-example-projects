resource "google_cloud_run_v2_job" "osv_ingestor_job" {
  name     = "osv-ingestor-job"
  location = var.region
  project  = var.project_id

  template {
    template {
      containers {
        image = var.image_url

        resources {
          limits = {
            cpu    = "2"
            memory = "2Gi"
          }
        }

        # Optional: pass in env vars
        env {
          name  = "PROJECT_ID"
          value = var.project_id
        }
      }

      max_retries    = 0
      timeout        = "300s" # 30 minutes max
    }
  }
}
