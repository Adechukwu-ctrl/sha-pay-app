#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests both local SQLite and cloud PostgreSQL connections
 */

const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

const testDatabaseConnection = async () => {
  console.log('🔍 Testing database connections...');
  
  // Test local SQLite connection
  console.log('\n📂 Testing local SQLite connection...');
  try {
    const localDB = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../database.sqlite'),
      logging: false
    });
    
    await localDB.authenticate();
    console.log('✅ Local SQLite connection successful');
    
    // Get table info
    const [results] = await localDB.query("SELECT name FROM sqlite_master WHERE type='table';");
    console.log(`📊 Found ${results.length} tables:`, results.map(r => r.name).join(', '));
    
    await localDB.close();
  } catch (error) {
    console.log('❌ Local SQLite connection failed:', error.message);
  }
  
  // Test cloud PostgreSQL connection (if configured)
  console.log('\n☁️  Testing cloud PostgreSQL connection...');
  
  if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
    console.log('ℹ️  No cloud database configuration found.');
    console.log('📝 To test cloud database connection, set one of:');
    console.log('   - DATABASE_URL=postgresql://user:pass@host:port/dbname');
    console.log('   - DB_HOST, DB_NAME, DB_USER, DB_PASSWORD');
    console.log('\n🔧 Example cloud database setup:');
    console.log('   1. Create a PostgreSQL database on Heroku, AWS RDS, or similar');
    console.log('   2. Update .env.production with connection details');
    console.log('   3. Run this script again to test the connection');
    return;
  }
  
  try {
    let cloudDB;
    
    if (process.env.DATABASE_URL) {
      console.log('🔗 Using DATABASE_URL connection...');
      cloudDB = new Sequelize(process.env.DATABASE_URL, {
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
      console.log('🔗 Using individual DB_* environment variables...');
      cloudDB = new Sequelize(
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
    
    await cloudDB.authenticate();
    console.log('✅ Cloud PostgreSQL connection successful');
    
    // Test basic query
    const [results] = await cloudDB.query('SELECT version();');
    console.log('📊 PostgreSQL version:', results[0].version);
    
    // Check if tables exist
    const [tables] = await cloudDB.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `);
    
    console.log(`📊 Found ${tables.length} tables:`, tables.map(t => t.table_name).join(', '));
    
    await cloudDB.close();
    
    console.log('\n🎉 Cloud database connection test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Run the migration script: node scripts/migrate-to-cloud.js');
    console.log('2. Update your application to use the cloud database');
    console.log('3. Test your application endpoints');
    
  } catch (error) {
    console.error('❌ Cloud PostgreSQL connection failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Verify your database credentials');
    console.log('2. Check if the database server is accessible');
    console.log('3. Ensure SSL is properly configured');
    console.log('4. Check firewall and security group settings');
  }
};

// Test cloud storage configuration
const testCloudStorageConfig = () => {
  console.log('\n☁️  Testing cloud storage configuration...');
  
  const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                       process.env.CLOUDINARY_API_KEY && 
                       process.env.CLOUDINARY_API_SECRET;
  
  const hasS3 = process.env.AWS_ACCESS_KEY_ID && 
               process.env.AWS_SECRET_ACCESS_KEY && 
               process.env.AWS_S3_BUCKET;
  
  if (hasCloudinary) {
    console.log('✅ Cloudinary configuration found');
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  } else {
    console.log('❌ Cloudinary configuration missing');
    console.log('   Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  }
  
  if (hasS3) {
    console.log('✅ AWS S3 configuration found');
    console.log(`   Bucket: ${process.env.AWS_S3_BUCKET}`);
    console.log(`   Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  } else {
    console.log('❌ AWS S3 configuration missing');
    console.log('   Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET');
  }
  
  if (!hasCloudinary && !hasS3) {
    console.log('\n⚠️  No cloud storage configured. File uploads will fail in production.');
    console.log('\n🔧 Setup instructions:');
    console.log('1. Sign up for Cloudinary (recommended) or AWS S3');
    console.log('2. Add credentials to .env.production');
    console.log('3. Test file upload endpoints');
  } else {
    console.log('\n🎉 Cloud storage configuration looks good!');
  }
};

// Run tests
if (require.main === module) {
  testDatabaseConnection()
    .then(() => {
      testCloudStorageConfig();
    })
    .catch((error) => {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testDatabaseConnection, testCloudStorageConfig };