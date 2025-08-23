# Testing Framework

This project uses Jest and Supertest for API testing.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

- `tests/setup.js` - Test environment configuration
- `tests/auth.test.js` - Authentication endpoint tests
- `tests/users.test.js` - User endpoint tests

## Writing New Tests

1. Create test files in the `tests/` directory
2. Use the naming convention `*.test.js` or `*.spec.js`
3. Import the app and use Supertest for HTTP requests
4. Focus on endpoint availability and basic functionality

## Test Environment

- Tests run in a separate environment with `NODE_ENV=test`
- Console output is mocked to reduce noise
- Timeout is set to 30 seconds for database operations

## Example Test

```javascript
const request = require('supertest');

describe('API Endpoint', () => {
  let app;
  
  beforeAll(async () => {
    app = require('../server');
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  it('should respond to endpoint', async () => {
    const response = await request(app)
      .get('/api/endpoint');

    expect(response.status).not.toBe(404);
    expect(response.body).toBeDefined();
  });
});
```