/**
 * Production API Test Script
 * Tests the deployed backend API endpoints
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'https://sha-pay-backend.glitch.me/api';
const TIMEOUT = 30000; // 30 seconds

// Test endpoints
const testEndpoints = [
  {
    name: 'Health Check',
    method: 'GET',
    url: `${API_BASE_URL}/health`,
    expectedStatus: 200
  },
  {
    name: 'API Info',
    method: 'GET', 
    url: `${API_BASE_URL}/`,
    expectedStatus: 200
  },
  {
    name: 'Auth Register Endpoint',
    method: 'OPTIONS',
    url: `${API_BASE_URL}/auth/register`,
    expectedStatus: [200, 204]
  },
  {
    name: 'Auth Login Endpoint',
    method: 'OPTIONS',
    url: `${API_BASE_URL}/auth/login`,
    expectedStatus: [200, 204]
  }
];

// Test function
async function testEndpoint(endpoint) {
  try {
    console.log(`\n🧪 Testing: ${endpoint.name}`);
    console.log(`   ${endpoint.method} ${endpoint.url}`);
    
    const response = await axios({
      method: endpoint.method,
      url: endpoint.url,
      timeout: TIMEOUT,
      validateStatus: function (status) {
        // Accept any status code for testing
        return true;
      }
    });
    
    const expectedStatuses = Array.isArray(endpoint.expectedStatus) 
      ? endpoint.expectedStatus 
      : [endpoint.expectedStatus];
    
    if (expectedStatuses.includes(response.status)) {
      console.log(`   ✅ SUCCESS: Status ${response.status}`);
      return { success: true, status: response.status, endpoint: endpoint.name };
    } else {
      console.log(`   ❌ FAILED: Expected ${expectedStatuses.join(' or ')}, got ${response.status}`);
      return { success: false, status: response.status, endpoint: endpoint.name };
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`   ❌ FAILED: Connection refused - Server not running`);
    } else if (error.code === 'ENOTFOUND') {
      console.log(`   ❌ FAILED: Domain not found - Check URL`);
    } else if (error.code === 'ECONNABORTED') {
      console.log(`   ❌ FAILED: Request timeout`);
    } else {
      console.log(`   ❌ FAILED: ${error.message}`);
    }
    return { success: false, error: error.message, endpoint: endpoint.name };
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Production API Tests');
  console.log('=' .repeat(50));
  console.log(`Base URL: ${API_BASE_URL}`);
  
  const results = [];
  
  for (const endpoint of testEndpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results Summary');
  console.log('=' .repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${total - successful}`);
  console.log(`Success Rate: ${((successful / total) * 100).toFixed(1)}%`);
  
  if (successful === total) {
    console.log('\n🎉 All tests passed! Your API is ready for production.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check your deployment.');
  }
  
  return results;
}

// Instructions
function printInstructions() {
  console.log('\n📋 Instructions:');
  console.log('1. Deploy your backend to Glitch.com');
  console.log('2. Update the project name in this file if different from "sha-pay-backend"');
  console.log('3. Run: node test-production-api.js');
  console.log('4. Verify all tests pass before using in production\n');
}

// Run if called directly
if (require.main === module) {
  printInstructions();
  runTests().catch(console.error);
}

module.exports = { runTests, testEndpoint };