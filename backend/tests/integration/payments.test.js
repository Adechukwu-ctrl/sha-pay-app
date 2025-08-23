const request = require('supertest');
const app = require('../../server');
const { User, Service, Booking, Payment } = require('../../models');
const { generateToken } = require('../../utils/jwt');
const bcrypt = require('bcryptjs');
const nock = require('nock');

describe('Payments Integration Tests', () => {
  let testProvider;
  let testRequirer;
  let providerToken;
  let requirerToken;
  let testService;
  let testBooking;
  let testPayment;

  beforeEach(async () => {
    // Clean up database
    await Payment.destroy({ where: {}, force: true });
    await Booking.destroy({ where: {}, force: true });
    await Service.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // Create test users
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
      description: 'A test service for payment testing',
      category: 'tech_support',
      basePrice: 100.00,
      providerId: testProvider.id,
      status: 'active'
    });

    // Create test booking
    testBooking = await Booking.create({
      bookingNumber: `SP${Date.now().toString().slice(-8)}TEST`,
      serviceId: testService.id,
      providerId: testProvider.id,
      requesterId: testRequirer.id,
      status: 'confirmed',
      totalAmount: 100.00,
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      scheduledTime: '10:00:00'
    });

    // Create test payment
    testPayment = await Payment.create({
      transactionId: `TXN${Date.now()}TEST`,
      bookingId: testBooking.id,
      payerId: testRequirer.id,
      payeeId: testProvider.id,
      amount: 100.00,
      amountInBaseCurrency: 100.00,
      status: 'pending',
      paymentMethod: 'card'
    });
  });

  afterEach(async () => {
    await Payment.destroy({ where: {}, force: true });
    await Booking.destroy({ where: {}, force: true });
    await Service.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    nock.cleanAll();
  });

  describe('POST /api/payments/initiate', () => {
    it('should initiate payment successfully', async () => {
      const paymentData = {
        bookingId: testBooking.id,
        paymentMethod: 'card'
      };

      // Mock Stripe payment intent creation
      nock('https://api.stripe.com')
        .post('/v1/payment_intents')
        .reply(200, {
          id: 'pi_test_123456',
          client_secret: 'pi_test_123456_secret_test',
          status: 'requires_payment_method'
        });

      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${requirerToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payment).toBeDefined();
      expect(response.body.data.clientSecret).toBeDefined();
    });

    it('should return 404 for non-existent booking', async () => {
      const paymentData = {
        bookingId: '123e4567-e89b-12d3-a456-426614174000',
        paymentMethod: 'card'
      };

      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${requirerToken}`)
        .send(paymentData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should return 403 for unauthorized user', async () => {
      const paymentData = {
        bookingId: testBooking.id,
        paymentMethod: 'card'
      };

      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${providerToken}`)
        .send(paymentData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('permission');
    });
  });

  describe('POST /api/payments/verify', () => {
    it('should verify payment successfully', async () => {
      const verificationData = {
        paymentId: testPayment.id,
        transactionId: 'pi_test_123456'
      };

      // Mock Stripe payment intent retrieval
      nock('https://api.stripe.com')
        .get('/v1/payment_intents/pi_test_123456')
        .reply(200, {
          id: 'pi_test_123456',
          status: 'succeeded',
          amount: 10250, // $102.50 in cents (including service charge)
          currency: 'usd'
        });

      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${requirerToken}`)
        .send(verificationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payment.status).toBe('completed');
    });

    it('should return 400 for failed payment verification', async () => {
      const verificationData = {
        paymentId: testPayment.id,
        transactionId: 'pi_test_failed'
      };

      // Mock Stripe payment intent retrieval for failed payment
      nock('https://api.stripe.com')
        .get('/v1/payment_intents/pi_test_failed')
        .reply(200, {
          id: 'pi_test_failed',
          status: 'payment_failed',
          amount: 10250,
          currency: 'usd'
        });

      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${requirerToken}`)
        .send(verificationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('failed');
    });
  });

  describe('GET /api/payments/history', () => {
    it('should get payment history for authenticated user', async () => {
      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${requirerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter payment history by status', async () => {
      const response = await request(app)
        .get('/api/payments/history?status=pending')
        .set('Authorization', `Bearer ${requirerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.payments.forEach(payment => {
        expect(payment.status).toBe('pending');
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app)
        .get('/api/payments/history')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/payments/:id', () => {
    it('should get payment details for authorized user', async () => {
      const response = await request(app)
        .get(`/api/payments/${testPayment.id}`)
        .set('Authorization', `Bearer ${requirerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payment.id).toBe(testPayment.id);
      expect(response.body.data.payment.amount).toBe(testPayment.amount);
    });

    it('should return 403 for unauthorized user', async () => {
      // Create another user
      const anotherUser = await User.create({
        email: 'another@example.com',
        phone: '+2348099999999',
        password: await bcrypt.hash('TestPassword123!', 12),
        firstName: 'Another',
        lastName: 'User',
        userType: 'requirer',
        isVerified: true
      });

      const anotherToken = generateToken(anotherUser.id);

      const response = await request(app)
        .get(`/api/payments/${testPayment.id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/payments/:id/refund', () => {
    beforeEach(async () => {
      // Update payment to completed status for refund testing
      await testPayment.update({
        status: 'completed',
        transactionId: 'pi_test_completed',
        paymentGateway: 'stripe',
        gatewayTransactionId: 'pi_test_completed'
      });
    });

    it('should process refund successfully', async () => {
      const refundData = {
        reason: 'Service not delivered'
      };

      // Mock Stripe refund creation
      nock('https://api.stripe.com')
        .post('/v1/refunds')
        .reply(200, {
          id: 're_test_123456',
          status: 'succeeded',
          amount: 10250
        });

      const response = await request(app)
        .post(`/api/payments/${testPayment.id}/refund`)
        .set('Authorization', `Bearer ${requirerToken}`)
        .send(refundData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payment.status).toBe('refunded');
    });

    it('should return 400 for non-refundable payment', async () => {
      // Update payment to pending status
      await testPayment.update({ status: 'pending' });

      const refundData = {
        reason: 'Change of mind'
      };

      const response = await request(app)
        .post(`/api/payments/${testPayment.id}/refund`)
        .set('Authorization', `Bearer ${requirerToken}`)
        .send(refundData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('refund');
    });
  });

  describe('GET /api/payments/balance', () => {
    it('should get provider balance', async () => {
      const response = await request(app)
        .get('/api/payments/balance')
        .set('Authorization', `Bearer ${providerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBeDefined();
      expect(response.body.data.pendingBalance).toBeDefined();
      expect(response.body.data.totalEarnings).toBeDefined();
    });

    it('should return 403 for requirer trying to access balance', async () => {
      const response = await request(app)
        .get('/api/payments/balance')
        .set('Authorization', `Bearer ${requirerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('provider');
    });
  });

  afterAll(async () => {
    // Clean up nock mocks
    nock.cleanAll();
    
    // Close app if it has a close method
    if (app && typeof app.close === 'function') {
      await app.close();
    }
  });
});