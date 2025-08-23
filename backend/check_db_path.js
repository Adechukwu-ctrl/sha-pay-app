// Clear require cache to ensure fresh config load
delete require.cache[require.resolve('./config/database')];

const { sequelize } = require('./config/database');
const path = require('path');
const fs = require('fs');

async function checkDatabasePath() {
  try {
    console.log('Database configuration:');
    console.log('Dialect:', sequelize.getDialect());
    console.log('Storage:', sequelize.config.storage);
    
    if (sequelize.config.storage) {
      console.log('Absolute storage path:', path.resolve(sequelize.config.storage));
      
      // Check if the file exists
      const dbPath = path.resolve(sequelize.config.storage);
      const exists = fs.existsSync(dbPath);
      console.log('Database file exists:', exists);
      
      if (exists) {
        const stats = fs.statSync(dbPath);
        console.log('Database file size:', stats.size, 'bytes');
      }
    } else {
      console.log('Storage path is undefined!');
    }
    
    // Check current working directory
    console.log('Current working directory:', process.cwd());
    
    // List all .sqlite files in current directory
    const files = fs.readdirSync('.').filter(f => f.endsWith('.sqlite'));
    console.log('SQLite files in current directory:', files);
    
    // Check if our known database.sqlite exists
    const knownDbPath = path.resolve('./database.sqlite');
    console.log('Known database.sqlite path:', knownDbPath);
    console.log('Known database.sqlite exists:', fs.existsSync(knownDbPath));
    
    if (fs.existsSync(knownDbPath)) {
      const knownStats = fs.statSync(knownDbPath);
      console.log('Known database.sqlite size:', knownStats.size, 'bytes');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkDatabasePath();