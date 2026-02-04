import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import axios from 'axios';
import { supabase } from './config/supabase';
import TripSharing from './components/TripSharing';

// Configure axios base URL
// In production (Vercel), use empty string since routes already have /api prefix
// In development, use localhost
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? '' 
    : (process.env.REACT_APP_API_URL || 'http://localhost:5001'),
});

// Add auth token to all requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Add auth token to all requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

const tripTitles = [
  "let's goooooo",
  "passport szn",
  "jet set baby",
  "out of office incoming",
  "reality: paused",
  "normalize having fun",
  "treat yourself era",
  "escape plan activated",
  "yep yep yep",
"oh we're SO back",
"this is it",
"the vibe check passed",
"certified adventure"
];

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  
  const [trips, setTrips] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [currentPlan, setCurrentPlan] = useState('');
  const [showTripModal, setShowTripModal] = useState(false);
  const [randomTitle, setRandomTitle] = useState('');
  const [newTrip, setNewTrip] = useState({
    name: '',
    start_date: '',
    end_date: ''
  });
  
  // Quick references state
  const [showLodgingModal, setShowLodgingModal] = useState(false);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showDecisionsModal, setShowDecisionsModal] = useState(false);
  const [lodging, setLodging] = useState([]);
  const [activities, setActivities] = useState([]);
  const [food, setFood] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [editingLodging, setEditingLodging] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);
  const [editingFood, setEditingFood] = useState(null);
  const [editingDecision, setEditingDecision] = useState(null);
  const [newLodging, setNewLodging] = useState({
    name: '',
    address: '',
    check_in: '',
    check_out: '',
    notes: ''
  });
  const [newActivity, setNewActivity] = useState({
    name: '',
    location: '',
    notes: '',
    icon: 'fa-hiking', // default icon
    link: ''
  });
  const [newFood, setNewFood] = useState({
    name: '',
    location: '',
    cuisine: '',
    link: '',
    notes: ''
  });
  const [newDecision, setNewDecision] = useState({
    title: '',
    description: '',
    status: 'pending',
    decision: ''
  });
  const [isTripOwner, setIsTripOwner] = useState(false);
  const [tripMembers, setTripMembers] = useState([]);

  // Check auth status on mount
  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: {
          data: {
            full_name: authName,
          }
        }
      });
      if (error) throw error;
      
      if (data.user) {
        // Ensure profile is created (trigger should do this, but add fallback)
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: authEmail,
              full_name: authName
            }, {
              onConflict: 'id'
            });
          
          if (profileError) {
            console.error('Error creating profile:', profileError);
            // Don't fail signup if profile creation fails - trigger might have already done it
          }
        } catch (profileErr) {
          console.error('Error ensuring profile exists:', profileErr);
          // Continue anyway - trigger might have created it
        }
        
        setShowAuthModal(false);
        setAuthEmail('');
        setAuthPassword('');
        setAuthName('');
      }
    } catch (error) {
      alert('Error signing up: ' + error.message);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) throw error;
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (error) {
      alert('Error signing in: ' + error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setTrips([]);
    setCurrentTrip(null);
  };

  // Set random title on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * tripTitles.length);
    setRandomTitle(tripTitles[randomIndex]);
  }, []);

  // Define fetch functions with useCallback (must be defined before useEffects that use them)
  const fetchTrips = useCallback(async () => {
    try {
      const response = await api.get('/api/trips');
      // Ensure we always set an array
      const tripsData = Array.isArray(response.data) ? response.data : [];
      setTrips(tripsData);
      if (tripsData.length > 0 && !currentTrip) {
        setCurrentTrip(tripsData[0]);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      // Show user-friendly error
      if (error.response?.status === 403) {
        alert('Permission denied. Please check your Supabase RLS settings. See QUICK_FIX.md');
      }
    }
  }, [currentTrip]);

  // Lodging functions
  const fetchLodging = useCallback(async () => {
    if (!currentTrip) return;
    try {
      const response = await api.get(`/api/trips/${currentTrip.id}/lodging`);
      setLodging(response.data);
    } catch (error) {
      console.error('Error fetching lodging:', error);
    }
  }, [currentTrip]);

  // Activities functions
  const fetchActivities = useCallback(async () => {
    if (!currentTrip) return;
    try {
      const response = await api.get(`/api/trips/${currentTrip.id}/activities`);
      setActivities(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    }
  }, [currentTrip]);

  // Food functions
  const fetchFood = useCallback(async () => {
    if (!currentTrip) return;
    try {
      const response = await api.get(`/api/trips/${currentTrip.id}/food`);
      setFood(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching food:', error);
      setFood([]);
    }
  }, [currentTrip]);

  // Decisions functions
  const fetchDecisions = useCallback(async () => {
    if (!currentTrip) return;
    try {
      const response = await api.get(`/api/trips/${currentTrip.id}/decisions`);
      setDecisions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching decisions:', error);
      setDecisions([]);
    }
  }, [currentTrip]);

  const handleCreateDecision = async (e) => {
    e.preventDefault();
    if (!currentTrip) return;
    try {
      if (editingDecision) {
        await api.put(`/api/decisions/${editingDecision.id}`, {
          ...newDecision,
          trip_id: currentTrip.id
        });
      } else {
        await api.post('/api/decisions', {
          ...newDecision,
          trip_id: currentTrip.id
        });
      }
      fetchDecisions();
      setNewDecision({ title: '', description: '', status: 'pending', decision: '' });
      setEditingDecision(null);
      setShowDecisionsModal(false);
    } catch (error) {
      console.error('Error saving decision:', error);
      alert('Error saving decision. Please try again.');
    }
  };

  const handleDeleteDecision = async (id) => {
    if (!window.confirm('Are you sure you want to delete this decision?')) return;
    try {
      await api.delete(`/api/decisions/${id}`);
      fetchDecisions();
    } catch (error) {
      console.error('Error deleting decision:', error);
    }
  };

  // Fetch trips when user is authenticated
  useEffect(() => {
    if (user) {
      fetchTrips();
    }
  }, [user, fetchTrips]);

  // Check if user is trip owner and fetch members
  const fetchTripMembers = useCallback(async () => {
    if (!currentTrip || !user) {
      setIsTripOwner(false);
      setTripMembers([]);
      return;
    }
    try {
      const response = await api.get(`/api/trips/${currentTrip.id}/members`);
      const members = Array.isArray(response.data) ? response.data : [];
      setTripMembers(members);

      // Check if current user is owner
      const currentUserMember = members.find(m => m.user_id === user.id);
      const isOwnerFromMembers = currentUserMember?.role === 'owner';
      
      // Check if user created the trip (fallback if not in members array)
      const userCreatedTrip = currentTrip.created_by === user.id || currentTrip.user_id === user.id;
      
      // User is owner if:
      // 1. They're in members array with role 'owner', OR
      // 2. They created the trip (even if not in members array yet)
      const isOwner = isOwnerFromMembers || userCreatedTrip;
      
      setIsTripOwner(isOwner);
    } catch (error) {
      console.error('Error fetching trip members:', error);
      // Fallback: if error but user created the trip, assume they're owner
      if (currentTrip?.created_by === user.id) {
        setIsTripOwner(true);
      } else {
        setIsTripOwner(false);
      }
      setTripMembers([]);
    }
  }, [currentTrip, user]);

  // Fetch days when trip changes
  useEffect(() => {
    if (currentTrip) {
      fetchDaysForTrip(currentTrip.id);
      fetchLodging();
      fetchFood();
      fetchActivities();
      fetchDecisions();
      fetchTripMembers();
    }
  }, [currentTrip, fetchLodging, fetchFood, fetchActivities, fetchDecisions, fetchTripMembers]);

  const fetchDaysForTrip = async (tripId) => {
    try {
      // First, get the trip to know the date range
      const tripResponse = await api.get(`/api/trips/${tripId}`);
      const trip = tripResponse.data;
      
      // Fetch existing days
      const daysResponse = await api.get(`/api/trips/${tripId}/days`);
      const daysData = Array.isArray(daysResponse.data) ? daysResponse.data : [];
      
      // Generate days for the date range if none exist
      if (daysData.length === 0) {
        const startDate = new Date(trip.start_date);
        const endDate = new Date(trip.end_date);
        const daysToCreate = [];
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          daysToCreate.push({
            trip_id: tripId,
            date: d.toISOString().split('T')[0],
            plan: ''
          });
        }
        
        // Create all days in parallel
        const createPromises = daysToCreate.map(day => 
          api.post('/api/days', day)
        );
        await Promise.all(createPromises);
        
        // Fetch the newly created days
        const newDaysResponse = await api.get(`/api/trips/${tripId}/days`);
        const newDaysData = newDaysResponse.data;
        
        // Format days for display - show actual calendar dates
        const formattedDays = newDaysData.map((day, index) => {
          // Parse date string (YYYY-MM-DD) to avoid timezone issues
          const [year, month, dayNum] = day.date.split('-').map(Number);
          const date = new Date(year, month - 1, dayNum);
          const dayNumber = date.getDate();
          const monthIndex = date.getMonth();
          const firstDayDate = newDaysData[0].date.split('-').map(Number);
          const firstDayMonth = new Date(firstDayDate[0], firstDayDate[1] - 1, firstDayDate[2]).getMonth();
          // Show month abbreviation on first day or when month changes
          const monthLabel = (index === 0 || monthIndex !== firstDayMonth) 
            ? date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() 
            : '';
          return {
            id: day.id,
            date: dayNumber,
            dateString: day.date,
            monthLabel: monthLabel,
            fullDate: date,
            selected: index === 0,
            plan: day.plan || ''
          };
        });
        
        setDays(formattedDays);
        
        if (formattedDays.length > 0) {
          const firstDay = formattedDays[0];
          setSelectedDay(firstDay.date);
          setCurrentPlan(firstDay.plan || 'The plan for today!');
        }
      } else {
        // Format existing days for display - show actual calendar dates
        const formattedDays = daysData.map((day, index) => {
          // Parse date string (YYYY-MM-DD) to avoid timezone issues
          const [year, month, dayNum] = day.date.split('-').map(Number);
          const date = new Date(year, month - 1, dayNum);
          const dayNumber = date.getDate();
          const monthIndex = date.getMonth();
          const firstDayDate = daysData[0].date.split('-').map(Number);
          const firstDayMonth = new Date(firstDayDate[0], firstDayDate[1] - 1, firstDayDate[2]).getMonth();
          // Show month abbreviation on first day or when month changes
          const monthLabel = (index === 0 || monthIndex !== firstDayMonth) 
            ? date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() 
            : '';
          return {
            id: day.id,
            date: dayNumber,
            dateString: day.date,
            monthLabel: monthLabel,
            fullDate: date,
            selected: index === 0,
            plan: day.plan || ''
          };
        });

        setDays(formattedDays);
        
        if (formattedDays.length > 0) {
          const firstDay = formattedDays[0];
          setSelectedDay(firstDay.date);
          setCurrentPlan(firstDay.plan || 'The plan for today!');
        }
      }
    } catch (error) {
      console.error('Error fetching days:', error);
      setDays([]);
    }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/trips', newTrip);
      const createdTrip = response.data;
      
      // Add the new trip to the list and select it
      setTrips([...trips, createdTrip]);
      setCurrentTrip(createdTrip);
      
      // Reset form and close modal
      setNewTrip({ name: '', start_date: '', end_date: '' });
      setShowTripModal(false);
    } catch (error) {
      console.error('Error creating trip:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      const errorMsg = error.response?.data?.error || error.response?.data?.details || error.message;
      alert(`Error creating trip: ${errorMsg}\n\nCheck the browser console for more details.`);
    }
  };

  const handleTripSelect = (trip) => {
    setCurrentTrip(trip);
  };

  const handleDayClick = async (day) => {
    setSelectedDay(day.date);
    // Update selected state for all days
    if (Array.isArray(days)) {
      const updatedDays = days.map(d => ({
        ...d,
        selected: d.date === day.date
      }));
      setDays(updatedDays);
    }
    
    // Fetch plan for selected day
    try {
      const dayData = days.find(d => d.date === day.date);
      if (dayData && dayData.id) {
        const response = await api.get(`/api/days/${dayData.id}`);
        setCurrentPlan(response.data.plan || `The plan for day ${day.date}!`);
      } else {
        setCurrentPlan(`The plan for day ${day.date}!`);
      }
    } catch (error) {
      console.error('Error fetching day data:', error);
      setCurrentPlan(`The plan for day ${day.date}!`);
    }
  };

  const handleUpdatePlan = async (plan) => {
    if (!currentTrip || selectedDay === null) return;
    
    try {
      const dayData = days.find(d => d.date === selectedDay);
      if (dayData && dayData.id) {
        // Update existing day
        await api.put(`/api/days/${dayData.id}`, { plan });
        setCurrentPlan(plan);
        // Update local state
        if (Array.isArray(days)) {
          const updatedDays = days.map(d => 
            d.id === dayData.id ? { ...d, plan } : d
          );
          setDays(updatedDays);
        }
      } else {
        // This shouldn't happen if days are properly generated, but handle it anyway
        const dayDataWithDate = days.find(d => d.date === selectedDay);
        if (dayDataWithDate && dayDataWithDate.dateString) {
          await api.post('/api/days', {
            trip_id: currentTrip.id,
            date: dayDataWithDate.dateString,
            plan
          });
          setCurrentPlan(plan);
          fetchDaysForTrip(currentTrip.id);
        }
      }
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  };

  const handleCreateLodging = async (e) => {
    e.preventDefault();
    if (!currentTrip) return;
    try {
      if (editingLodging) {
        await api.put(`/api/lodging/${editingLodging.id}`, {
          ...newLodging,
          trip_id: currentTrip.id
        });
      } else {
        await api.post('/api/lodging', {
          ...newLodging,
          trip_id: currentTrip.id
        });
      }
      fetchLodging();
      setNewLodging({ name: '', address: '', check_in: '', check_out: '', notes: '' });
      setEditingLodging(null);
      setShowLodgingModal(false);
    } catch (error) {
      console.error('Error saving lodging:', error);
      alert('Error saving lodging. Please try again.');
    }
  };

  const handleDeleteLodging = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lodging?')) return;
    try {
      await api.delete(`/api/lodging/${id}`);
      fetchLodging();
    } catch (error) {
      console.error('Error deleting lodging:', error);
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    if (!currentTrip) return;
    try {
      if (editingActivity) {
        await api.put(`/api/activities/${editingActivity.id}`, {
          ...newActivity,
          trip_id: currentTrip.id
        });
      } else {
        await api.post('/api/activities', {
          ...newActivity,
          trip_id: currentTrip.id
        });
      }
      fetchActivities();
      setNewActivity({ name: '', location: '', notes: '', icon: 'fa-hiking', link: '' });
      setEditingActivity(null);
      setShowActivitiesModal(false);
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Error saving activity. Please try again.');
    }
  };

  const handleDeleteActivity = async (id) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    try {
      await api.delete(`/api/activities/${id}`);
      fetchActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  const handleCreateFood = async (e) => {
    e.preventDefault();
    if (!currentTrip) return;
    try {
      if (editingFood) {
        await api.put(`/api/food/${editingFood.id}`, {
          ...newFood,
          trip_id: currentTrip.id
        });
      } else {
        await api.post('/api/food', {
          ...newFood,
          trip_id: currentTrip.id
        });
      }
      fetchFood();
      setNewFood({ name: '', location: '', cuisine: '', link: '', notes: '' });
      setEditingFood(null);
      setShowFoodModal(false);
    } catch (error) {
      console.error('Error saving food:', error);
      alert('Error saving food. Please try again.');
    }
  };

  const handleDeleteFood = async (id) => {
    if (!window.confirm('Are you sure you want to delete this food research?')) return;
    try {
      await api.delete(`/api/food/${id}`);
      fetchFood();
    } catch (error) {
      console.error('Error deleting food:', error);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app">
        <div className="auth-screen">
          <div className="auth-container">
            <h1 className="auth-brand">resa</h1>
            <p className="auth-instruction">Sign in or create an account to start planning your trips.</p>
            <div className="auth-buttons">
              <button 
                className="auth-button"
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
              >
                Sign In
              </button>
              <button 
                className="auth-button"
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>

        {showAuthModal && (
          <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">{authMode === 'signin' ? 'Sign In' : 'Sign Up'}</h2>
              <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp}>
                {authMode === 'signup' && (
                  <div className="form-group">
                    <label htmlFor="auth-name">Full Name</label>
                    <input
                      type="text"
                      id="auth-name"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Your name"
                      required={authMode === 'signup'}
                    />
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="auth-email">Email</label>
                  <input
                    type="email"
                    id="auth-email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="auth-password">Password</label>
                  <input
                    type="password"
                    id="auth-password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <div className="modal-buttons">
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => {
                      setShowAuthModal(false);
                      setAuthEmail('');
                      setAuthPassword('');
                      setAuthName('');
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-button">
                    {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
                  </button>
                </div>
                <div className="auth-switch">
                  {authMode === 'signin' ? (
                    <p>Don't have an account? <button type="button" className="link-button" onClick={() => setAuthMode('signup')}>Sign up</button></p>
                  ) : (
                    <p>Already have an account? <button type="button" className="link-button" onClick={() => setAuthMode('signin')}>Sign in</button></p>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header-bar">
        <div className="user-info">
          <span>welcome back, {user.email}</span>
          <button className="sign-out-button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>
      <div className="container">
        <div className="header-section">
          <h1 className="title">{randomTitle || "Your trip :)"}</h1>
          <div className="trip-controls">
            {trips.length > 0 && (
              <select 
                className="trip-selector"
                value={currentTrip?.id || ''}
                onChange={(e) => {
                  const trip = trips.find(t => t.id === e.target.value);
                  if (trip) handleTripSelect(trip);
                }}
              >
                {Array.isArray(trips) && trips.map(trip => (
                  <option key={trip.id} value={trip.id}>
                    {trip.name}
                  </option>
                ))}
              </select>
            )}
            <button 
              className="new-trip-button"
              onClick={() => setShowTripModal(true)}
            >
              + New Trip
            </button>
          </div>
        </div>

        {currentTrip && days.length > 0 ? (
          <>
            <div className="day-selector">
              {Array.isArray(days) && days.map((day) => (
                <div
                  key={day.id}
                  className={`day-circle ${day.selected ? 'selected' : ''}`}
                  onClick={() => handleDayClick(day)}
                  title={day.fullDate ? day.fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                >
                  <div className="day-number">{day.date}</div>
                  {day.monthLabel && <div className="day-month">{day.monthLabel}</div>}
                </div>
              ))}
            </div>

            <div className="plan-box">
              <h2 className="plan-title">The plan for today!</h2>
              <div 
                className="plan-content"
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleUpdatePlan(e.target.textContent)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.target.blur();
                  }
                }}
              >
                {currentPlan || 'Click to add your plan...'}
              </div>
            </div>
          </>
        ) : (
          <div className="no-trip-message">
            {trips.length === 0 ? (
              <p>Create your first trip to get started!</p>
            ) : (
              <p>Loading trip data...</p>
            )}
          </div>
        )}

        {currentTrip && (
          <TripSharing 
            tripId={currentTrip.id} 
            isOwner={isTripOwner}
            onMemberAdded={fetchTripMembers}
          />
        )}

        <div className="quick-references">
          <h2 className="references-title">Quick References</h2>
          <div className="references-buttons">
            <button 
              className="reference-button"
              onClick={() => {
                if (!currentTrip) {
                  alert('Please create or select a trip first');
                  return;
                }
                setShowLodgingModal(true);
                fetchLodging();
              }}
            >
              lodging{lodging.length > 0 && `(${lodging.length})`}
            </button>
            <button 
              className="reference-button"
              onClick={() => {
                if (!currentTrip) {
                  alert('Please create or select a trip first');
                  return;
                }
                setShowActivitiesModal(true);
                fetchActivities();
              }}
            >
              activities {activities.length > 0 && `(${activities.length})`}
            </button>
            <button 
              className="reference-button"
              onClick={() => {
                if (!currentTrip) {
                  alert('Please create or select a trip first');
                  return;
                }
                setShowFoodModal(true);
                fetchFood();
              }}
            >
              food {food.length > 0 && `(${food.length})`}
            </button>
            <button 
              className="reference-button"
              onClick={() => {
                if (!currentTrip) {
                  alert('Please create or select a trip first');
                  return;
                }
                setShowDecisionsModal(true);
                fetchDecisions();
              }}
            >
              decisions {decisions.length > 0 && `(${decisions.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* Trip Creation Modal */}
      {showTripModal && (
        <div className="modal-overlay" onClick={() => setShowTripModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create New Trip</h2>
            <form onSubmit={handleCreateTrip}>
              <div className="form-group">
                <label htmlFor="trip-name">Trip Name</label>
                <input
                  type="text"
                  id="trip-name"
                  value={newTrip.name}
                  onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
                  placeholder="e.g., Summer Vacation 2024"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="start-date">Start Date</label>
                <input
                  type="date"
                  id="start-date"
                  value={newTrip.start_date}
                  onChange={(e) => setNewTrip({ ...newTrip, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="end-date">End Date</label>
                <input
                  type="date"
                  id="end-date"
                  value={newTrip.end_date}
                  onChange={(e) => setNewTrip({ ...newTrip, end_date: e.target.value })}
                  required
                />
              </div>
              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setShowTripModal(false);
                    setNewTrip({ name: '', start_date: '', end_date: '' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  Create Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lodging Modal */}
      {showLodgingModal && (
        <div className="modal-overlay" onClick={() => {
          setShowLodgingModal(false);
          setEditingLodging(null);
          setNewLodging({ name: '', address: '', check_in: '', check_out: '', notes: '' });
        }}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Lodging Info</h2>
            <form onSubmit={handleCreateLodging}>
              <div className="form-group">
                <label htmlFor="lodging-name">Name</label>
                <input
                  type="text"
                  id="lodging-name"
                  value={newLodging.name}
                  onChange={(e) => setNewLodging({ ...newLodging, name: e.target.value })}
                  placeholder="Hotel/Airbnb name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lodging-address">Address</label>
                <input
                  type="text"
                  id="lodging-address"
                  value={newLodging.address}
                  onChange={(e) => setNewLodging({ ...newLodging, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="lodging-checkin">Check In</label>
                  <input
                    type="date"
                    id="lodging-checkin"
                    value={newLodging.check_in}
                    onChange={(e) => setNewLodging({ ...newLodging, check_in: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lodging-checkout">Check Out</label>
                  <input
                    type="date"
                    id="lodging-checkout"
                    value={newLodging.check_out}
                    onChange={(e) => setNewLodging({ ...newLodging, check_out: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="lodging-notes">Notes</label>
                <textarea
                  id="lodging-notes"
                  value={newLodging.notes}
                  onChange={(e) => setNewLodging({ ...newLodging, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows="3"
                />
              </div>
              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setEditingLodging(null);
                    setNewLodging({ name: '', address: '', check_in: '', check_out: '', notes: '' });
                  }}
                >
                  Clear
                </button>
                <button type="submit" className="submit-button">
                  {editingLodging ? 'Update' : 'Add'} Lodging
                </button>
              </div>
            </form>
            <div className="items-list">
              <h3>Saved Lodging ({lodging.length})</h3>
              {lodging.length === 0 ? (
                <p className="empty-message">No lodging added yet</p>
              ) : (
                Array.isArray(lodging) && lodging.map(item => (
                  <div key={item.id} className="item-card">
                    <div className="item-content">
                      <h4>{item.name}</h4>
                      {item.address && <p><strong>Address:</strong> {item.address}</p>}
                      {(item.check_in || item.check_out) && (
                        <p><strong>Dates:</strong> {item.check_in || 'TBD'} - {item.check_out || 'TBD'}</p>
                      )}
                      {item.notes && <p>{item.notes}</p>}
                    </div>
                    <div className="item-actions">
                      <button 
                        className="edit-button"
                        onClick={() => {
                          setEditingLodging(item);
                          setNewLodging({
                            name: item.name,
                            address: item.address || '',
                            check_in: item.check_in || '',
                            check_out: item.check_out || '',
                            notes: item.notes || ''
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteLodging(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button 
              className="close-modal-button"
              onClick={() => {
                setShowLodgingModal(false);
                setEditingLodging(null);
                setNewLodging({ name: '', address: '', check_in: '', check_out: '', notes: '' });
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Activities Modal */}
      {showActivitiesModal && (
        <div className="modal-overlay" onClick={() => {
          setShowActivitiesModal(false);
          setEditingActivity(null);
          setNewActivity({ name: '', location: '', notes: '', icon: 'fa-hiking' });
        }}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              <i className="fas fa-hiking" style={{ marginRight: '10px' }}></i>
              activities
            </h2>
            <form onSubmit={handleCreateActivity}>
              <div className="form-group">
                <label htmlFor="activity-name">Activity Name</label>
                <input
                  type="text"
                  id="activity-name"
                  value={newActivity.name}
                  onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                  placeholder="e.g., Visit Museum, Beach Day"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="activity-location">Location</label>
                <input
                  type="text"
                  id="activity-location"
                  value={newActivity.location}
                  onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                  placeholder="Where is this activity?"
                />
              </div>
              <div className="form-group">
                <label htmlFor="activity-icon">Icon</label>
                <div className="icon-selector">
                  <div className="icon-preview">
                    <i className={`fas ${newActivity.icon || 'fa-hiking'}`} style={{ fontSize: '24px', marginRight: '10px' }}></i>
                    <input
                      type="text"
                      id="activity-icon"
                      value={newActivity.icon || 'fa-hiking'}
                      onChange={(e) => setNewActivity({ ...newActivity, icon: e.target.value })}
                      placeholder="e.g., fa-hiking, fa-umbrella-beach, fa-museum"
                    />
                  </div>
                  <div className="icon-suggestions">
                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '8px' }}>Popular icons:</p>
                    <div className="icon-buttons">
                      {['fa-hiking', 'fa-umbrella-beach', 'fa-museum', 'fa-camera', 'fa-swimming-pool', 'fa-mountain', 'fa-bicycle', 'fa-ship', 'fa-plane', 'fa-car', 'fa-utensils', 'fa-music'].map(icon => (
                        <button
                          key={icon}
                          type="button"
                          className={`icon-button ${newActivity.icon === icon ? 'selected' : ''}`}
                          onClick={() => setNewActivity({ ...newActivity, icon })}
                          title={icon}
                        >
                          <i className={`fas ${icon}`}></i>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="activity-link">Link</label>
                <input
                  type="url"
                  id="activity-link"
                  value={newActivity.link}
                  onChange={(e) => setNewActivity({ ...newActivity, link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="form-group">
                <label htmlFor="activity-notes">Notes</label>
                <textarea
                  id="activity-notes"
                  value={newActivity.notes}
                  onChange={(e) => setNewActivity({ ...newActivity, notes: e.target.value })}
                  placeholder="Additional details..."
                  rows="3"
                />
              </div>
              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setEditingActivity(null);
                    setNewActivity({ name: '', location: '', notes: '', icon: 'fa-hiking', link: '' });
                  }}
                >
                  Clear
                </button>
                <button type="submit" className="submit-button">
                  {editingActivity ? 'Update' : 'Add'} Activity
                </button>
              </div>
            </form>
            <div className="items-list">
              <h3>Saved Activities ({activities.length})</h3>
              {activities.length === 0 ? (
                <p className="empty-message">No activities added yet</p>
              ) : (
                activities.map(item => (
                  <div key={item.id} className="item-card">
                    <div className="item-content">
                      <h4>
                        <i className={`fas ${item.icon || 'fa-hiking'}`} style={{ marginRight: '8px', color: 'var(--primary-yellow)' }}></i>
                        {item.name}
                      </h4>
                      {item.location && (
                        <p>
                          <i className="fas fa-location-dot" style={{ marginRight: '6px', color: '#666' }}></i>
                          <strong>Location:</strong> {item.location}
                        </p>
                      )}
                      {item.link && (
                        <p>
                          <i className="fas fa-link" style={{ marginRight: '6px', color: '#666' }}></i>
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="food-link">
                            {item.link}
                          </a>
                        </p>
                      )}
                      {item.notes && (
                        <p>
                          <i className="fas fa-sticky-note" style={{ marginRight: '6px', color: '#666' }}></i>
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="item-actions">
                      <button 
                        className="edit-button"
                        onClick={() => {
                        setEditingActivity(item);
                        setNewActivity({
                          name: item.name,
                          location: item.location || '',
                          notes: item.notes || '',
                          icon: item.icon || 'fa-hiking',
                          link: item.link || ''
                        });
                        }}
                      >
                        <i className="fas fa-edit" style={{ marginRight: '6px' }}></i>
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteActivity(item.id)}
                      >
                        <i className="fas fa-trash" style={{ marginRight: '6px' }}></i>
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button 
              className="close-modal-button"
              onClick={() => {
                setShowActivitiesModal(false);
                setEditingActivity(null);
                setNewActivity({ name: '', location: '', notes: '', icon: 'fa-hiking' });
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Food Modal */}
      {showFoodModal && (
        <div className="modal-overlay" onClick={() => {
          setShowFoodModal(false);
          setEditingFood(null);
          setNewFood({ name: '', location: '', cuisine: '', link: '', notes: '' });
        }}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Food Research</h2>
            <form onSubmit={handleCreateFood}>
              <div className="form-group">
                <label htmlFor="food-name">Restaurant/Place Name</label>
                <input
                  type="text"
                  id="food-name"
                  value={newFood.name}
                  onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                  placeholder="Restaurant or food place name"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="food-location">Location</label>
                  <input
                    type="text"
                    id="food-location"
                    value={newFood.location}
                    onChange={(e) => setNewFood({ ...newFood, location: e.target.value })}
                    placeholder="Address or area"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="food-cuisine">Cuisine Type</label>
                  <input
                    type="text"
                    id="food-cuisine"
                    value={newFood.cuisine}
                    onChange={(e) => setNewFood({ ...newFood, cuisine: e.target.value })}
                    placeholder="e.g., Italian, Sushi, Street Food"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="food-link">Link</label>
                <input
                  type="url"
                  id="food-link"
                  value={newFood.link}
                  onChange={(e) => setNewFood({ ...newFood, link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="form-group">
                <label htmlFor="food-notes">Notes</label>
                <textarea
                  id="food-notes"
                  value={newFood.notes}
                  onChange={(e) => setNewFood({ ...newFood, notes: e.target.value })}
                  placeholder="What to order, recommendations, etc."
                  rows="3"
                />
              </div>
              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setEditingFood(null);
                    setNewFood({ name: '', location: '', cuisine: '', link: '', notes: '' });
                  }}
                >
                  Clear
                </button>
                <button type="submit" className="submit-button">
                  {editingFood ? 'Update' : 'Add'} Food Research
                </button>
              </div>
            </form>
            <div className="items-list">
              <h3>Saved Food Research ({food.length})</h3>
              {food.length === 0 ? (
                <p className="empty-message">No food research added yet</p>
              ) : (
                Array.isArray(food) && food.map(item => (
                  <div key={item.id} className="item-card">
                    <div className="item-content">
                      <h4>{item.name}</h4>
                      {item.cuisine && <p><strong>Cuisine:</strong> {item.cuisine}</p>}
                      {item.location && <p><strong>Location:</strong> {item.location}</p>}
                      {item.link && (
                        <p>
                          <strong>Link:</strong>{' '}
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="food-link"
                          >
                            {item.link}
                          </a>
                        </p>
                      )}
                      {item.notes && <p>{item.notes}</p>}
                    </div>
                    <div className="item-actions">
                      <button 
                        className="edit-button"
                        onClick={() => {
                          setEditingFood(item);
                          setNewFood({
                            name: item.name,
                            location: item.location || '',
                            cuisine: item.cuisine || '',
                            link: item.link || '',
                            notes: item.notes || ''
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteFood(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button 
              className="close-modal-button"
              onClick={() => {
                setShowFoodModal(false);
                setEditingFood(null);
                setNewFood({ name: '', location: '', cuisine: '', link: '', notes: '' });
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Decisions Modal */}
      {showDecisionsModal && (
        <div className="modal-overlay" onClick={() => {
          setShowDecisionsModal(false);
          setEditingDecision(null);
          setNewDecision({ title: '', description: '', status: 'pending', decision: '' });
        }}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Decisions</h2>
            <form onSubmit={handleCreateDecision}>
              <div className="form-group">
                <label htmlFor="decision-title">Title</label>
                <input
                  type="text"
                  id="decision-title"
                  value={newDecision.title}
                  onChange={(e) => setNewDecision({ ...newDecision, title: e.target.value })}
                  placeholder="e.g., Should we rent a car?"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="decision-description">Description</label>
                <textarea
                  id="decision-description"
                  value={newDecision.description}
                  onChange={(e) => setNewDecision({ ...newDecision, description: e.target.value })}
                  placeholder="What needs to be decided?"
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="decision-status">Status</label>
                  <select
                    id="decision-status"
                    value={newDecision.status}
                    onChange={(e) => setNewDecision({ ...newDecision, status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="decided">Decided</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              {newDecision.status !== 'pending' && (
                <div className="form-group">
                  <label htmlFor="decision-decision">Decision</label>
                  <textarea
                    id="decision-decision"
                    value={newDecision.decision}
                    onChange={(e) => setNewDecision({ ...newDecision, decision: e.target.value })}
                    placeholder="What was decided?"
                    rows="2"
                  />
                </div>
              )}
              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setEditingDecision(null);
                    setNewDecision({ title: '', description: '', status: 'pending', decision: '' });
                  }}
                >
                  Clear
                </button>
                <button type="submit" className="submit-button">
                  {editingDecision ? 'Update' : 'Add'} Decision
                </button>
              </div>
            </form>
            <div className="items-list">
              <h3>Saved Decisions ({decisions.length})</h3>
              {decisions.length === 0 ? (
                <p className="empty-message">No decisions added yet</p>
              ) : (
                decisions.map(item => (
                  <div key={item.id} className="item-card">
                    <div className="item-content">
                      <h4>{item.title}</h4>
                      {item.description && <p>{item.description}</p>}
                      <p>
                        <strong>Status:</strong>{' '}
                        <span className={`status-badge status-${item.status}`}>
                          {item.status}
                        </span>
                      </p>
                      {item.decision && (
                        <p><strong>Decision:</strong> {item.decision}</p>
                      )}
                    </div>
                    <div className="item-actions">
                      <button 
                        className="edit-button"
                        onClick={() => {
                          setEditingDecision(item);
                          setNewDecision({
                            title: item.title,
                            description: item.description || '',
                            status: item.status || 'pending',
                            decision: item.decision || ''
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteDecision(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button 
              className="close-modal-button"
              onClick={() => {
                setShowDecisionsModal(false);
                setEditingDecision(null);
                setNewDecision({ title: '', description: '', status: 'pending', decision: '' });
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
