const { sequelize } = require('./config/database');

async function checkTables() {
  try {
    console.log('Checking database tables...');
    
    const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table';");
    console.log('Tables found:', results.map(r => r.name));
    
    // Check if users table exists
    const userTableExists = results.some(r => r.name === 'users');
    console.log('Users table exists:', userTableExists);
    
    if (userTableExists) {
      // Check table structure
      const [columns] = await sequelize.query("PRAGMA table_info(users);");
      console.log('Users table columns:', columns.map(c => c.name));
      
      // Check row count
      const [countResult] = await sequelize.query("SELECT COUNT(*) as count FROM users;");
      console.log('Users count:', countResult[0].count);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTables();