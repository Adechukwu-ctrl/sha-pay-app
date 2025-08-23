const request = require('supertest');
const app = require('../../server');
const { User, Service } = require('../../models');
const { generateToken } = require('../../utils/jwt');
const bcrypt = require('bcryptjs');

describe('Services Integration Tests', () => {
  let testProvider;
  let testRequirer;
  let providerToken;
  let requirerToken;
  let testService;

  afterAll(async () => {
    // Clean up any remaining connections
    if (app && app.close) {
      await app.close();
    }
  });

  beforeEach(async () => {
    // Clean up database
    await Service.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // Create test provider
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    testProvider = await User.create({
      email: 'provider@example.com',
      phone: '+2348012345678',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Provider',
      userType: 'provider',
      isVerified: true,
      emailVerified: true,
      phoneVerified: true
    });

    // Create test requirer
    testRequirer = await User.create({
      email: 'requirer@example.com',
      phone: '+2348087654321',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Requirer',
      userType: 'requirer',
      isVerified: true,
      emailVerified: true,
      phoneVerified: true
    });

    providerToken = generateToken(testProvider.id);
    requirerToken = generateToken(testRequirer.id);

    // Create test service
    testService = await Service.create({
      title: 'Test Service',
      description: 'A test service for integration testing',
      category: 'tech_support',
      basePrice: 100.00,
      providerId: testProvider.id,
      status: 'active'
    });
  });

  afterEach(async () => {
    await Service.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  describe('POST /api/services', () => {
    it('should create a new service successfully', async () => {
      const serviceData = {
        title: 'New Test Service',
        description: 'Another test service',
        category: 'Design',
        price: 150.00,
        location: 'Abuja, Nigeria',
        skills: ['Photoshop', 'Illustrator']
      };

      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${providerToken}`)
        .send(serviceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.service.title).toBe(serviceData.title);
      expect(response.body.data.service.providerId).toBe(testProvider.id);
    });

    it('should return 401 for unauthenticated user', async () => {
      const serviceData = {
        title: 'Unauthorized Service',
        description: 'This should fail',
        category: 'Technology',
        price: 100.00
      };

      const response = await request(app)
        .post('/api/services')
        .send(serviceData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for requirer trying to create service', async () => {
      const serviceData = {
        title: 'Forbidden Service',
        description: 'Requirer cannot create services',
        category: 'Technology',
        price: 100.00
      };

      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${requirerToken}`)
        .send(serviceData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('provider');
    });
  });

  describe('GET /api/services', () => {
    it('should get all services with pagination', async () => {
      const response = await request(app)
        .get('/api/services?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.services).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.services.length).toBeGreaterThan(0);
    });

    it('should filter services by category', async () => {
      const response = await request(app)
        .get('/api/services?category=Technology')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.services.forEach(service => {
        expect(service.category).toBe('Technology');
      });
    });

    it('should filter services by price range', async () => {
      const response = await request(app)
        .get('/api/services?minPrice=50&maxPrice=200')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.services.forEach(service => {
        expect(service.price).toBeGreaterThanOrEqual(50);
        expect(service.price).toBeLessThanOrEqual(200);
      });
    });

    it('should search services by title', async () => {
      const response = await request(app)
        .get('/api/services?search=Test')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.services.forEach(service => {
        expect(service.title.toLowerCase()).toContain('test');
      });
    });
  });

  describe('GET /api/services/:id', () => {
    it('should get service by ID', async () => {
      const response = await request(app)
        .get(`/api/services/${testService.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.service.id).toBe(testService.id);
      expect(response.body.data.service.title).toBe(testService.title);
    });

    it('should return 404 for non-existent service', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .get(`/api/services/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /api/services/:id', () => {
    it('should update service successfully by owner', async () => {
      const updateData = {
        title: 'Updated Test Service',
        price: 200.00
      };

      const response = await request(app)
        .put(`/api/services/${testService.id}`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.service.title).toBe(updateData.title);
      expect(response.body.data.service.price).toBe(updateData.price);
    });

    it('should return 403 for non-owner trying to update', async () => {
      const updateData = {
        title: 'Unauthorized Update'
      };

      const response = await request(app)
        .put(`/api/services/${testService.id}`)
        .set('Authorization', `Bearer ${requirerToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/services/:id', () => {
    it('should delete service successfully by owner', async () => {
      const response = await request(app)
        .delete(`/api/services/${testService.id}`)
        .set('Authorization', `Bearer ${providerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify service is deleted
      const deletedService = await Service.findByPk(testService.id);
      expect(deletedService).toBeNull();
    });

    it('should return 403 for non-owner trying to delete', async () => {
      const response = await request(app)
        .delete(`/api/services/${testService.id}`)
        .set('Authorization', `Bearer ${requirerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});