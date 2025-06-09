// Monitor script for User Profile API endpoints
// Run with: node monitor-profile-api.js

const API_URL = process.env.API_URL || 'http://localhost:8787'; // Change to your worker URL
const TEST_TOKEN = process.env.TEST_TOKEN || 'YOUR_TEST_TOKEN'; // Replace with a valid Supabase JWT token
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

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
    const startTime = Date.now();
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const data = await response.json();
    return { 
      status: response.status, 
      data,
      responseTime,
      success: response.ok
    };
  } catch (error) {
    console.error(`Error with ${method} ${endpoint}:`, error);
    return { 
      status: 500, 
      error: error.message,
      success: false
    };
  }
}

// Monitor functions
async function monitorGetProfile() {
  console.log('\n🔍 Monitoring GET /api/profile');
  const result = await apiRequest('/api/profile');
  
  if (result.success) {
    console.log(`✅ Status: ${result.status} | Response time: ${result.responseTime}ms`);
  } else {
    console.error(`❌ Status: ${result.status} | Error: ${result.error || 'Unknown error'}`);
  }
  
  return result;
}

async function monitorGetTrips() {
  console.log('\n🔍 Monitoring GET /api/trips');
  const result = await apiRequest('/api/trips');
  
  if (result.success) {
    console.log(`✅ Status: ${result.status} | Response time: ${result.responseTime}ms | Trip count: ${result.data.trips?.length || 0}`);
  } else {
    console.error(`❌ Status: ${result.status} | Error: ${result.error || 'Unknown error'}`);
  }
  
  return result;
}

// Run all monitors
async function runMonitors() {
  console.log(`🚀 Starting User Profile API monitoring at ${new Date().toISOString()}`);
  
  try {
    await monitorGetProfile();
    await monitorGetTrips();
  } catch (error) {
    console.error('❌ Monitor execution failed:', error);
  }
  
  console.log(`\n✅ Monitoring completed at ${new Date().toISOString()}`);
  console.log(`⏰ Next check in ${CHECK_INTERVAL / 1000 / 60} minutes`);
}

// Execute monitors periodically
console.log('📊 User Profile API Monitoring Service');
console.log(`🔗 API URL: ${API_URL}`);
console.log(`⏱️ Check interval: ${CHECK_INTERVAL / 1000 / 60} minutes`);

// Run immediately once
runMonitors();

// Then schedule periodic runs
setInterval(runMonitors, CHECK_INTERVAL);
