require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./config/supabase');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
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

// Get all trips
app.get('/api/trips', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching trips:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Check if it's a 403/RLS issue
      if (error.code === 'PGRST301' || error.message.includes('permission') || error.message.includes('403')) {
        return res.status(403).json({ 
          error: 'Permission denied (RLS issue)',
          details: 'Please run the RLS fix SQL in your Supabase dashboard. See supabase/disable-rls-temporary.sql',
          code: error.code
        });
      }
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
    const { name, start_date, end_date } = req.body;
    const { data, error } = await supabase
      .from('trips')
      .insert([{ name, start_date, end_date }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating trip:', error);
      // Provide more helpful error message for 403
      if (error.code === 'PGRST301' || error.message.includes('permission') || error.message.includes('403')) {
        return res.status(403).json({ 
          error: 'Permission denied. This is likely an RLS (Row Level Security) issue.',
          details: 'Please ensure you have run the RLS fix SQL script (supabase/fix-rls.sql) in your Supabase SQL Editor, or add your SERVICE_ROLE_KEY to server/.env'
        });
      }
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
    const { id } = req.params;
    const { name, start_date, end_date } = req.body;
    const { data, error } = await supabase
      .from('trips')
      .update({ name, start_date, end_date })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete trip
app.delete('/api/trips/:id', async (req, res) => {
  try {
    const { id } = req.params;
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
    const { trip_id, date, plan } = req.body;
    const { data, error } = await supabase
      .from('days')
      .upsert({ trip_id, date, plan }, { onConflict: 'trip_id,date' })
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
    const { id } = req.params;
    const { plan } = req.body;
    const { data, error } = await supabase
      .from('days')
      .update({ plan })
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
    const { trip_id, name, address, check_in, check_out, notes } = req.body;
    const { data, error } = await supabase
      .from('lodging_info')
      .insert([{ trip_id, name, address, check_in, check_out, notes }])
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
    const { id } = req.params;
    const { name, address, check_in, check_out, notes } = req.body;
    const { data, error } = await supabase
      .from('lodging_info')
      .update({ name, address, check_in, check_out, notes })
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
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create activity
app.post('/api/activities', async (req, res) => {
  try {
    const { trip_id, name, location, notes } = req.body;
    const { data, error } = await supabase
      .from('activities')
      .insert([{ trip_id, name, location, notes }])
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
    const { id } = req.params;
    const { name, location, notes } = req.body;
    const { data, error } = await supabase
      .from('activities')
      .update({ name, location, notes })
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
    const { trip_id, name, location, cuisine, link, notes } = req.body;
    const { data, error } = await supabase
      .from('food_research')
      .insert([{ trip_id, name, location, cuisine, link, notes }])
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
    const { id } = req.params;
    const { name, location, cuisine, link, notes } = req.body;
    const { data, error } = await supabase
      .from('food_research')
      .update({ name, location, cuisine, link, notes })
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
    const { trip_id, title, description, status, decision } = req.body;
    const { data, error } = await supabase
      .from('decisions')
      .insert([{ trip_id, title, description, status, decision }])
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
    const { id } = req.params;
    const { title, description, status, decision } = req.body;
    const { data, error } = await supabase
      .from('decisions')
      .update({ title, description, status, decision })
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
