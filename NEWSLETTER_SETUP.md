# Newsletter System Setup Guide

## Environment Variables

Create a `.env.local` file in your project root with these variables:

### Required Variables

```bash
# OpenAI API Key (for generating newsletter content)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Resend API Configuration (for sending emails)
RESEND_API_KEY=re_your_resend_api_key_here

# Test Email (for testing - change this to your email)
TEST_EMAIL=your-email@example.com

# Newsletter Configuration
NEWSLETTER_FROM_EMAIL=shows@sashabayan.com

# Cron Job Authentication
CRON_SECRET=your-secret-here

# Website Base URL
BASE_URL=https://your-domain.com
```

### Optional Variables (Redis/Upstash)

```bash
# Upstash Redis Configuration (optional - will fallback to filesystem)
KV_URL=your_kv_url_here
KV_REST_API_URL=your_kv_rest_api_url_here
KV_REST_API_TOKEN=your_kv_rest_api_token_here
KV_REST_API_READ_ONLY_TOKEN=your_kv_rest_api_read_only_token_here
REDIS_URL=your_redis_url_here
```

## Setup Steps

### 1. OpenAI Setup

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Add it to `OPENAI_API_KEY`

### 2. Resend Setup

1. Go to [resend.com](https://resend.com) and create an account
2. Get your API key from the dashboard
3. Add your API key to `RESEND_API_KEY`
4. Set `TEST_EMAIL` to your email address for testing
5. For production, you'll need to set up an audience and add `RESEND_AUDIENCE_ID`

### 3. Upstash Redis (Optional)

1. Go to [upstash.com](https://upstash.com)
2. Create a Redis database
3. Copy the connection details to your `.env.local`
4. If not set, the system will fallback to filesystem storage

## Testing Commands

### Test Newsletter Generation (No Email)

```bash
pnpm run newsletter:test
```

### Test Email Sending (Send to Yourself)

```bash
pnpm run newsletter:test-email
```

### Test Email with Real Show Data

```bash
pnpm run newsletter:test-real
```

This will:

- Use your actual shows from `app/shows/data.ts`
- Generate specific, contextual intros based on show content
- Create relevant themes based on show types (wellness, private events, etc.)
- Show venue links when available (Curio, Alchemy Springs, Zenses, The Center SF, Tree Temple, Flux Vertical Theatre, Wyldflowr Arts, York Street Collective, Kinfolx, The Laundry)
- Display full address information in the "Coming Up" section
- Cover current week + next week (more intuitive timing)

### Test Full Newsletter Generation

```bash
pnpm run newsletter:generate --test
```

### Test API Endpoint

```bash
# Start dev server first
pnpm run dev

# Then test the API
curl -X GET "http://localhost:3000/api/newsletter/cron?test=true" \
  -H "Authorization: Bearer your_cron_secret_here"
```

## Troubleshooting

### Missing Environment Variables

The test scripts will tell you exactly which variables are missing.

### Resend API Errors

- Check your API key and audience ID
- Verify your audience contains at least one email address
- Make sure your domain is verified in Resend

### OpenAI Errors

- Verify your API key is correct
- Check your OpenAI billing/credits
- Ensure you have access to GPT-4o

### Redis Errors

- If Redis fails, the system will automatically fallback to filesystem
- Check your Upstash Redis credentials
- Verify your Redis database is active

## File Structure

The newsletter system will create these directories if Redis is not available:

- `data/newsletters/` - Newsletter JSON files
- `data/` - Tracking and counter data

## Production Deployment

For production on Vercel:

1. Add all environment variables to your Vercel project settings
2. The cron job will run automatically based on your `vercel.json` configuration
3. Redis is recommended for production to avoid filesystem limitations
