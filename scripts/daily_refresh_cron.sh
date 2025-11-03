#!/bin/bash

# Daily refresh cron job
# This script calls the daily refresh endpoint via HTTP POST
# For Render: Set RENDER_SERVICE_URL to your service URL
# For local testing: Set API_URL to http://localhost:8000

# Get the API URL from environment variables
# RENDER_SERVICE_URL is set by Render
API_URL="${RENDER_SERVICE_URL:-${API_URL:-http://localhost:8000}}"

# Get the daily refresh secret from environment
DAILY_REFRESH_SECRET="${DAILY_REFRESH_SECRET:-change-me-in-production}"

# Full endpoint URL
TRIGGER_URL="${API_URL}/api/DailyRefresh/trigger"

echo "=================================================="
echo "Triggering daily refresh at: $(date)"
echo "API URL: ${API_URL}"
echo "Endpoint: ${TRIGGER_URL}"
echo "=================================================="

# Make POST request to trigger daily refresh with secret
curl -X POST "${TRIGGER_URL}" \
  -H "Content-Type: application/json" \
  -d "{\"secret\":\"${DAILY_REFRESH_SECRET}\"}" \
  -w "\nHTTP Status: %{http_code}\n" \
  --max-time 300 \
  --retry 3 \
  --retry-delay 5

EXIT_CODE=$?

echo "=================================================="
if [ $EXIT_CODE -eq 0 ]; then
  echo "Daily refresh completed successfully at: $(date)"
else
  echo "Daily refresh failed with exit code: ${EXIT_CODE}"
fi
echo "=================================================="

exit $EXIT_CODE

