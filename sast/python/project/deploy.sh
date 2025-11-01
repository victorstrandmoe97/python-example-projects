#!/bin/bash
set -euo pipefail

######## LOAD ENV   ##############
ENV_FILE="$(dirname "$0")/prod.env"
if [ -f "$ENV_FILE" ]; then
  echo "📄 Loading environment from $ENV_FILE"
  set -o allexport
  source "$ENV_FILE"
  set +o allexport
fi

PROJECT_ID="${PROJECT_ID:-security-awareness-sub}"
REGION="${REGION:-europe-west1}"
IMAGE_URL="${IMAGE_URL:-gcr.io/${PROJECT_ID}/osv-ingestor:latest}"

# 🔍 Validate required variables
missing=""
[ -z "$PROJECT_ID" ] && missing+=" PROJECT_ID"
[ -z "$REGION" ] && missing+=" REGION"
[ -z "$IMAGE_URL" ] && missing+=" IMAGE_URL"

if [ -n "$missing" ]; then
  echo "❌ Missing required environment variables:$missing"
  exit 1
fi


######## CLOUD RUN JOB ##############

# 🔨 Build and push Docker image to GCR

if ! docker buildx inspect default &>/dev/null; then
  echo "🔧 Creating Docker buildx builder..."
  docker buildx create --use
fi
echo "🐳 Building Docker image for linux/amd64..."

docker buildx build \
  --platform=linux/amd64 \
  -t "$IMAGE_URL" \
  -f docker/Dockerfile \
  --push \
  .

######## TERRAFORM  ##############
cd terraform

# 🛠 Initialize Terraform
echo "🔧 Initializing Terraform..."
terraform init

# 🚀 Apply Terraform
echo "🚀 Applying Terraform configuration..."
terraform apply \
  -auto-approve \
  -var="project_id=${PROJECT_ID}" \
  -var="region=${REGION}" \
  -var="image_url=${IMAGE_URL}"

echo "Terraform apply completed successfully."
echo "Deploy job completed ✅ "
