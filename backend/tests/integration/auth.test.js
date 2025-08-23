const request = require('supertest');
const app = require('../../server');
const { User } = require('../../models');
const { generateToken } = require('../../utils/jwt');
const bcrypt = require('bcryptjs');

describe('Authentication Integration Tests', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Clean up database
    await User.destroy({ where: {}, force: true });

    // Create test user
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    testUser = await User.create({
      email: 'test@example.com',
      phone: '+2348012345678',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      userType: 'provider',
      isVerified: true,
      emailVerified: true,
      phoneVerified: true
    });

    authToken = generateToken(testUser.id);
  });

  afterEach(async () => {
    // Clean up after each test
    await User.destroy({ where: {}, force: true });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        phone: '+2348087654321',
        password: 'NewPassword123!',
        firstName: 'New',
        lastName: 'User',
        userType: 'requirer'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('registered successfully');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        phone: '+2348087654321',
        password: 'NewPassword123!',
        firstName: 'New',
        lastName: 'User',
        userType: 'requirer'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        email: testUser.email,
        phone: '+2348087654321',
        password: 'NewPassword123!',
        firstName: 'New',
        lastName: 'User',
        userType: 'requirer'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should return 400 for weak password', async () => {
      const userData = {
        email: 'newuser@example.com',
        phone: '+2348087654321',
        password: '123',
        firstName: 'New',
        lastName: 'User',
        userType: 'requirer'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('password');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid email and password', async () => {
      const loginData = {
        identifier: testUser.email,
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUser.id);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should login with valid phone and password', async () => {
      const loginData = {
        identifier: testUser.phone,
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUser.id);
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        identifier: testUser.email,
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should return 404 for non-existent user', async () => {
      const loginData = {
        identifier: 'nonexistent@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUser.id);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('logged out');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'TestPassword123!',
        newPassword: 'NewTestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('changed');
    });

    it('should return 400 for incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewTestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('current password');
    });

    it('should return 400 for weak new password', async () => {
      const passwordData = {
        currentPassword: 'TestPassword123!',
        newPassword: '123'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});