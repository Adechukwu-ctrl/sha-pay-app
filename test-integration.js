/**
 * Frontend-Backend Integration Test
 * Tests the authentication flow between frontend and backend
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000/api';

// Test user data matching frontend format
const testUser = {
  firstName: 'Integration',
  lastName: 'Test',
  email: 'integration.test@example.com',
  phone: '+2348012345678',
  password: 'TestPassword123!',
  confirmPassword: 'TestPassword123!',
  userType: 'provider',
  agreeToTerms: true,
  agreeToPrivacy: true
};

async function testRegistration() {
  console.log('🔍 Testing user registration...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Registration successful:', {
        success: data.success,
        userId: data.data?.user?.id,
        userType: data.data?.user?.userType,
        hasToken: !!data.data?.accessToken
      });
      return data.data?.accessToken;
    } else {
      console.log('❌ Registration failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    return null;
  }
}

async function testLogin() {
  console.log('\n🔍 Testing user login...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful:', {
        success: data.success,
        userId: data.data?.user?.id,
        userType: data.data?.user?.userType,
        hasToken: !!data.data?.accessToken
      });
      return data.data?.accessToken;
    } else {
      console.log('❌ Login failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return null;
  }
}

async function testAuthenticatedRequest(token) {
  console.log('\n🔍 Testing authenticated request...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Profile fetch successful:', {
        success: data.success,
        email: data.data?.user?.email,
        firstName: data.data?.user?.firstName,
        userType: data.data?.user?.userType
      });
      return true;
    } else {
      console.log('❌ Profile fetch failed:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Profile fetch error:', error.message);
    return false;
  }
}

async function runIntegrationTests() {
  console.log('🚀 Starting Frontend-Backend Integration Tests\n');
  
  // Test 1: Registration
  const registrationToken = await testRegistration();
  
  // Test 2: Login
  const loginToken = await testLogin();
  
  // Test 3: Authenticated request
  if (loginToken) {
    await testAuthenticatedRequest(loginToken);
  }
  
  console.log('\n🏁 Integration tests completed!');
}

// Run the tests
runIntegrationTests().catch(console.error);