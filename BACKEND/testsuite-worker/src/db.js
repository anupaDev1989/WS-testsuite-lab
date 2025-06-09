/**
 * Database service for user profiles and saved trips
 * Uses Cloudflare D1 database
 */
export class DatabaseService {
  constructor(env) {
    this.db = env.DB;
  }

  /**
   * Get a user profile by ID
   * @param {string} userId - The user ID from Supabase auth
   * @returns {Promise<Object|null>} User profile with saved info
   */
  async getUserProfile(userId) {
    try {
      // First check if user exists, if not create the profile
      const userExists = await this.db.prepare(
        `SELECT user_id FROM user_profiles WHERE user_id = ?`
      ).bind(userId).first();

      // Get user profile with saved info
      const profile = await this.db.prepare(
        `SELECT up.user_id, up.email, up.created_at, usi.city
         FROM user_profiles up
         LEFT JOIN user_saved_info usi ON up.user_id = usi.user_id
         WHERE up.user_id = ?`
      ).bind(userId).first();
      
      return profile || null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Create or update user profile
   * @param {string} userId - The user ID from Supabase auth
   * @param {string} email - User's email address
   * @returns {Promise<Object>} Result of the operation
   */
  async createOrUpdateProfile(userId, email) {
    try {
      await this.db.prepare(
        `INSERT INTO user_profiles (user_id, email)
         VALUES (?, ?)
         ON CONFLICT(user_id) DO UPDATE SET 
         email = excluded.email,
         updated_at = CURRENT_TIMESTAMP`
      ).bind(userId, email).run();

      return { success: true };
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      throw error;
    }
  }

  /**
   * Update user's city information
   * @param {string} userId - The user ID from Supabase auth
   * @param {string} city - City name to save
   * @returns {Promise<Object>} Result of the operation
   */
  async updateUserCity(userId, city) {
    try {
      // First ensure the user profile exists
      await this.createOrUpdateProfile(userId, ''); // Email will be updated later if needed
      
      // Check if user has saved info
      const savedInfo = await this.db.prepare(
        `SELECT id FROM user_saved_info WHERE user_id = ?`
      ).bind(userId).first();

      if (savedInfo) {
        // Update existing record
        await this.db.prepare(
          `UPDATE user_saved_info
           SET city = ?, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ?`
        ).bind(city, userId).run();
      } else {
        // Create new record
        await this.db.prepare(
          `INSERT INTO user_saved_info (user_id, city)
           VALUES (?, ?)`
        ).bind(userId, city).run();
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating user city:', error);
      throw error;
    }
  }

  /**
   * Save a trip for a user
   * @param {string} userId - The user ID from Supabase auth
   * @param {Object} tripData - Trip data containing title and JSON data
   * @returns {Promise<Object>} Result with the new trip ID
   */
  async saveTrip(userId, { title, data }) {
    try {
      // First ensure the user profile exists
      await this.createOrUpdateProfile(userId, ''); // Email will be updated later if needed
      
      // Insert the trip
      const result = await this.db.prepare(
        `INSERT INTO saved_trips (user_id, title, data)
         VALUES (?, ?, ?)`
      ).bind(userId, title, JSON.stringify(data)).run();

      // Get the ID of the inserted trip
      const trip = await this.db.prepare(
        `SELECT id FROM saved_trips 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT 1`
      ).bind(userId).first();

      return { 
        success: true, 
        id: trip?.id 
      };
    } catch (error) {
      console.error('Error saving trip:', error);
      throw error;
    }
  }

  /**
   * Get all trips for a user
   * @param {string} userId - The user ID from Supabase auth
   * @returns {Promise<Array>} List of trips
   */
  async getTrips(userId) {
    try {
      const { results } = await this.db.prepare(
        `SELECT id, title, data, created_at, updated_at 
         FROM saved_trips 
         WHERE user_id = ?
         ORDER BY updated_at DESC`
      ).bind(userId).all();

      // Parse the JSON data
      return results.map(trip => ({
        ...trip,
        data: JSON.parse(trip.data)
      }));
    } catch (error) {
      console.error('Error fetching trips:', error);
      throw error;
    }
  }

  /**
   * Get a specific trip by ID
   * @param {string} tripId - The trip ID
   * @param {string} userId - The user ID from Supabase auth
   * @returns {Promise<Object|null>} Trip data or null if not found
   */
  async getTrip(tripId, userId) {
    try {
      const trip = await this.db.prepare(
        `SELECT id, title, data, created_at, updated_at 
         FROM saved_trips 
         WHERE id = ? AND user_id = ?`
      ).bind(tripId, userId).first();

      if (!trip) return null;

      return {
        ...trip,
        data: JSON.parse(trip.data)
      };
    } catch (error) {
      console.error('Error fetching trip:', error);
      throw error;
    }
  }

  /**
   * Delete a trip
   * @param {string} tripId - The trip ID
   * @param {string} userId - The user ID from Supabase auth
   * @returns {Promise<Object>} Result of the operation
   */
  async deleteTrip(tripId, userId) {
    try {
      const result = await this.db.prepare(
        `DELETE FROM saved_trips 
         WHERE id = ? AND user_id = ?`
      ).bind(tripId, userId).run();

      return { 
        success: true,
        deleted: result.meta.changes > 0
      };
    } catch (error) {
      console.error('Error deleting trip:', error);
      throw error;
    }
  }

  /**
   * Get all user profiles with trip counts (admin only)
   * @returns {Promise<Array>} List of all user profiles with trip counts
   */
  async getAllProfiles() {
    try {
      const { results } = await this.db.prepare(
        `SELECT 
           up.user_id, 
           up.email, 
           up.created_at, 
           usi.city,
           COUNT(st.id) as trip_count
         FROM user_profiles up
         LEFT JOIN user_saved_info usi ON up.user_id = usi.user_id
         LEFT JOIN saved_trips st ON up.user_id = st.user_id
         GROUP BY up.user_id
         ORDER BY up.created_at DESC`
      ).all();

      return results;
    } catch (error) {
      console.error('Error fetching all profiles:', error);
      throw error;
    }
  }
}
