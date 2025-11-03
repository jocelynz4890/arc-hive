# Deployment Guide

## Render Deployment Setup

### Prerequisites

- Deploy the main web service to Render
- Set up environment variables in Render:
  - `MONGODB_URL`: Your MongoDB connection string
  - `DB_NAME`: Your database name
  - Other required environment variables as needed

### Daily Refresh Cron Job

To set up the daily refresh cron job on Render:

1. **Create a new Cron Job** in your Render dashboard
2. **Configure the cron job:**

   - **Command:** `bash scripts/daily_refresh_cron.sh`
   - **Schedule:** `0 0 * * *` (runs daily at midnight UTC)
   - **Environment:** Same as your web service
   - **Region:** Same as your web service

3. **Set environment variables:**

   - `RENDER_SERVICE_URL`: Your web service URL (optional, will use default if not set)
     - Example: `https://your-app-name.onrender.com`
   - `DAILY_REFRESH_SECRET`: Secret key for authenticating cron job requests
     - Example: `your-secure-random-secret-key-here`
     - Must be set in BOTH the web service AND the cron job

4. **Verify the cron job:**
   - The cron job will make a POST request to `/api/DailyRefresh/trigger`
   - Check the logs to ensure it runs successfully

## Quick Reference

- **Cron Script:** `scripts/daily_refresh_cron.sh`
- **Endpoint:** `POST /api/DailyRefresh/trigger`
- **Schedule:** `0 0 * * *` (midnight UTC)

### Manual Testing

You can manually trigger the daily refresh for testing:

```bash
# Production
curl -X POST https://your-app-name.onrender.com/api/DailyRefresh/trigger \
  -H "Content-Type: application/json" \
  -d '{"secret":"your-daily-refresh-secret"}'

# Local testing
DAILY_REFRESH_SECRET="change-me-in-production" curl -X POST http://localhost:8000/api/DailyRefresh/trigger \
  -H "Content-Type: application/json" \
  -d '{"secret":"change-me-in-production"}'
```

### Environment Variables

All environment variables from your `.env` file should be set in Render's environment configuration for both the web service and cron job.

### Timezone Notes

- The cron job uses UTC timezone (`0 0 * * *` = midnight UTC)
- Adjust the schedule if you need a different timezone:
  - `0 5 * * *` for 5 AM UTC
  - `0 0 * * *` for midnight UTC (default)
