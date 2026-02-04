# Collaboration & Tracking Setup

This guide explains how to set up multi-user collaboration on trips with tracking of who created/updated what.

## Features

- **Multiple users per trip**: Users can be added as members to any trip
- **Role-based access**: Trip owners can add/remove members; all members can view/edit
- **Creator/Updater tracking**: Every item tracks who created it and who last updated it
- **Automatic membership**: When you create a trip, you're automatically added as the owner

## Step 1: Run the SQL Migration

1. Go to your Supabase Dashboard → SQL Editor
2. Run the file `supabase/add-collaboration.sql`
3. This will:
   - Create `trip_users` junction table for many-to-many relationships
   - Add `created_by` and `updated_by` columns to all tables
   - Update RLS policies to allow trip members to access shared trips
   - Create triggers to automatically add trip owners

## Step 2: Backend Routes

The backend now includes these new routes:

### Trip Sharing
- `GET /api/trips/:tripId/members` - Get all members of a trip
- `POST /api/trips/:tripId/members` - Add a member by email (owners only)
- `DELETE /api/trips/:tripId/members/:userId` - Remove a member (owners only)

### Tracking
All create/update operations now automatically set:
- `created_by` - Set to current user ID when creating
- `updated_by` - Set to current user ID when updating

## Step 3: How It Works

### Creating a Trip
When you create a trip:
1. The trip is created with `created_by` set to your user ID
2. A trigger automatically adds you to `trip_users` as the owner
3. You can now add other users as members

### Adding Members
Only trip owners can add members:
```javascript
POST /api/trips/:tripId/members
{
  "email": "friend@example.com"
}
```

The system will:
1. Find the user by email
2. Add them to `trip_users` as a 'member'
3. They can now view and edit the trip

### Tracking Changes
Every time someone creates or updates an item:
- `created_by` is set on creation
- `updated_by` is set on every update

You can query these fields to show:
- "Created by: John Doe"
- "Last updated by: Jane Smith"

## Step 4: Frontend Updates (TODO)

To fully utilize collaboration, you'll want to add:

1. **Trip sharing UI**:
   - Button to "Share Trip"
   - Input to add members by email
   - List of current members
   - Remove member button (for owners)

2. **Creator/Updater display**:
   - Show who created each item
   - Show who last updated each item
   - Fetch user profiles to show names instead of IDs

3. **Member list**:
   - Display all trip members
   - Show roles (owner/member)
   - Highlight current user

## Example: Adding a Member

```javascript
// In your frontend
const addMember = async (tripId, email) => {
  try {
    await api.post(`/api/trips/${tripId}/members`, { email });
    // Refresh trip members list
    fetchMembers(tripId);
  } catch (error) {
    console.error('Error adding member:', error);
  }
};
```

## Example: Displaying Creator Info

```javascript
// Fetch item with creator profile
const { data } = await supabase
  .from('lodging_info')
  .select(`
    *,
    creator:created_by (
      email,
      full_name
    ),
    updater:updated_by (
      email,
      full_name
    )
  `)
  .eq('trip_id', tripId);

// Display
<p>Created by: {item.creator?.full_name || item.creator?.email}</p>
<p>Last updated by: {item.updater?.full_name || item.updater?.email}</p>
```

## Security

- RLS policies ensure users can only access trips they're members of
- Only owners can add/remove members
- Only owners can delete trips
- All members can create/edit items
- Creator/updater tracking is automatic and cannot be spoofed

## Migration Notes

Existing trips will be migrated:
- All existing trips with `user_id` will have their owner added to `trip_users`
- The `user_id` column on trips is kept for backward compatibility but `created_by` is now the source of truth
