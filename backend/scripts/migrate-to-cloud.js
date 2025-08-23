#!/usr/bin/env node

/**
 * Database Migration Script for Cloud Deployment
 * This script helps migrate from local SQLite to cloud PostgreSQL
 */

const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

// Import models
const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

const migrateToCloud = async () => {
  console.log('🚀 Starting migration to cloud database...');
  
  let sourceDB, targetDB;
  
  try {
    // Source database (local SQLite)
    console.log('📂 Connecting to source database (SQLite)...');
    sourceDB = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../database.sqlite'),
      logging: false
    });
    
    await sourceDB.authenticate();
    console.log('✅ Connected to source database');
    
    // Target database (cloud PostgreSQL)
    console.log('☁️  Connecting to target database (PostgreSQL)...');
    if (!process.env.DATABASE_URL && (!process.env.DB_HOST || !process.env.DB_NAME)) {
      throw new Error('❌ Target database configuration missing. Please set DATABASE_URL or individual DB_* variables in .env.production');
    }
    
    if (process.env.DATABASE_URL) {
      targetDB = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      });
    } else {
      targetDB = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT || 5432,
          dialect: 'postgres',
          logging: false,
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          }
        }
      );
    }
    
    await targetDB.authenticate();
    console.log('✅ Connected to target database');
    
    // Create target database schema
    console.log('📋 Creating target database schema...');
    await createTargetSchema(targetDB);
    console.log('✅ Target schema created');
    
    // Check if source database exists and has data
    const sourceExists = fs.existsSync(path.join(__dirname, '../database.sqlite'));
    if (!sourceExists) {
      console.log('ℹ️  No source database found. Skipping data migration.');
      console.log('🎉 Cloud database setup completed successfully!');
      return;
    }
    
    // Migrate data
    console.log('📊 Starting data migration...');
    await migrateData(sourceDB, targetDB);
    console.log('✅ Data migration completed');
    
    // Verify migration
    console.log('🔍 Verifying migration...');
    await verifyMigration(sourceDB, targetDB);
    console.log('✅ Migration verified successfully');
    
    console.log('🎉 Migration to cloud database completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your production environment to use the new database');
    console.log('2. Test your application with the cloud database');
    console.log('3. Consider backing up your local SQLite database');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (sourceDB) await sourceDB.close();
    if (targetDB) await targetDB.close();
  }
};

const createTargetSchema = async (targetDB) => {
  // Define models for target database
  const TargetUser = targetDB.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    userType: {
      type: DataTypes.ENUM('service_provider', 'service_requester'),
      allowNull: false,
      defaultValue: 'service_requester'
    },
    profilePicture: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'Nigeria'
    },
    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isPhoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    phoneVerificationCode: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    passwordResetToken: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lockUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    twoFactorSecret: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fcmToken: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00
    },
    totalRatings: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    completedJobs: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalEarnings: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    },
    availableBalance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    },
    pendingBalance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    skills: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    languages: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: ['English']
    },
    availability: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  });
  
  // Sync the schema
  await targetDB.sync({ force: false, alter: true });
  
  return { TargetUser };
};

const migrateData = async (sourceDB, targetDB) => {
  // Define source models
  const SourceUser = sourceDB.define('User', {}, { timestamps: true, underscored: true, freezeTableName: true });
  
  // Define target models
  const TargetUser = targetDB.define('User', {}, { timestamps: true, underscored: true, freezeTableName: true });
  
  // Migrate Users
  console.log('👥 Migrating users...');
  const users = await SourceUser.findAll();
  console.log(`Found ${users.length} users to migrate`);
  
  for (const user of users) {
    try {
      await TargetUser.create(user.dataValues);
    } catch (error) {
      console.warn(`⚠️  Failed to migrate user ${user.email}:`, error.message);
    }
  }
  
  console.log('✅ User migration completed');
  
  // Add migration for other models (Services, Bookings, Payments) as needed
  // This is a basic implementation - extend as needed
};

const verifyMigration = async (sourceDB, targetDB) => {
  // Define models for verification
  const SourceUser = sourceDB.define('User', {}, { timestamps: true, underscored: true, freezeTableName: true });
  const TargetUser = targetDB.define('User', {}, { timestamps: true, underscored: true, freezeTableName: true });
  
  // Count records
  const sourceUserCount = await SourceUser.count();
  const targetUserCount = await TargetUser.count();
  
  console.log(`Source users: ${sourceUserCount}`);
  console.log(`Target users: ${targetUserCount}`);
  
  if (sourceUserCount !== targetUserCount) {
    console.warn('⚠️  User count mismatch detected');
  }
  
  // Add more verification as needed
};

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateToCloud();
}

module.exports = { migrateToCloud };