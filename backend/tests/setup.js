// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DB_NAME = 'test_sha_pay';

// Add polyfills for Node.js compatibility
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock console methods to reduce test output noise (temporarily allow log for debugging)
global.console = {
  ...console,
  log: console.log, // Allow console.log for debugging
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error // Allow console.error for debugging
};

// Set longer timeout for database operations
jest.setTimeout(60000);

// Database setup for tests
const { sequelize } = require('../config/database');

beforeAll(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  } catch (error) {
    console.error('Database setup failed:', error);
  }
});

afterAll(async () => {
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Database cleanup failed:', error);
  }
});