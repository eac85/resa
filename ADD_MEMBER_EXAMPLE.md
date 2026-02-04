# How to Add Users to an Existing Trip

## Quick Answer

Use the API endpoint:
```
POST /api/trips/:tripId/members
```

With the request body:
```json
{
  "email": "friend@example.com"
```

## Requirements

- You must be **authenticated** (signed in)
- You must be the **trip owner** (only owners can add members)
- The user you're adding must have **already signed up** (they need an account)

## Example: Using cURL

```bash
curl -X POST http://localhost:5001/api/trips/YOUR_TRIP_ID/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{"email": "friend@example.com"}'
```

## Example: Using JavaScript/Frontend

```javascript
// Using axios (already configured in your app)
const addMember = async (tripId, email) => {
  try {
    const response = await api.post(`/api/trips/${tripId}/members`, {
      email: email
    });
    console.log('Member added:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding member:', error.response?.data);
    throw error;
  }
};

// Usage
await addMember('trip-id-here', 'friend@example.com');
```

## Example: Using React Component

I've created a `TripSharing` component for you at `client/src/components/TripSharing.js`.

To use it in your App.js:

```javascript
import TripSharing from './components/TripSharing';

// In your component, find where you display trip info
// Add this near your trip controls:

{currentTrip && (
  <TripSharing 
    tripId={currentTrip.id} 
    isOwner={true} // You'll need to check if current user is owner
  />
)}
```

## How to Check if User is Owner

You'll need to fetch the trip members and check the role:

```javascript
const [isOwner, setIsOwner] = useState(false);

useEffect(() => {
  const checkOwnership = async () => {
    if (!currentTrip || !user) return;
    
    try {
      const response = await api.get(`/api/trips/${currentTrip.id}/members`);
      const currentUserMember = response.data.find(
        m => m.user_id === user.id
      );
      setIsOwner(currentUserMember?.role === 'owner');
    } catch (error) {
      console.error('Error checking ownership:', error);
    }
  };
  
  checkOwnership();
}, [currentTrip, user]);
```

## What Happens When You Add a Member

1. The system looks up the user by email
2. If found, adds them to `trip_users` table with role 'member'
3. They can now:
   - View the trip
   - Create/edit days, lodging, activities, food, decisions
   - See all trip data
4. They cannot:
   - Add/remove other members (only owners can)
   - Delete the trip (only owners can)

## Getting All Members

To see who's on a trip:

```javascript
const getMembers = async (tripId) => {
  const response = await api.get(`/api/trips/${tripId}/members`);
  return response.data; // Array of members with profile info
};
```

## Removing a Member

Only owners can remove members:

```javascript
const removeMember = async (tripId, userId) => {
  await api.delete(`/api/trips/${tripId}/members/${userId}`);
};
```

## Important Notes

- The user must have **already created an account** before you can add them
- You add them by their **email address** (the one they used to sign up)
- If the email doesn't exist, you'll get an error: "User not found"
- Only trip **owners** can add/remove members
- The trip **creator** is automatically the owner
