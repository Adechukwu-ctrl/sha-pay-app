const { sequelize } = require('./config/database');
const { User } = require('./models');

async function syncModels() {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Database connection successful.');
    
    console.log('Checking existing tables...');
    const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table';");
    console.log('Existing tables:', results.map(r => r.name));
    
    console.log('Syncing models...');
    await sequelize.sync({ alter: true });
    console.log('Models synced successfully.');
    
    console.log('Testing User model after sync...');
    const userCount = await User.count();
    console.log('User count:', userCount);
    
    if (userCount > 0) {
      const users = await User.findAll({
        attributes: ['id', 'email', 'userType', 'availableBalance']
      });
      console.log('Users found:', users.map(u => ({
        id: u.id,
        email: u.email,
        userType: u.userType,
        availableBalance: u.availableBalance
      })));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

syncModels();