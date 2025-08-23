const request = require('supertest');
const app = require('./server');

// Simple test to check if server is working
request(app)
  .get('/api/health')
  .expect(200)
  .then(response => {
    console.log('Health check passed:', response.body);
    process.exit(0);
  })
  .catch(error => {
    console.error('Health check failed:', error.message);
    process.exit(1);
  });