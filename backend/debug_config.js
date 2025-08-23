const path = require('path');
const fs = require('fs');

// Load config directly
const config = require('./config/database');

console.log('NODE_ENV:', process.env.NODE_ENV);
const envConfig = config[process.env.NODE_ENV || 'development'];
console.log('Environment config:', {
  dialect: envConfig?.dialect,
  storage: envConfig?.storage,
  database: envConfig?.database,
  username: envConfig?.username,
  password: envConfig?.password
});

// Check if .env file exists
const envPath = path.resolve('.env');
console.log('.env file exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('.env content:');
  console.log(envContent);
}

// Check environment variables
console.log('DB_STORAGE env var:', process.env.DB_STORAGE);
console.log('DB_DIALECT env var:', process.env.DB_DIALECT);

// Try creating sequelize manually with explicit config
const { Sequelize } = require('sequelize');
const dbConfig = config[process.env.NODE_ENV || 'development'];

console.log('Database config being used:', dbConfig);

const testSequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    storage: dbConfig.storage,
    logging: false
  }
);

console.log('Test sequelize storage:', testSequelize.config.storage);
testSequelize.close();