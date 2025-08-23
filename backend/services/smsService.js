const winston = require('winston');

// Create logger for SMS service
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'sms-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/sms-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/sms-combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// SMS Service Configuration
const SMS_PROVIDERS = {
  TWILIO: 'twilio',
  NEXMO: 'nexmo',
  AWS_SNS: 'aws_sns',
  MOCK: 'mock'
};

class SMSService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || SMS_PROVIDERS.MOCK;
    this.client = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      switch (this.provider) {
        case SMS_PROVIDERS.TWILIO:
          await this.initializeTwilio();
          break;
        case SMS_PROVIDERS.NEXMO:
          await this.initializeNexmo();
          break;
        case SMS_PROVIDERS.AWS_SNS:
          await this.initializeAWSSNS();
          break;
        case SMS_PROVIDERS.MOCK:
        default:
          await this.initializeMock();
          break;
      }
      
      this.initialized = true;
      logger.info(`SMS service initialized with provider: ${this.provider}`);
    } catch (error) {
      logger.error('Failed to initialize SMS service:', error);
      throw error;
    }
  }

  async initializeTwilio() {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
    
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured');
    }

    try {
      const twilio = require('twilio');
      this.client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      
      // Test the connection
      await this.client.api.accounts(TWILIO_ACCOUNT_SID).fetch();
      logger.info('Twilio SMS service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Twilio:', error);
      throw error;
    }
  }

  async initializeNexmo() {
    const { NEXMO_API_KEY, NEXMO_API_SECRET } = process.env;
    
    if (!NEXMO_API_KEY || !NEXMO_API_SECRET) {
      throw new Error('Nexmo credentials not configured');
    }

    try {
      const { Vonage } = require('@vonage/server-sdk');
      this.client = new Vonage({
        apiKey: NEXMO_API_KEY,
        apiSecret: NEXMO_API_SECRET
      });
      
      logger.info('Nexmo SMS service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Nexmo:', error);
      throw error;
    }
  }

  async initializeAWSSNS() {
    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;
    
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
      throw new Error('AWS SNS credentials not configured');
    }

    try {
      const AWS = require('aws-sdk');
      AWS.config.update({
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
        region: AWS_REGION
      });
      
      this.client = new AWS.SNS();
      logger.info('AWS SNS service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AWS SNS:', error);
      throw error;
    }
  }

  async initializeMock() {
    this.client = {
      send: async (message) => {
        logger.info('Mock SMS sent:', message);
        return {
          success: true,
          messageId: `mock_${Date.now()}`,
          provider: 'mock'
        };
      }
    };
    
    logger.info('Mock SMS service initialized');
  }

  async sendSMS(phoneNumber, message, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const smsData = {
        to: phoneNumber,
        message: message,
        timestamp: new Date().toISOString(),
        ...options
      };

      let result;
      
      switch (this.provider) {
        case SMS_PROVIDERS.TWILIO:
          result = await this.sendTwilioSMS(smsData);
          break;
        case SMS_PROVIDERS.NEXMO:
          result = await this.sendNexmoSMS(smsData);
          break;
        case SMS_PROVIDERS.AWS_SNS:
          result = await this.sendAWSSNS(smsData);
          break;
        case SMS_PROVIDERS.MOCK:
        default:
          result = await this.client.send(smsData);
          break;
      }

      logger.info('SMS sent successfully:', {
        to: phoneNumber,
        provider: this.provider,
        messageId: result.messageId
      });

      return result;
    } catch (error) {
      logger.error('Failed to send SMS:', {
        to: phoneNumber,
        error: error.message,
        provider: this.provider
      });
      throw error;
    }
  }

  async sendTwilioSMS(smsData) {
    const message = await this.client.messages.create({
      body: smsData.message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: smsData.to
    });

    return {
      success: true,
      messageId: message.sid,
      provider: 'twilio',
      status: message.status
    };
  }

  async sendNexmoSMS(smsData) {
    const response = await this.client.sms.send({
      to: smsData.to.replace('+', ''),
      from: process.env.NEXMO_PHONE_NUMBER || 'ShaPayApp',
      text: smsData.message
    });

    return {
      success: response.messages[0].status === '0',
      messageId: response.messages[0]['message-id'],
      provider: 'nexmo',
      status: response.messages[0].status
    };
  }

  async sendAWSSNS(smsData) {
    const params = {
      Message: smsData.message,
      PhoneNumber: smsData.to,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional'
        }
      }
    };

    const result = await this.client.publish(params).promise();

    return {
      success: true,
      messageId: result.MessageId,
      provider: 'aws_sns'
    };
  }

  async sendVerificationCode(phoneNumber, code) {
    const message = `Your Sha Pay verification code is: ${code}. This code will expire in 10 minutes.`;
    return await this.sendSMS(phoneNumber, message, { type: 'verification' });
  }

  async sendPasswordResetCode(phoneNumber, code) {
    const message = `Your Sha Pay password reset code is: ${code}. This code will expire in 15 minutes.`;
    return await this.sendSMS(phoneNumber, message, { type: 'password_reset' });
  }

  async sendBookingNotification(phoneNumber, bookingDetails) {
    const message = `Sha Pay: Your booking for ${bookingDetails.serviceName} has been ${bookingDetails.status}. Booking ID: ${bookingDetails.id}`;
    return await this.sendSMS(phoneNumber, message, { type: 'booking_notification' });
  }

  async sendPaymentNotification(phoneNumber, paymentDetails) {
    const message = `Sha Pay: Payment of $${paymentDetails.amount} has been ${paymentDetails.status}. Transaction ID: ${paymentDetails.transactionId}`;
    return await this.sendSMS(phoneNumber, message, { type: 'payment_notification' });
  }

  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async cleanup() {
    if (this.client && typeof this.client.close === 'function') {
      await this.client.close();
    }
    this.initialized = false;
    logger.info('SMS service cleaned up');
  }
}

// Create and export singleton instance
const smsService = new SMSService();

module.exports = smsService;