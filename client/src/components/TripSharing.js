import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../config/supabase';

// Configure axios (same as in App.js)
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? '' 
    : (process.env.REACT_APP_API_URL || 'http://localhost:5001'),
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

function TripSharing({ tripId, isOwner, onMemberAdded }) {
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tripId) {
      fetchMembers();
    }
    if (isOwner) {
      fetchAllUsers();
    }
  }, [tripId, isOwner]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      // Filter users by search query
      const filtered = allUsers.filter(user => {
        const email = user.email?.toLowerCase() || '';
        const name = user.full_name?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return email.includes(query) || name.includes(query);
      });
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(allUsers);
    }
  }, [searchQuery, allUsers]);

  const fetchAllUsers = async () => {
    try {
      const response = await api.get('/api/users');
      setAllUsers(response.data || []);
      setFilteredUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/api/trips/${tripId}/members`);
      setMembers(response.data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Failed to load members');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setLoading(true);
    setError('');

    try {
      await api.post(`/api/trips/${tripId}/members`, {
        userId: selectedUserId
      });
      setSelectedUserId('');
      setSearchQuery('');
      setShowAddMember(false);
      fetchMembers(); // Refresh the list
      if (onMemberAdded) onMemberAdded(); // Notify parent component
    } catch (error) {
      console.error('Error adding member:', error);
      setError(error.response?.data?.error || 'Failed to add member.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await api.delete(`/api/trips/${tripId}/members/${userId}`);
      fetchMembers(); // Refresh the list
      if (onMemberAdded) onMemberAdded(); // Notify parent component
    } catch (error) {
      console.error('Error removing member:', error);
      alert(error.response?.data?.error || 'Failed to remove member');
    }
  };

  // Always show the full UI, but conditionally show the add button
  // This helps with debugging and ensures the component always renders

  return (
    <>
      <div className="trip-sharing">
        <div className="trip-sharing-header">
          <h3>Trip Members {!isOwner && '(View Only)'}</h3>
          {isOwner && (
            <button 
              className="add-member-button"
              onClick={() => setShowAddMember(true)}
            >
              + Add Member
            </button>
          )}
        </div>

        {/* Always show members list */}
        {members.length === 0 ? (
          <p className="no-members-message">No members yet. Add someone to collaborate!</p>
        ) : (
          <ul className="members-list">
            {members.map((member) => (
              <li key={member.id} className="member-item">
                <span>
                  {member.profiles?.full_name || member.profiles?.email || 'Unknown User'}
                  {member.role === 'owner' && ' (Owner)'}
                </span>
                {member.role !== 'owner' && isOwner && (
                  <button
                    className="remove-member-button"
                    onClick={() => handleRemoveMember(member.user_id)}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="modal-overlay" onClick={() => {
          setShowAddMember(false);
          setSelectedUserId('');
          setSearchQuery('');
          setError('');
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Add Member to Trip</h2>
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label htmlFor="user-search">Search Users</label>
                <input
                  type="text"
                  id="user-search"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="user-search-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="user-select">Select User</label>
                <select
                  id="user-select"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="user-select-dropdown"
                  required
                >
                  <option value="">Select a user...</option>
                  {filteredUsers
                    .filter(user => !members.some(m => m.user_id === user.id)) // Exclude existing members
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.email} {user.email && user.full_name ? `(${user.email})` : ''}
                      </option>
                    ))}
                </select>
                {filteredUsers.length === 0 && searchQuery && (
                  <p className="no-users-message">No users found matching "{searchQuery}"</p>
                )}
                {filteredUsers.length > 0 && filteredUsers.filter(user => !members.some(m => m.user_id === user.id)).length === 0 && (
                  <p className="no-users-message">All users are already members of this trip</p>
                )}
              </div>
              {error && <p className="error-message">{error}</p>}
              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setShowAddMember(false);
                    setSelectedUserId('');
                    setSearchQuery('');
                    setError('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={loading || !selectedUserId}
                >
                  {loading ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default TripSharing;
