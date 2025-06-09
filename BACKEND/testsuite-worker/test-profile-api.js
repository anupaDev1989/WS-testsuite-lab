// Test script for User Profile API endpoints
// Run with: node test-profile-api.js

const API_URL = 'http://localhost:8787'; // Change to your worker URL
const TEST_TOKEN = 'YOUR_TEST_TOKEN'; // Replace with a valid Supabase JWT token

// Helper function for API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  };
  
  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  };
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error with ${method} ${endpoint}:`, error);
    return { status: 500, error: error.message };
  }
}

// Test functions
async function testGetProfile() {
  console.log('\n🧪 Testing GET /api/profile');
  const result = await apiRequest('/api/profile');
  console.log(`Status: ${result.status}`);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result;
}

async function testUpdateProfile() {
  console.log('\n🧪 Testing PATCH /api/profile');
  const city = `Test City ${new Date().toISOString()}`;
  const result = await apiRequest('/api/profile', 'PATCH', { city });
  console.log(`Status: ${result.status}`);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result;
}

async function testSaveTrip() {
  console.log('\n🧪 Testing POST /api/trips');
  const title = `Test Trip ${new Date().toISOString()}`;
  const data = {
    destination: 'Paris',
    duration: '7 days',
    activities: ['Eiffel Tower', 'Louvre Museum', 'Seine River Cruise'],
    timestamp: new Date().toISOString()
  };
  
  const result = await apiRequest('/api/trips', 'POST', { title, data });
  console.log(`Status: ${result.status}`);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result;
}

async function testGetTrips() {
  console.log('\n🧪 Testing GET /api/trips');
  const result = await apiRequest('/api/trips');
  console.log(`Status: ${result.status}`);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result;
}

async function testGetSpecificTrip(tripId) {
  console.log(`\n🧪 Testing GET /api/trips/${tripId}`);
  const result = await apiRequest(`/api/trips/${tripId}`);
  console.log(`Status: ${result.status}`);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result;
}

async function testDeleteTrip(tripId) {
  console.log(`\n🧪 Testing DELETE /api/trips/${tripId}`);
  const result = await apiRequest(`/api/trips/${tripId}`, 'DELETE');
  console.log(`Status: ${result.status}`);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result;
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting User Profile API tests...');
  
  // Test profile endpoints
  await testGetProfile();
  await testUpdateProfile();
  await testGetProfile(); // Verify update
  
  // Test trips endpoints
  const saveResult = await testSaveTrip();
  const tripId = saveResult.data?.id;
  
  if (tripId) {
    await testGetTrips();
    await testGetSpecificTrip(tripId);
    await testDeleteTrip(tripId);
    await testGetTrips(); // Verify deletion
  } else {
    console.error('❌ Failed to create trip, skipping trip-specific tests');
  }
  
  console.log('\n✅ All tests completed!');
}

// Execute tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
});
