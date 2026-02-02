# Deploying to Vercel

This guide will help you deploy your travel planner app to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your Supabase credentials ready

## Step 1: Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

## Step 2: Set Up Environment Variables

You'll need to add your Supabase credentials as environment variables in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add these variables:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

## Step 3: Deploy

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository (GitHub, GitLab, or Bitbucket)
3. Vercel will auto-detect the settings
4. Make sure the **Root Directory** is set to the project root
5. Add environment variables (from Step 2)
6. Click "Deploy"

### Option B: Deploy via CLI

```bash
# From the project root
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Confirm project settings
# - Add environment variables when prompted
```

## Step 4: Configure Build Settings

In your Vercel project settings:

1. Go to Settings → General
2. Under "Build & Development Settings":
   - **Framework Preset**: Other
   - **Root Directory**: (leave empty, or set to project root)
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/build`
   - **Install Command**: `npm install && cd server && npm install && cd ../client && npm install`

Actually, with the `vercel.json` file, Vercel should auto-detect everything!

## Step 5: Update CORS (if needed)

The server already has CORS enabled, but you might need to update it for your Vercel domain:

In `server/index.js`, the CORS is already set to allow all origins, which should work for Vercel.

## Step 6: Test Your Deployment

After deployment:
1. Visit your Vercel URL
2. Test creating a trip
3. Verify all API endpoints work

## Troubleshooting

### API Routes Not Working

If `/api/*` routes aren't working:
- Check that `vercel.json` is in the root directory
- Verify the server is being built correctly
- Check Vercel function logs in the dashboard

### Environment Variables Not Loading

- Make sure variables are set in Vercel dashboard
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### Build Fails

- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version (Vercel uses Node 18.x by default)

## Alternative: Deploy Frontend and Backend Separately

If you prefer, you can:
1. Deploy the React frontend to Vercel
2. Deploy the Express backend to a service like Railway, Render, or Fly.io
3. Update the `REACT_APP_API_URL` environment variable to point to your backend URL

## Notes

- The `vercel.json` configuration routes `/api/*` to your Express server
- All other routes serve the React app
- Environment variables are automatically available to both frontend and backend
- The app will work in production mode automatically
