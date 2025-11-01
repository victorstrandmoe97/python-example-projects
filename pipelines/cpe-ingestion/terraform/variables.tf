variable "project_id" {
    default = "security-awareness-sub"
}
variable "region" {
  default = "europe-west1"
}
variable "schedule" {
  default = "0 5 * * *" # 5AM UTC daily
}

variable "image_url" {
  description = "Docker image URI to deploy to Cloud Run"
  type        = string
}