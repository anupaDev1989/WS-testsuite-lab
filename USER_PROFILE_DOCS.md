# User Profile Feature Documentation

This document provides an overview of the User Profile feature implemented in the Test Suite Lab application, including the database schema, API endpoints, and frontend components.

## Overview

The User Profile feature allows users to:
- View their profile information (email)
- Save and update their city information
- Save LLM responses as "Trips"
- View, manage, and delete saved trips

All data is stored in Cloudflare D1 database and protected by authentication middleware.

## Database Schema

The feature uses three tables in the Cloudflare D1 database:

### 1. user_profiles
```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,  -- Matches Supabase user ID
  email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. user_saved_info
```sql
CREATE TABLE IF NOT EXISTS user_saved_info (
  id TEXT PRIMARY KEY DEFAULT (UUID-like function),
  user_id TEXT NOT NULL,
  city TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);
```

### 3. saved_trips
```sql
CREATE TABLE IF NOT EXISTS saved_trips (
  id TEXT PRIMARY KEY DEFAULT (UUID-like function),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  data TEXT NOT NULL,  -- Store as TEXT, will be stringified JSON
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);
```

## API Endpoints

All endpoints are protected by authentication middleware that validates the Supabase JWT token.

### Profile Endpoints

#### GET /api/profile
- **Description**: Get the user's profile information
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "profile": {
      "user_id": "string",
      "email": "string",
      "city": "string",
      "created_at": "string"
    }
  }
  ```

#### PATCH /api/profile
- **Description**: Update the user's city information
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "city": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true
  }
  ```

### Trips Endpoints

#### GET /api/trips
- **Description**: Get all saved trips for the user
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "trips": [
      {
        "id": "string",
        "title": "string",
        "data": {}, // JSON object
        "created_at": "string",
        "updated_at": "string"
      }
    ]
  }
  ```

#### POST /api/trips
- **Description**: Save a new trip
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "title": "string",
    "data": {} // JSON object
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "id": "string"
  }
  ```

#### GET /api/trips/:id
- **Description**: Get a specific trip by ID
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "trip": {
      "id": "string",
      "title": "string",
      "data": {}, // JSON object
      "created_at": "string",
      "updated_at": "string"
    }
  }
  ```

#### DELETE /api/trips/:id
- **Description**: Delete a specific trip by ID
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true
  }
  ```

## Frontend Components

### ProfilePage
The main profile page component that displays:
- User's email address (read-only)
- City input field with save button
- Saved trips section

### SavedTripsSection
A component that displays:
- List of saved trips with title and date
- Buttons to view and delete trips
- Dialog to save new trips

## Integration with LLM Responses

The LLM response component has been updated to:
1. Store the current LLM response in the LLM context
2. Add a "Save Trip" button that navigates to the profile page
3. Parse JSON responses when possible

## How to Use

1. Log in to the application
2. Navigate to the Profile page using the navigation bar
3. View your email and update your city information
4. Use the Workflow Test page to generate LLM responses
5. Click the "Save Trip" button to save the response
6. View and manage your saved trips on the Profile page

## Deployment

To deploy the user profile feature:

1. Create the D1 database:
   ```
   npx wrangler d1 create test_suite_db
   ```

2. Update the `wrangler.toml` file with the database ID:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "test_suite_db"
   database_id = "your-database-id"
   ```

3. Apply the database migrations:
   ```
   npx wrangler d1 execute test_suite_db --file=./migrations/0001_user_profiles.sql
   ```

4. Deploy the worker:
   ```
   npx wrangler deploy
   ```

## Security Considerations

- All API endpoints are protected by authentication middleware
- Database queries are scoped by user ID to prevent unauthorized access
- JWT tokens are validated with Supabase
- No sensitive information is stored in client-side code
