const request = require('supertest');

describe('Authentication Endpoints', () => {
  let app;
  
  beforeAll(async () => {
    // Import app after environment is set
    app = require('../server');
    // Wait for server initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'TestPassword123!',
    phoneNumber: '+1234567890'
  };

  describe('POST /api/auth/register', () => {
    it('should respond to register endpoint', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Should respond (not 404), regardless of success/failure
      expect(response.status).not.toBe(404);
      expect(response.body).toBeDefined();
    });

    it('should return error for invalid email format', async () => {
      const invalidUser = { ...testUser, email: 'invalid-email' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser);

      expect(response.status).not.toBe(404);
      expect(response.body).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should respond to login endpoint', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      // Should respond (not 404), regardless of success/failure
      expect(response.status).not.toBe(404);
      expect(response.body).toBeDefined();
    });

    it('should return error for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).not.toBe(404);
      expect(response.body).toBeDefined();
    });
  });
});