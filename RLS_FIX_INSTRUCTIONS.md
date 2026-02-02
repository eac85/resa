# Fixing 403 Permission Errors

If you're getting a 403 error when creating trips, it's because of Row Level Security (RLS) policies in Supabase.

## Quick Fix (Recommended)

### Option 1: Use Service Role Key (Best for Backend)

1. Go to your Supabase Dashboard → Settings → API
2. Copy your **service_role** key (keep this secret!)
3. Update `server/.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=paste-your-service-role-key-here
   ```
4. Restart your server

The service role key bypasses RLS, so it's perfect for backend operations.

### Option 2: Fix RLS Policies

If you want to use the anon key, you need to fix the RLS policies:

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `supabase/fix-rls.sql`
3. Click "Run"
4. This will recreate the policies with proper syntax

## Verify Your Setup

After applying either fix, try creating a trip again. The 403 error should be resolved.

## Security Note

- **Service Role Key**: Use this for backend/server operations (bypasses RLS)
- **Anon Key**: Use this for frontend/client operations (respects RLS)

For this travel planner, using the service role key on the backend is the recommended approach.
