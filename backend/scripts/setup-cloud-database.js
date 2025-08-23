#!/usr/bin/env node

/**
 * Cloud Database Setup Script
 * This script sets up the production database schema and initial data
 */

const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

// Import models
const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

const setupCloudDatabase = async () => {
  console.log('🚀 Starting cloud database setup...');
  
  try {
    // Check if DATABASE_URL is provided
    if (!process.env.DATABASE_URL && (!process.env.DB_HOST || !process.env.DB_NAME)) {
      throw new Error('❌ Database configuration missing. Please set DATABASE_URL or individual DB_* variables in .env.production');
    }

    // Create Sequelize instance for production
    let sequelize;
    if (process.env.DATABASE_URL) {
      sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: console.log,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        },
        pool: {
          max: parseInt(process.env.DB_POOL_MAX) || 10,
          min: parseInt(process.env.DB_POOL_MIN) || 2,
          acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
          idle: parseInt(process.env.DB_POOL_IDLE) || 10000
        }
      });
    } else {
      sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT || 5432,
          dialect: 'postgres',
          logging: console.log,
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          },
          pool: {
            max: parseInt(process.env.DB_POOL_MAX) || 10,
            min: parseInt(process.env.DB_POOL_MIN) || 2,
            acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
            idle: parseInt(process.env.DB_POOL_IDLE) || 10000
          }
        }
      );
    }

    // Test connection
    console.log('🔍 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync all models (create tables)
    console.log('📋 Creating database schema...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database schema created successfully.');

    // Create indexes for better performance
    console.log('🔧 Creating database indexes...');
    await createIndexes(sequelize);
    console.log('✅ Database indexes created successfully.');

    // Insert initial data
    console.log('📊 Inserting initial data...');
    await insertInitialData(sequelize);
    console.log('✅ Initial data inserted successfully.');

    console.log('🎉 Cloud database setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your .env.production file with actual database credentials');
    console.log('2. Deploy your application to production');
    console.log('3. Run database migrations if needed');
    
    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

const createIndexes = async (sequelize) => {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    // User table indexes
    await queryInterface.addIndex('Users', ['email'], {
      name: 'idx_users_email',
      unique: true
    });
    
    await queryInterface.addIndex('Users', ['phone'], {
      name: 'idx_users_phone'
    });
    
    await queryInterface.addIndex('Users', ['userType'], {
      name: 'idx_users_user_type'
    });
    
    await queryInterface.addIndex('Users', ['isActive', 'isBlocked'], {
      name: 'idx_users_status'
    });
    
    // Service table indexes
    await queryInterface.addIndex('Services', ['userId'], {
      name: 'idx_services_user_id'
    });
    
    await queryInterface.addIndex('Services', ['category'], {
      name: 'idx_services_category'
    });
    
    await queryInterface.addIndex('Services', ['isActive'], {
      name: 'idx_services_active'
    });
    
    // Booking table indexes
    await queryInterface.addIndex('Bookings', ['serviceId'], {
      name: 'idx_bookings_service_id'
    });
    
    await queryInterface.addIndex('Bookings', ['customerId'], {
      name: 'idx_bookings_customer_id'
    });
    
    await queryInterface.addIndex('Bookings', ['status'], {
      name: 'idx_bookings_status'
    });
    
    await queryInterface.addIndex('Bookings', ['scheduledDate'], {
      name: 'idx_bookings_scheduled_date'
    });
    
    // Payment table indexes
    await queryInterface.addIndex('Payments', ['bookingId'], {
      name: 'idx_payments_booking_id'
    });
    
    await queryInterface.addIndex('Payments', ['status'], {
      name: 'idx_payments_status'
    });
    
    await queryInterface.addIndex('Payments', ['paymentMethod'], {
      name: 'idx_payments_method'
    });
    
    console.log('✅ All indexes created successfully');
  } catch (error) {
    console.log('⚠️  Some indexes may already exist:', error.message);
  }
};

const insertInitialData = async (sequelize) => {
  // Insert default service categories or any other initial data
  // This is where you can add default admin users, service categories, etc.
  
  console.log('📊 No initial data to insert at this time.');
  console.log('💡 You can modify this function to add default data as needed.');
};

// Run the setup if this script is executed directly
if (require.main === module) {
  setupCloudDatabase();
}

module.exports = { setupCloudDatabase };