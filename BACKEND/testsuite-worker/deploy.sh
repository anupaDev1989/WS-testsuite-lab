#!/bin/bash

# Deploy script for Test Suite Lab backend with D1 database

echo "🚀 Starting deployment process..."

# Step 1: Apply migrations to production D1 database
echo "📦 Applying database migrations to production..."
npx wrangler d1 execute test_suite_db --file=./migrations/0001_user_profiles.sql --remote

# Step 2: Deploy the worker
echo "🔄 Deploying worker to production..."
npx wrangler deploy

echo "✅ Deployment complete!"
echo "🌐 Your application is now live with the user profile feature."
