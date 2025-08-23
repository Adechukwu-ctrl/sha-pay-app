require('dotenv').config();
const fetch = require('node-fetch');

// Configuration from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_BASE_URL || 'ws://localhost:3000';
const ENVIRONMENT = process.env.EXPO_PUBLIC_ENVIRONMENT || 'development';

console.log('=== Frontend-Backend Integration Test ===');
console.log(`Environment: ${ENVIRONMENT}`);
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`WebSocket URL: ${WS_BASE_URL}`);
console.log('==========================================\n');

// Test functions
async function testHealthCheck() {
  console.log('1. Testing Backend Health Check...');
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Backend is healthy');
      console.log(`   Status: ${data.status}`);
      console.log(`   Environment: ${data.environment}`);
      console.log(`   Uptime: ${data.uptime}s\n`);
      return true;
    } else {
      console.log('❌ Backend health check failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data)}\n`);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend health check error:');
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

async function testAPIEndpoints() {
  console.log('2. Testing API Endpoints Availability...');
  
  const endpoints = [
    '/auth/login',
    '/auth/register',
    '/users/profile',
    '/jobs',
    '/payments',
    '/chat/conversations'
  ];
  
  let availableEndpoints = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // We expect 401 for protected routes, 405 for wrong methods, etc.
      // Any response (not network error) means endpoint exists
      console.log(`   ${endpoint}: ✅ Available (${response.status})`);
      availableEndpoints++;
    } catch (error) {
      console.log(`   ${endpoint}: ❌ Not available (${error.message})`);
    }
  }
  
  console.log(`\n   Summary: ${availableEndpoints}/${endpoints.length} endpoints available\n`);
  return availableEndpoints > 0;
}

async function testAuthenticationFlow() {
  console.log('3. Testing Authentication Flow...');
  
  // Test user data
  const testUser = {
    email: `test.integration.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Integration',
    lastName: 'Test',
    phoneNumber: '+2348012345678'
  };
  
  try {
    // Test registration
    console.log('   Testing user registration...');
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const registerData = await registerResponse.json();
    
    if (registerResponse.ok) {
      console.log('   ✅ Registration successful');
      console.log(`      User ID: ${registerData.user?.id}`);
      console.log(`      Email: ${registerData.user?.email}`);
    } else {
      console.log('   ⚠️  Registration response:');
      console.log(`      Status: ${registerResponse.status}`);
      console.log(`      Message: ${registerData.message}`);
      console.log(`      Error Code: ${registerData.errorCode}`);
      
      // If registration fails due to rate limiting, try login with existing user
      if (registerData.errorCode === 'RATE_LIMIT_EXCEEDED') {
        console.log('   Attempting login with existing test user...');
        testUser.email = 'test.user@example.com';
      }
    }
    
    // Test login
    console.log('   Testing user login...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (loginResponse.ok) {
      console.log('   ✅ Login successful');
      console.log(`      Token received: ${loginData.token ? 'Yes' : 'No'}`);
      console.log(`      User ID: ${loginData.user?.id}`);
      
      // Test authenticated request
      if (loginData.token) {
        console.log('   Testing authenticated request...');
        const profileResponse = await fetch(`${API_BASE_URL}/users/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('   ✅ Authenticated request successful');
          console.log(`      Profile loaded: ${profileData.user?.email}`);
        } else {
          console.log('   ❌ Authenticated request failed');
          console.log(`      Status: ${profileResponse.status}`);
        }
      }
      
      return true;
    } else {
      console.log('   ❌ Login failed');
      console.log(`      Status: ${loginResponse.status}`);
      console.log(`      Message: ${loginData.message}`);
      console.log(`      Error Code: ${loginData.errorCode}`);
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ Authentication flow error:');
    console.log(`      Error: ${error.message}`);
    return false;
  }
}

async function testEnvironmentConfiguration() {
  console.log('4. Testing Environment Configuration...');
  
  const requiredEnvVars = [
    'EXPO_PUBLIC_API_BASE_URL',
    'EXPO_PUBLIC_WS_BASE_URL',
    'EXPO_PUBLIC_ENVIRONMENT',
    'EXPO_PUBLIC_DEBUG_MODE'
  ];
  
  let configuredVars = 0;
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      console.log(`   ${envVar}: ✅ ${value}`);
      configuredVars++;
    } else {
      console.log(`   ${envVar}: ❌ Not set`);
    }
  }
  
  console.log(`\n   Summary: ${configuredVars}/${requiredEnvVars.length} environment variables configured\n`);
  return configuredVars === requiredEnvVars.length;
}

// Run all tests
async function runIntegrationTests() {
  console.log('Starting comprehensive frontend-backend integration tests...\n');
  
  const results = {
    healthCheck: await testHealthCheck(),
    apiEndpoints: await testAPIEndpoints(),
    authentication: await testAuthenticationFlow(),
    environment: await testEnvironmentConfiguration()
  };
  
  console.log('\n=== Integration Test Results ===');
  console.log(`Health Check: ${results.healthCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`API Endpoints: ${results.apiEndpoints ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Authentication: ${results.authentication ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Environment Config: ${results.environment ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All integration tests passed! Frontend-backend integration is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the issues above.');
  }
  
  console.log('================================\n');
}

// Run the tests
runIntegrationTests().catch(console.error);