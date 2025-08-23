const { Sequelize } = require('sequelize');
const path = require('path');

// Create a direct SQLite connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: console.log
});

async function testConnection() {
  try {
    console.log('Testing SQLite connection...');
    console.log('Storage path:', sequelize.config.storage);
    console.log('Absolute path:', path.resolve('./database.sqlite'));
    
    await sequelize.authenticate();
    console.log('Connection successful!');
    
    // List tables
    const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table';");
    console.log('Tables found:', results.map(r => r.name));
    
    // If users table exists, count users
    if (results.some(r => r.name === 'users')) {
      const [countResult] = await sequelize.query("SELECT COUNT(*) as count FROM users;");
      console.log('Users count:', countResult[0].count);
      
      // Get all users
      const [users] = await sequelize.query("SELECT id, email, user_type, available_balance FROM users;");
      console.log('Users:', users);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

testConnection();