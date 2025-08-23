const { Sequelize } = require('sequelize');
const path = require('path');

// Load environment-specific .env file
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

const config = {
  development: {
    username: process.env.DB_USER || null,
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || 'sha_pay_development',
    host: process.env.DB_HOST || null,
    port: process.env.DB_PORT || null,
    dialect: process.env.DB_DIALECT || 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: console.log,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 5,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  },
  test: {
    username: null,
    password: null,
    database: process.env.DB_NAME || 'test_sha_pay',
    host: null,
    port: null,
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  },
  production: {
    username: process.env.DB_USER || null,
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || 'sha_pay_production',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    // Support for DATABASE_URL if provided
    use_env_variable: process.env.DATABASE_URL ? 'DATABASE_URL' : null
  }
};

const env = (process.env.NODE_ENV || 'development').trim();

// Use a more robust way to get the config
let dbConfig;
if (env === 'production') {
  dbConfig = config.production;
} else if (env === 'test') {
  dbConfig = config.test;
} else {
  dbConfig = config.development;
}

if (!dbConfig) {
  throw new Error(`Database configuration not found for environment: ${env}`);
}

let sequelize;

if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], {
    ...dbConfig,
    dialectOptions: dbConfig.dialectOptions
  });
} else {
  // For SQLite, use the simplified constructor
  if (dbConfig.dialect === 'sqlite') {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: dbConfig.storage,
      logging: dbConfig.logging,
      pool: dbConfig.pool,
      define: dbConfig.define
    });
  } else {
    sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        storage: dbConfig.storage,
        logging: dbConfig.logging,
        pool: dbConfig.pool,
        define: dbConfig.define,
        dialectOptions: dbConfig.dialectOptions
      }
    );
  }
}

// Test database connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    if (env === 'development') {
      // Sync database in development (be careful in production)
      await sequelize.sync({ alter: true });
      console.log('✅ Database synchronized successfully.');
    }
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
const closeDB = async () => {
  try {
    await sequelize.close();
    console.log('✅ Database connection closed successfully.');
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
  }
};

module.exports = config;

// For application use
module.exports.sequelize = sequelize;
module.exports.connectDB = connectDB;
module.exports.closeDB = closeDB;