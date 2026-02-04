require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./config/supabase');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Middleware to extract user from auth token
const getUserFromToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      // Create a Supabase client with the user's token
      const userSupabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      const { data: { user }, error } = await userSupabase.auth.getUser(token);
      if (user && !error) {
        req.user = user;
        req.userId = user.id;
      }
    } catch (error) {
      console.error('Error verifying token:', error);
    }
  }
  next();
};

app.use(getUserFromToken);

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}${req.userId ? ` [User: ${req.userId}]` : ' [No Auth]'}`);
  next();
});

// ==================== TRIPS ROUTES ====================

// Test endpoint to verify Supabase connection
app.get('/api/test', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase test error:', error);
      return res.status(500).json({ 
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }
    res.json({ 
      success: true, 
      message: 'Supabase connection working',
      usingServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all trips (for authenticated user)
app.get('/api/trips', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get trips where user is a member (via trip_users)
    const { data: tripUsers, error: tripUsersError } = await supabase
      .from('trip_users')
      .select('trip_id')
      .eq('user_id', req.userId);
     

    if (tripUsersError) throw tripUsersError;

    const tripIds = tripUsers.map(tu => tu.trip_id);
    
    if (tripIds.length === 0) {
      return res.json([]);
    }

    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .in('id', tripIds)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Supabase error fetching trips:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single trip by ID
app.get('/api/trips/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new trip
app.post('/api/trips', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, start_date, end_date } = req.body;
    const { data, error } = await supabase
      .from('trips')
      .insert([{ name, start_date, end_date, created_by: req.userId, updated_by: req.userId }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating trip:', error);
      throw error;
    }
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update trip
app.put('/api/trips/:id', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const { name, start_date, end_date } = req.body;
    const { data, error } = await supabase
      .from('trips')
      .update({ name, start_date, end_date, updated_by: req.userId })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Trip not found or access denied' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete trip
app.delete('/api/trips/:id', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    // Check if user is owner of the trip
    const { data: tripUser } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', id)
      .eq('user_id', req.userId)
      .single();

    if (!tripUser || tripUser.role !== 'owner') {
      return res.status(403).json({ error: 'Only trip owners can delete trips' });
    }

    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== DAYS ROUTES ====================

// Get all days for a trip
app.get('/api/trips/:tripId/days', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { data, error } = await supabase
      .from('days')
      .select('*')
      .eq('trip_id', tripId)
      .order('date', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching days:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single day
app.get('/api/days/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('days')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching day:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create or update day
app.post('/api/days', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { trip_id, date, plan } = req.body;
    const { data, error } = await supabase
      .from('days')
      .upsert({ trip_id, date, plan, created_by: req.userId, updated_by: req.userId }, { onConflict: 'trip_id,date' })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating/updating day:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update day plan
app.put('/api/days/:id', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { id } = req.params;
    const { plan } = req.body;
    const { data, error } = await supabase
      .from('days')
      .update({ plan, updated_by: req.userId })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating day:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete day
app.delete('/api/days/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('days')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Day deleted successfully' });
  } catch (error) {
    console.error('Error deleting day:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== LODGING ROUTES ====================

// Get lodging info for a trip
app.get('/api/trips/:tripId/lodging', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { data, error } = await supabase
      .from('lodging_info')
      .select('*')
      .eq('trip_id', tripId)
      .order('check_in', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching lodging:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create lodging info
app.post('/api/lodging', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { trip_id, name, address, check_in, check_out, notes } = req.body;
    const { data, error } = await supabase
      .from('lodging_info')
      .insert([{ trip_id, name, address, check_in, check_out, notes, created_by: req.userId, updated_by: req.userId }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating lodging:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update lodging info
app.put('/api/lodging/:id', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { id } = req.params;
    const { name, address, check_in, check_out, notes } = req.body;
    const { data, error } = await supabase
      .from('lodging_info')
      .update({ name, address, check_in, check_out, notes, updated_by: req.userId })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating lodging:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete lodging info
app.delete('/api/lodging/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('lodging_info')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Lodging info deleted successfully' });
  } catch (error) {
    console.error('Error deleting lodging:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ACTIVITIES ROUTES ====================

// Get activities for a trip
app.get('/api/trips/:tripId/activities', async (req, res) => {
  try {
    const { tripId } = req.params;
    
    // Try trip_id first (if migration has been run), fallback to day_id join
    let data, error;
    
    // Check if activities table has trip_id column
    const { data: testData, error: testError } = await supabase
      .from('activities')
      .select('trip_id')
      .limit(1);
    
    if (!testError && testData !== null) {
      // trip_id column exists
      const result = await supabase
        .from('activities')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      data = result.data;
      error = result.error;
    } else {
      // Fallback: join through days table
      const result = await supabase
        .from('activities')
        .select(`
          *,
          days!inner(trip_id)
        `)
        .eq('days.trip_id', tripId)
        .order('created_at', { ascending: false });
      data = result.data;
      error = result.error;
    }

    if (error) {
      // If it's a column doesn't exist error, return empty array
      if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
        return res.json([]);
      }
      throw error;
    }
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create activity
app.post('/api/activities', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { trip_id, name, location, notes, icon, link } = req.body;
    const { data, error } = await supabase
      .from('activities')
      .insert([{ trip_id, name, location, notes, icon: icon || 'fa-hiking', link, created_by: req.userId, updated_by: req.userId }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update activity
app.put('/api/activities/:id', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { id } = req.params;
    const { name, location, notes, icon, link } = req.body;
    const { data, error } = await supabase
      .from('activities')
      .update({ name, location, notes, icon: icon || 'fa-hiking', link, updated_by: req.userId })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete activity
app.delete('/api/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== FOOD RESEARCH ROUTES ====================

// Get food research for a trip
app.get('/api/trips/:tripId/food', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { data, error } = await supabase
      .from('food_research')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching food research:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create food research
app.post('/api/food', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { trip_id, name, location, cuisine, link, notes } = req.body;
    const { data, error } = await supabase
      .from('food_research')
      .insert([{ trip_id, name, location, cuisine, link, notes, created_by: req.userId, updated_by: req.userId }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating food research:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update food research
app.put('/api/food/:id', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { id } = req.params;
    const { name, location, cuisine, link, notes } = req.body;
    const { data, error } = await supabase
      .from('food_research')
      .update({ name, location, cuisine, link, notes, updated_by: req.userId })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating food research:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete food research
app.delete('/api/food/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('food_research')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Food research deleted successfully' });
  } catch (error) {
    console.error('Error deleting food research:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== DECISIONS ROUTES ====================

// Get decisions for a trip
app.get('/api/trips/:tripId/decisions', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { data, error } = await supabase
      .from('decisions')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching decisions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create decision
app.post('/api/decisions', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { trip_id, title, description, status, decision } = req.body;
    const { data, error } = await supabase
      .from('decisions')
      .insert([{ trip_id, title, description, status, decision, created_by: req.userId, updated_by: req.userId }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating decision:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update decision
app.put('/api/decisions/:id', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { id } = req.params;
    const { title, description, status, decision } = req.body;
    const { data, error } = await supabase
      .from('decisions')
      .update({ title, description, status, decision, updated_by: req.userId })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating decision:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete decision
app.delete('/api/decisions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('decisions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Decision deleted successfully' });
  } catch (error) {
    console.error('Error deleting decision:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== TRIP SHARING ROUTES ====================

// Get all users (for dropdown/selection)
app.get('/api/users', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get all user profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .order('full_name', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search users by email or name
app.get('/api/users/search', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { q } = req.query; // search query
    if (!q || q.length < 2) {
      return res.json([]); // Return empty if query too short
    }

    // Search in profiles by email or full_name
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(20)
      .order('full_name', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get trip members
app.get('/api/trips/:tripId/members', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { tripId } = req.params;
    
    // Check if trip_users table exists, if not return empty array (collaboration not set up yet)
    try {
      // First, try to check if table exists by doing a simple query
      const { data: tableTest, error: tableTestError } = await supabase
        .from('trip_users')
        .select('id')
        .limit(1);
      
      // If table doesn't exist, return empty array
      if (tableTestError && (tableTestError.code === '42P01' || tableTestError.message?.includes('does not exist'))) {
        return res.json([]);
      }
      
      // Verify user is a member of the trip (use maybeSingle to avoid error if no rows)
      const { data: memberCheck, error: memberError } = await supabase
        .from('trip_users')
        .select('*')
        .eq('trip_id', tripId)
        .eq('user_id', req.userId)
        .maybeSingle();

      // If user not in trip_users, check if they created the trip
      if (memberError && memberError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" which is fine, we'll check trip creator
        // Other errors are real problems
        console.error('Error checking membership:', memberError);
        throw memberError;
      }
      
      // If memberCheck is null (user not found), check if they created the trip
      if (!memberCheck) {
        const { data: trip, error: tripError } = await supabase
          .from('trips')
          .select('created_by, user_id')
          .eq('id', tripId)
          .maybeSingle();
        
        if (tripError) {
          console.error('Error fetching trip:', tripError);
          return res.status(500).json({ error: 'Error checking trip ownership', details: tripError.message });
        }
        
        if (!trip) {
          return res.status(404).json({ error: 'Trip not found' });
        }
        
        // Check both created_by and user_id (for backward compatibility)
        if (trip.created_by === req.userId || trip.user_id === req.userId) {
          // User created the trip, return them as owner
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .eq('id', req.userId)
            .maybeSingle();
          
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError);
          }
          
          return res.json([{
            id: 'temp-' + req.userId,
            trip_id: tripId,
            user_id: req.userId,
            role: 'owner',
            profiles: profile || { id: req.userId, email: null, full_name: null }
          }]);
        }
        
        // User is not a member and didn't create the trip
        return res.status(403).json({ error: 'Access denied - you are not a member of this trip' });
      }

      // Get all members
      const { data: members, error: membersError } = await supabase
        .from('trip_users')
        .select('*')
        .eq('trip_id', tripId);

      if (membersError) throw membersError;
      
      // Fetch profiles for each member separately
      const membersWithProfiles = await Promise.all(
        (members || []).map(async (member) => {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .eq('id', member.user_id)
            .maybeSingle();
          
          return {
            ...member,
            profiles: profile || { id: member.user_id, email: null, full_name: null }
          };
        })
      );
      
      res.json(membersWithProfiles);
    } catch (tableError) {
      // If trip_users table doesn't exist, return empty array
      if (tableError.code === '42P01' || tableError.message?.includes('does not exist')) {
        return res.json([]);
      }
      throw tableError;
    }
    } catch (tableError) {
      // If trip_users table doesn't exist, return empty array
      console.error('Error in trip members route:', tableError);
      console.error('Error code:', tableError.code);
      console.error('Error message:', tableError.message);
      
      if (tableError.code === '42P01' || tableError.message?.includes('does not exist') || tableError.message?.includes('relation')) {
        return res.json([]);
      }
      
      // If it's a different error, try to return the user as owner if they created the trip
      try {
        const { data: trip } = await supabase
          .from('trips')
          .select('created_by, user_id')
          .eq('id', tripId)
          .maybeSingle();
        
        if (trip && (trip.created_by === req.userId || trip.user_id === req.userId)) {
          return res.json([{
            id: 'temp-' + req.userId,
            trip_id: tripId,
            user_id: req.userId,
            role: 'owner',
            profiles: { id: req.userId, email: null, full_name: null }
          }]);
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
      
      res.status(500).json({ 
        error: 'Error fetching trip members', 
        details: tableError.message,
        code: tableError.code
      });
    }
});

// Add member to trip
app.post('/api/trips/:tripId/members', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { tripId } = req.params;
    const { userId } = req.body; // User ID to add (from dropdown)

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Verify user is owner of the trip
    const { data: memberCheck, error: memberError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', req.userId)
      .single();

    if (memberError || !memberCheck || memberCheck.role !== 'owner') {
      return res.status(403).json({ error: 'Only trip owners can add members' });
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('trip_users')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this trip' });
    }

    // Add user to trip
    const { data, error } = await supabase
      .from('trip_users')
      .insert([{ trip_id: tripId, user_id: userId, role: 'member' }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error adding trip member:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove member from trip
app.delete('/api/trips/:tripId/members/:userId', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { tripId, userId } = req.params;

    // Verify user is owner of the trip
    const { data: memberCheck, error: memberError } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', req.userId)
      .single();

    if (memberError || !memberCheck || memberCheck.role !== 'owner') {
      return res.status(403).json({ error: 'Only trip owners can remove members' });
    }

    // Don't allow removing the owner
    const { data: targetMember } = await supabase
      .from('trip_users')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .single();

    if (targetMember?.role === 'owner') {
      return res.status(400).json({ error: 'Cannot remove trip owner' });
    }

    const { error } = await supabase
      .from('trip_users')
      .delete()
      .eq('trip_id', tripId)
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing trip member:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== COMPLETE TRIP DATA ROUTE ====================

// Get complete trip data (trip + days + lodging + food) - for main app view
app.get('/api/trips/:tripId/complete', async (req, res) => {
  try {
    const { tripId } = req.params;

    // Fetch trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (tripError) throw tripError;

    // Fetch days
    const { data: days, error: daysError } = await supabase
      .from('days')
      .select('*')
      .eq('trip_id', tripId)
      .order('date', { ascending: true });

    if (daysError) throw daysError;

    // Fetch lodging
    const { data: lodging, error: lodgingError } = await supabase
      .from('lodging_info')
      .select('*')
      .eq('trip_id', tripId);

    if (lodgingError) throw lodgingError;

    // Fetch food research
    const { data: food, error: foodError } = await supabase
      .from('food_research')
      .select('*')
      .eq('trip_id', tripId);

    if (foodError) throw foodError;

    res.json({
      trip,
      days,
      lodging,
      food
    });
  } catch (error) {
    console.error('Error fetching complete trip data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Legacy route for backward compatibility (uses first trip or creates default)
app.get('/api/trip', async (req, res) => {
  try {
    // Get first trip or create a default one
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    let tripId;
    if (tripsError || !trips || trips.length === 0) {
      // Create default trip
      const { data: newTrip, error: createError } = await supabase
        .from('trips')
        .insert([{
          name: 'My Trip',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (createError) throw createError;
      tripId = newTrip.id;
    } else {
      tripId = trips[0].id;
    }

    // Get days for this trip
    const { data: days, error: daysError } = await supabase
      .from('days')
      .select('*')
      .eq('trip_id', tripId)
      .order('date', { ascending: true });

    if (daysError) throw daysError;

    // Format days for frontend (convert date to day number)
    const formattedDays = days.map((day, index) => {
      const date = new Date(day.date);
      return {
        id: day.id,
        date: date.getDate(),
        selected: index === 0,
        plan: day.plan
      };
    });

    // If no days exist, create some default ones
    if (formattedDays.length === 0) {
      const startDate = new Date();
      const defaultDays = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        defaultDays.push({
          id: i + 1,
          date: date.getDate(),
          selected: i === 0,
          plan: i === 0 ? 'The plan for today!' : ''
        });
      }
      res.json({
        days: defaultDays,
        currentDay: {
          date: defaultDays[0].date,
          plan: defaultDays[0].plan
        }
      });
    } else {
      const selectedDay = formattedDays.find(d => d.selected) || formattedDays[0];
      res.json({
        days: formattedDays,
        currentDay: {
          date: selectedDay.date,
          plan: selectedDay.plan || 'The plan for today!'
        }
      });
    }
  } catch (error) {
    console.error('Error in legacy trip route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Only start server if not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;
