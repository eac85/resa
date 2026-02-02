import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

// Configure axios base URL
const api = axios.create({
  baseURL: 'http://localhost:5001',
});

const tripTitles = [
  "let's goooooo",
  "passport szn",
  "jet set baby",
  "out of office incoming",
  "reality: paused",
  "normalize having fun",
  "treat yourself era",
  "escape plan activated"
];

function App() {
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
  const [lodging, setLodging] = useState([]);
  const [activities, setActivities] = useState([]);
  const [food, setFood] = useState([]);
  const [editingLodging, setEditingLodging] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);
  const [editingFood, setEditingFood] = useState(null);
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
    notes: ''
  });
  const [newFood, setNewFood] = useState({
    name: '',
    location: '',
    cuisine: '',
    link: '',
    notes: ''
  });

  // Set random title on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * tripTitles.length);
    setRandomTitle(tripTitles[randomIndex]);
  }, []);

  // Fetch all trips on mount
  useEffect(() => {
    fetchTrips();
  }, []);

  // Fetch days when trip changes
  useEffect(() => {
    if (currentTrip) {
      fetchDaysForTrip(currentTrip.id);
      fetchLodging();
      fetchFood();
      fetchActivities();
    }
  }, [currentTrip]);

  const fetchTrips = async () => {
    try {
      const response = await api.get('/api/trips');
      setTrips(response.data);
      if (response.data.length > 0 && !currentTrip) {
        setCurrentTrip(response.data[0]);
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
  };

  const fetchDaysForTrip = async (tripId) => {
    try {
      // First, get the trip to know the date range
      const tripResponse = await api.get(`/api/trips/${tripId}`);
      const trip = tripResponse.data;
      
      // Fetch existing days
      const daysResponse = await api.get(`/api/trips/${tripId}/days`);
      const daysData = daysResponse.data;
      
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
          // Show month abbreviation if different from first day's month
          const monthLabel = monthIndex !== firstDayMonth ? date.toLocaleDateString('en-US', { month: 'short' }) : '';
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
          // Show month abbreviation if different from first day's month
          const monthLabel = monthIndex !== firstDayMonth ? date.toLocaleDateString('en-US', { month: 'short' }) : '';
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
    const updatedDays = days.map(d => ({
      ...d,
      selected: d.date === day.date
    }));
    setDays(updatedDays);
    
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
        const updatedDays = days.map(d => 
          d.id === dayData.id ? { ...d, plan } : d
        );
        setDays(updatedDays);
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

  // Lodging functions
  const fetchLodging = async () => {
    if (!currentTrip) return;
    try {
      const response = await api.get(`/api/trips/${currentTrip.id}/lodging`);
      setLodging(response.data);
    } catch (error) {
      console.error('Error fetching lodging:', error);
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

  // Activities functions
  const fetchActivities = async () => {
    if (!currentTrip) return;
    try {
      const response = await api.get(`/api/trips/${currentTrip.id}/activities`);
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
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
      setNewActivity({ name: '', location: '', notes: '' });
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

  // Food functions
  const fetchFood = async () => {
    if (!currentTrip) return;
    try {
      const response = await api.get(`/api/trips/${currentTrip.id}/food`);
      setFood(response.data);
    } catch (error) {
      console.error('Error fetching food:', error);
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

  return (
    <div className="app">
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
                {trips.map(trip => (
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
              {days.map((day) => (
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
              Lodging Info {lodging.length > 0 && `(${lodging.length})`}
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
              Activity Research {activities.length > 0 && `(${activities.length})`}
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
              Food Research {food.length > 0 && `(${food.length})`}
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
                lodging.map(item => (
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
          setNewActivity({ name: '', location: '', notes: '' });
        }}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Activity Research</h2>
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
                    setNewActivity({ name: '', location: '', notes: '' });
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
                      <h4>{item.name}</h4>
                      {item.location && <p><strong>Location:</strong> {item.location}</p>}
                      {item.notes && <p>{item.notes}</p>}
                    </div>
                    <div className="item-actions">
                      <button 
                        className="edit-button"
                        onClick={() => {
                        setEditingActivity(item);
                        setNewActivity({
                          name: item.name,
                          location: item.location || '',
                          notes: item.notes || ''
                        });
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteActivity(item.id)}
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
                setShowActivitiesModal(false);
                setEditingActivity(null);
                setNewActivity({ name: '', location: '', notes: '' });
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
                food.map(item => (
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
    </div>
  );
}

export default App;
