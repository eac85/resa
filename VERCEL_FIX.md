# Fixing 404 Errors on Vercel

If you're getting 404 errors for API routes on Vercel, try these steps:

## Option 1: Check Vercel Function Logs

1. Go to your Vercel dashboard
2. Click on your deployment
3. Go to "Functions" tab
4. Check the logs for `/api/index.js`
5. Look for any errors

## Option 2: Verify Environment Variables

Make sure these are set in Vercel:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`

## Option 3: Test the API Function Directly

Try accessing: `https://your-app.vercel.app/api/test`

This should return a JSON response if the function is working.

## Option 4: Alternative Configuration

If the current setup doesn't work, you might need to:

1. Remove the rewrite for `/api/*` and let Vercel handle it automatically
2. Or adjust the Express routes to not include `/api` prefix and handle it in the wrapper

Let me know what errors you see in the Vercel function logs!
