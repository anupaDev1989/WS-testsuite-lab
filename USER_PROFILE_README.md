# User Profile Feature

## Overview

The User Profile feature allows users to manage their profile information and save LLM responses as "trips" for future reference. All data is stored in Cloudflare D1 database and protected by authentication middleware.

## Features

- **User Profile Management**
  - View user email (read-only)
  - Save and update city information
  - Secure data storage in Cloudflare D1

- **Saved Trips**
  - Save LLM responses with custom titles
  - View saved trips in a list
  - View trip details in a modal
  - Delete unwanted trips
  - Automatic timestamps for creation and updates

## Technical Implementation

### Backend

- **Database**: Cloudflare D1
- **Tables**:
  - `user_profiles`: Stores user ID and email
  - `user_saved_info`: Stores city information
  - `saved_trips`: Stores saved LLM responses as JSON

- **API Endpoints**:
  - `GET /api/profile`: Get user profile information
  - `PATCH /api/profile`: Update user profile information
  - `GET /api/trips`: Get all saved trips
  - `POST /api/trips`: Save a new trip
  - `GET /api/trips/:id`: Get a specific trip
  - `DELETE /api/trips/:id`: Delete a specific trip

### Frontend

- **Components**:
  - `ProfilePage`: Main profile page component
  - `SavedTripsSection`: Component for managing saved trips
  - Error and success notification components

- **State Management**:
  - React Query for server state
  - LLM Context for sharing LLM responses across components
  - Authentication hooks for secure access

## Getting Started

### Prerequisites

- Cloudflare account with Workers and D1 access
- Supabase account for authentication
- Node.js and npm

### Setup

1. **Database Setup**:
   ```bash
   # Create D1 database
   npx wrangler d1 create test_suite_db
   
   # Apply migrations
   npx wrangler d1 execute test_suite_db --file=./migrations/0001_user_profiles.sql
   ```

2. **Configuration**:
   Update `wrangler.toml` with your D1 database ID:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "test_suite_db"
   database_id = "your-database-id"
   ```

3. **Deployment**:
   ```bash
   # Deploy with the provided script
   cd BACKEND/testsuite-worker
   npm run deploy-profile
   ```

## Usage

1. **Access Profile**:
   - Log in to the application
   - Click on the Profile icon in the navigation bar

2. **Update Profile**:
   - Enter your city in the input field
   - Click Save

3. **Save Trips**:
   - Generate an LLM response in the application
   - Click "Save Trip" on the LLM response
   - Enter a title for the trip
   - Click Save

4. **View Saved Trips**:
   - Go to your Profile page
   - Scroll down to the Saved Trips section
   - Click on a trip to view details

5. **Delete Trips**:
   - Go to your Profile page
   - Find the trip you want to delete
   - Click the Delete button

## Troubleshooting

- **Profile Not Loading**: Ensure you're logged in and your token is valid
- **Can't Save Trip**: Make sure you have an active LLM response to save
- **Database Errors**: Check Cloudflare D1 console for database status

## Future Enhancements

- Add pagination for saved trips
- Implement search functionality for trips
- Add more profile fields (name, preferences, etc.)
- Add trip sharing functionality
- Implement trip categories or tags
