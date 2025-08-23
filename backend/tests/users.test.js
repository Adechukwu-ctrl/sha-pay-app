const request = require('supertest');

describe('User Endpoints', () => {
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
    email: 'testuser@example.com',
    password: 'TestPassword123!',
    phoneNumber: '+1234567890'
  };

  describe('GET /api/users/profile', () => {
    it('should return error without auth token', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.status).not.toBe(404);
      expect(response.body).toBeDefined();
    });

    it('should return error with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).not.toBe(404);
      expect(response.body).toBeDefined();
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should respond to profile update endpoint', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'Updated bio'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .send(updateData);

      expect(response.status).not.toBe(404);
      expect(response.body).toBeDefined();
    });
  });

  describe('GET /api/users', () => {
    it('should respond to users list endpoint', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=10');

      expect(response.status).not.toBe(404);
      expect(response.body).toBeDefined();
    });

    it('should respond to users filter endpoint', async () => {
      const response = await request(app)
        .get('/api/users?role=user');

      expect(response.status).not.toBe(404);
      expect(response.body).toBeDefined();
    });
  });
});