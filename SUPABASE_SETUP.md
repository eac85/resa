# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Wait for the project to be fully set up

## 2. Run the SQL Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Open the file `supabase/schema.sql` from this project
3. Copy and paste the entire SQL into the SQL Editor
4. Click "Run" to execute the schema

This will create all the necessary tables:
- `trips` - Main trip information
- `days` - Individual days in a trip
- `lodging_info` - Lodging/hotel information
- `activities` - Activities for specific days
- `food_research` - Food research and restaurant info

## 3. Get Your Supabase Credentials

1. In your Supabase dashboard, go to Settings → API
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys" → "anon public")
   - **service_role key** (under "Project API keys" → "service_role" - keep this secret!)

## 4. Set Up Environment Variables

1. In the `server` folder, create a `.env` file:
```bash
cd server
touch .env
```

2. Add your Supabase credentials to the `.env` file:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important:** The `.env` file is already in `.gitignore`, so your keys won't be committed to git.

## 5. Install Dependencies

Run this in the project root:
```bash
npm run install-all
```

This will install:
- `@supabase/supabase-js` - Supabase client library
- `dotenv` - For loading environment variables

## 6. Test the Setup

1. Start your servers:
```bash
npm run dev
```

2. The server should connect to Supabase automatically
3. You can test the API endpoints:
   - `GET http://localhost:5000/api/trips` - Get all trips
   - `GET http://localhost:5000/api/trip` - Get default trip (legacy route)

## API Routes Available

### Trips
- `GET /api/trips` - Get all trips
- `GET /api/trips/:id` - Get single trip
- `POST /api/trips` - Create trip
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip

### Days
- `GET /api/trips/:tripId/days` - Get all days for a trip
- `GET /api/days/:id` - Get single day
- `POST /api/days` - Create/update day
- `PUT /api/days/:id` - Update day plan
- `DELETE /api/days/:id` - Delete day

### Lodging
- `GET /api/trips/:tripId/lodging` - Get lodging for trip
- `POST /api/lodging` - Create lodging info
- `PUT /api/lodging/:id` - Update lodging
- `DELETE /api/lodging/:id` - Delete lodging

### Activities
- `GET /api/days/:dayId/activities` - Get activities for day
- `POST /api/activities` - Create activity
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity

### Food Research
- `GET /api/trips/:tripId/food` - Get food research for trip
- `POST /api/food` - Create food research
- `PUT /api/food/:id` - Update food research
- `DELETE /api/food/:id` - Delete food research

### Complete Trip Data
- `GET /api/trips/:tripId/complete` - Get complete trip with all related data

### Legacy Route (for backward compatibility)
- `GET /api/trip` - Get default trip data (maintains compatibility with existing frontend)
