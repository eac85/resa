const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key-here' || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  WARNING: Using ANON key instead of SERVICE_ROLE key. This may cause RLS issues.');
  console.warn('   Get your service_role key from Supabase Dashboard → Settings → API');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
