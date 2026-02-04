# Supabase Auth Setup Guide

This guide will help you set up authentication for your travel planner app using Supabase Auth.

## Step 1: Run the Auth SQL Migration

1. Go to your Supabase Dashboard → SQL Editor
2. Run the file `supabase/add-auth-support.sql`
3. This will:
   - Create a `profiles` table
   - Add `user_id` column to `trips` table
   - Set up Row Level Security (RLS) policies
   - Create a trigger to auto-create profiles when users sign up

## Step 2: Set Up Environment Variables

### Backend (`server/.env`)
You already have these:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Frontend (`client/.env`)
Create a `.env` file in the `client` folder with:
```
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Use the **anon key** (not the service role key) for the frontend.

## Step 3: Install Frontend Dependencies

The `@supabase/supabase-js` package has been added to `client/package.json`. Run:

```bash
cd client
npm install
```

## Step 4: Enable Email Auth in Supabase

1. Go to your Supabase Dashboard → Authentication → Providers
2. Make sure "Email" is enabled
3. Configure email templates if desired (optional)

## Step 5: Test the Setup

1. Start your servers:
   ```bash
   npm run dev
   ```

2. Open `http://localhost:3000`
3. You should see a sign-in/sign-up screen
4. Create an account or sign in
5. You should now see the travel planner interface

## How It Works

- **Frontend**: Uses Supabase Auth client to handle sign-in/sign-up
- **Backend**: Extracts user ID from the auth token in the `Authorization` header
- **Database**: RLS policies ensure users can only access their own trips
- **Auto Profile Creation**: When a user signs up, a profile is automatically created

## Migrating Existing Data

If you have existing trips without `user_id`, you'll need to:

1. Get your user ID from Supabase Dashboard → Authentication → Users
2. Run this SQL (replace `YOUR_USER_ID` and `YOUR_TRIP_ID`):
   ```sql
   UPDATE trips 
   SET user_id = 'YOUR_USER_ID' 
   WHERE id = 'YOUR_TRIP_ID';
   ```

Or assign all existing trips to a specific user:
```sql
UPDATE trips 
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;
```

## Troubleshooting

### "Authentication required" error
- Make sure you're signed in
- Check that the auth token is being sent in requests
- Verify your Supabase URL and keys are correct

### RLS errors
- Make sure you ran `supabase/add-auth-support.sql`
- Check that RLS policies are enabled
- Verify the user_id is set correctly on trips

### Profile not created
- Check the trigger `on_auth_user_created` exists
- Verify the function `handle_new_user()` is working
- Check Supabase logs for errors
