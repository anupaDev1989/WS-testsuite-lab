import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const profileApp = new Hono();

// --- Zod Schemas for Validation ---
const tripSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.any(), // Assuming content is a JSON object from the LLM
  city: z.string().optional(),
});

const updateProfileSchema = z.object({
  city: z.string().min(1, 'City is required'),
});

// --- Helper function to get or create user profile ---
const getOrCreateUserProfile = async (db, user) => {
  console.log('[getOrCreateUserProfile] Called with user:', JSON.stringify(user, null, 2));
  if (!user || !user.id) {
    console.error('[getOrCreateUserProfile] CRITICAL: User object is invalid or missing ID. User:', JSON.stringify(user, null, 2));
    throw new Error('User data is invalid for profile creation.');
  }
  // First, try to find the user
  console.log(`[getOrCreateUserProfile] Attempting to find profile for user_id: ${user.id}`);
  let profile = await db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').bind(user.id).first();
  console.log('[getOrCreateUserProfile] Existing profile found:', JSON.stringify(profile, null, 2));

  // If user doesn't exist, create a new profile
  if (!profile) {
    console.log(`[getOrCreateUserProfile] No existing profile found for user_id: ${user.id}. Attempting to create one.`);
    if (!user.email) {
      console.warn(`[getOrCreateUserProfile] User email is missing for user_id: ${user.id}. Proceeding with null email.`);
    }
    const insertStatement = db.prepare('INSERT INTO user_profiles (user_id, email) VALUES (?, ?)');
    console.log(`[getOrCreateUserProfile] Prepared INSERT statement. Binding user_id: ${user.id}, email: ${user.email || null}`);
    const insertResult = await insertStatement.bind(user.id, user.email || null).run();
    console.log('[getOrCreateUserProfile] INSERT result:', JSON.stringify(insertResult, null, 2));

    if (!insertResult.success) {
      console.error('[getOrCreateUserProfile] ERROR: Failed to insert new profile. Details:', JSON.stringify(insertResult.error || 'No error details provided', null, 2));
      // Attempt to log meta if available, which might contain more specific D1 errors
      if (insertResult.meta) {
        console.error('[getOrCreateUserProfile] INSERT meta:', JSON.stringify(insertResult.meta, null, 2));
      }
      throw new Error(`Failed to create profile for user_id: ${user.id}. D1 Error: ${insertResult.error || 'Unknown D1 error'}`);
    }
    console.log(`[getOrCreateUserProfile] Successfully inserted new profile for user_id: ${user.id}.`);
    profile = await db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').bind(user.id).first();
    console.log('[getOrCreateUserProfile] Fetched profile after creation:', JSON.stringify(profile, null, 2));
  }
  
  // Also fetch the most recent city from user's saved trips
  if (profile) { // Ensure profile exists before trying to attach city
    console.log(`[getOrCreateUserProfile] Fetching most recent city for user_id: ${user.id}`);
    const savedInfo = await db.prepare('SELECT city FROM user_saved_info WHERE user_id = ? AND city IS NOT NULL ORDER BY created_at DESC LIMIT 1').bind(user.id).first();
    profile.city = savedInfo ? savedInfo.city : null;
    console.log(`[getOrCreateUserProfile] City for user_id ${user.id}: ${profile.city}`);
  } else {
    console.error(`[getOrCreateUserProfile] CRITICAL: Profile is null for user_id: ${user.id} even after creation attempt. Cannot fetch city.`);
    // This case should ideally not be reached if insert was successful and re-fetch worked.
    // If it is, it indicates a more fundamental issue.
    throw new Error('Profile could not be established, cannot proceed to fetch city.');
  }

  console.log('[getOrCreateUserProfile] Returning profile:', JSON.stringify(profile, null, 2));
  return profile;
};


// --- Profile Routes ---

// GET /api/profile/me - Get user profile
profileApp.get('/api/profile/me', async (c) => {
  const user = c.get('user');
  const db = c.env.DB;

  try {
    const profile = await getOrCreateUserProfile(db, user);
    return c.json({ success: true, data: profile });
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return c.json({ success: false, error: 'Failed to retrieve user profile' }, 500);
  }
});

// --- Trips Routes (LLM Responses) ---

// GET /api/trips - Get all trips for a user
profileApp.get('/api/trips', async (c) => {
  const user = c.get('user');
  const db = c.env.DB;

  try {
    const { results } = await db
      .prepare('SELECT id, title, city, created_at FROM user_saved_info WHERE user_id = ? ORDER BY created_at DESC')
      .bind(user.id)
      .all();
    return c.json({ success: true, data: results || [] });
  } catch (error) {
    console.error('Failed to get trips:', error);
    return c.json({ success: false, error: 'Failed to retrieve trips' }, 500);
  }
});

// GET /api/trips/:id - Get a single trip
profileApp.get('/api/trips/:id', async (c) => {
    const user = c.get('user');
    const { id } = c.req.param();
    const db = c.env.DB;

    try {
        const trip = await db
            .prepare('SELECT * FROM user_saved_info WHERE id = ? AND user_id = ?')
            .bind(id, user.id)
            .first();

        if (!trip) {
            return c.json({ success: false, error: 'Trip not found' }, 404);
        }
        
        try {
            trip.content = JSON.parse(trip.content);
        } catch (e) { /* Ignore if not valid JSON */ }

        return c.json({ success: true, data: trip });
    } catch (error) {
        console.error(`Failed to get trip ${id}:`, error);
        return c.json({ success: false, error: 'Failed to retrieve trip' }, 500);
    }
});

// POST /api/trips - Save a new trip
profileApp.post('/api/trips', zValidator('json', tripSchema), async (c) => {
  const user = c.get('user');
  const { title, content, city } = c.req.valid('json');
  const db = c.env.DB;

  try {
    const contentString = JSON.stringify(content);
    const id = crypto.randomUUID();

    await db
      .prepare('INSERT INTO user_saved_info (id, user_id, title, content, city) VALUES (?, ?, ?, ?, ?)')
      .bind(id, user.id, title, contentString, city)
      .run();
    
    const newTrip = { id, user_id: user.id, title, content, city };
    return c.json({ success: true, data: newTrip }, 201);
  } catch (error) {
    console.error('Failed to save trip:', error);
    return c.json({ success: false, error: 'Failed to save trip' }, 500);
  }
});

// DELETE /api/trips/:id - Delete a trip
profileApp.delete('/api/trips/:id', async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const db = c.env.DB;

  try {
    const { meta } = await db
      .prepare('DELETE FROM user_saved_info WHERE id = ? AND user_id = ?')
      .bind(id, user.id)
      .run();

    if (meta.changes === 0) {
      return c.json({ success: false, error: 'Trip not found' }, 404);
    }

    return c.json({ success: true, message: 'Trip deleted successfully' });
  } catch (error) {
    console.error(`Failed to delete trip ${id}:`, error);
    return c.json({ success: false, error: 'Failed to delete trip' }, 500);
  }
});

export default profileApp;
