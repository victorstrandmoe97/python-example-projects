  # Deploy the Cloud Function with the selected environment variables and trigger
gcloud functions deploy "awaken-agent-repeated-notice" \
  --runtime "nodejs20" \
  --allow-unauthenticated \
  --entry-point webhookReceiver \
  --region "europe-west4" \
    --trigger-http


