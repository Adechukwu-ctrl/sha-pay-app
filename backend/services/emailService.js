const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');

// Email service class
class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'logs/email-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/email.log' })
      ]
    });

    this.initializeTransporter();
    this.loadTemplates();
  }

  // Initialize email transporter
  initializeTransporter() {
    try {
      // Configure based on email provider
      if (process.env.EMAIL_PROVIDER === 'gmail') {
        this.transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
      } else if (process.env.EMAIL_PROVIDER === 'smtp') {
        this.transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          }
        });
      } else if (process.env.EMAIL_PROVIDER === 'sendgrid') {
        this.transporter = nodemailer.createTransporter({
          service: 'SendGrid',
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        });
      } else {
        // Default to console logging in development
        this.transporter = nodemailer.createTransporter({
          streamTransport: true,
          newline: 'unix',
          buffer: true
        });
      }

      this.logger.info('Email transporter initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize email transporter:', error);
    }
  }

  // Load email templates
  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates/emails');
      
      // Create templates directory if it doesn't exist
      try {
        await fs.access(templatesDir);
      } catch {
        await fs.mkdir(templatesDir, { recursive: true });
        await this.createDefaultTemplates(templatesDir);
      }

      const templateFiles = await fs.readdir(templatesDir);
      
      for (const file of templateFiles) {
        if (file.endsWith('.hbs') || file.endsWith('.handlebars')) {
          const templateName = path.basename(file, path.extname(file));
          const templatePath = path.join(templatesDir, file);
          const templateContent = await fs.readFile(templatePath, 'utf8');
          const compiledTemplate = handlebars.compile(templateContent);
          
          this.templates.set(templateName, compiledTemplate);
        }
      }

      this.logger.info(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      this.logger.error('Failed to load email templates:', error);
    }
  }

  // Create default email templates
  async createDefaultTemplates(templatesDir) {
    const templates = {
      'welcome': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to Sha Pay</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Sha Pay!</h1>
        </div>
        <div class="content">
            <h2>Hello {{firstName}}!</h2>
            <p>Welcome to Sha Pay, your trusted platform for connecting service providers with customers.</p>
            <p>To get started, please verify your email address by clicking the button below:</p>
            <p><a href="{{verificationLink}}" class="button">Verify Email</a></p>
            <p>If you didn't create this account, please ignore this email.</p>
            <p>Best regards,<br>The Sha Pay Team</p>
        </div>
    </div>
</body>
</html>`,

      'email-verification': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Your Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Email Verification</h1>
        </div>
        <div class="content">
            <h2>Hello {{firstName}}!</h2>
            <p>Please verify your email address by clicking the button below:</p>
            <p><a href="{{verificationLink}}" class="button">Verify Email</a></p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
        </div>
    </div>
</body>
</html>`,

      'password-reset': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Your Password</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 10px 20px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset</h1>
        </div>
        <div class="content">
            <h2>Hello {{firstName}}!</h2>
            <p>You requested to reset your password. Click the button below to set a new password:</p>
            <p><a href="{{resetLink}}" class="button">Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
        </div>
    </div>
</body>
</html>`,

      'booking-notification': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Booking Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #17a2b8; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .booking-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #17a2b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Booking Update</h1>
        </div>
        <div class="content">
            <h2>Hello {{userName}}!</h2>
            <p>{{message}}</p>
            <div class="booking-details">
                <h3>Booking Details:</h3>
                <p><strong>Service:</strong> {{serviceName}}</p>
                <p><strong>Date:</strong> {{scheduledDate}}</p>
                <p><strong>Booking ID:</strong> {{bookingId}}</p>
            </div>
            <p>You can view more details in your Sha Pay dashboard.</p>
        </div>
    </div>
</body>
</html>`,

      'payment-confirmation': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payment Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .payment-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Confirmed</h1>
        </div>
        <div class="content">
            <h2>Hello {{requesterName}}!</h2>
            <p>Your payment has been successfully processed.</p>
            <div class="payment-details">
                <h3>Payment Details:</h3>
                <p><strong>Service:</strong> {{serviceName}}</p>
                <p><strong>Amount:</strong> {{amount}} {{currency}}</p>
                <p><strong>Transaction ID:</strong> {{transactionId}}</p>
                <p><strong>Booking ID:</strong> {{bookingId}}</p>
            </div>
            <p>Thank you for using Sha Pay!</p>
        </div>
    </div>
</body>
</html>`
    };

    for (const [name, content] of Object.entries(templates)) {
      await fs.writeFile(path.join(templatesDir, `${name}.hbs`), content);
    }
  }

  // Send email using template
  async sendEmail(to, subject, templateName, data = {}) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const template = this.templates.get(templateName);
      if (!template) {
        throw new Error(`Template '${templateName}' not found`);
      }

      const html = template(data);

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Sha Pay'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.info('Email sent successfully', {
        to,
        subject,
        template: templateName,
        messageId: result.messageId
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to send email', {
        to,
        subject,
        template: templateName,
        error: error.message
      });
      throw error;
    }
  }

  // Send welcome email
  async sendWelcomeEmail(to, data) {
    return this.sendEmail(
      to,
      'Welcome to Sha Pay!',
      'welcome',
      data
    );
  }

  // Send email verification
  async sendEmailVerification(to, data) {
    return this.sendEmail(
      to,
      'Verify Your Email Address',
      'email-verification',
      data
    );
  }

  // Send password reset email
  async sendPasswordReset(to, data) {
    return this.sendEmail(
      to,
      'Reset Your Password',
      'password-reset',
      data
    );
  }

  // Send booking notification
  async sendBookingNotification(to, type, data) {
    const subjects = {
      new_booking: 'New Booking Request',
      booking_confirmed: 'Booking Confirmed',
      booking_cancelled: 'Booking Cancelled',
      booking_rescheduled: 'Booking Rescheduled',
      payment_received: 'Payment Received'
    };

    const messages = {
      new_booking: `You have received a new booking request for your service "${data.serviceName}".`,
      booking_confirmed: `Your booking for "${data.serviceName}" has been confirmed.`,
      booking_cancelled: `Your booking for "${data.serviceName}" has been cancelled.`,
      booking_rescheduled: `Your booking for "${data.serviceName}" has been rescheduled.`,
      payment_received: `Payment has been received for your service "${data.serviceName}".`
    };

    return this.sendEmail(
      to,
      subjects[type] || 'Booking Update',
      'booking-notification',
      {
        ...data,
        message: messages[type] || 'Your booking has been updated.'
      }
    );
  }

  // Send payment confirmation
  async sendPaymentConfirmation(to, data) {
    return this.sendEmail(
      to,
      'Payment Confirmation',
      'payment-confirmation',
      data
    );
  }

  // Send refund notification
  async sendRefundNotification(to, data) {
    return this.sendEmail(
      to,
      'Refund Processed',
      'refund-notification',
      data
    );
  }

  // Initialize method for external calls
  async initialize() {
    return await this.verifyConnection();
  }

  // Verify transporter connection
  async verifyConnection() {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      await this.transporter.verify();
      this.logger.info('Email service connection verified');
      return true;
    } catch (error) {
      this.logger.error('Email service connection failed:', error);
      return false;
    }
  }
}

// Create and export singleton instance
const emailService = new EmailService();
module.exports = emailService;