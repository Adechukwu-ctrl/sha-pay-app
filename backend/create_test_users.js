const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const db = new sqlite3.Database('./database.sqlite');

async function createTestUsers() {
  try {
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    const now = new Date().toISOString();
    
    // Create provider user
    const providerId = uuidv4();
    db.run(`
      INSERT INTO users (
        id, first_name, last_name, email, phone, password, user_type,
        is_email_verified, is_phone_verified, is_active, available_balance,
        pending_balance, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      providerId, 'Test', 'Provider', 'provider@test.com', '+2348012345678',
      hashedPassword, 'provider', 1, 1, 1, 1000.00, 500.00, now, now
    ], function(err) {
      if (err) {
        console.error('Error creating provider:', err);
      } else {
        console.log('Created provider user:', {
          id: providerId,
          email: 'provider@test.com',
          userType: 'provider',
          availableBalance: 1000.00
        });
      }
    });
    
    // Create requirer user
    const requirerId = uuidv4();
    db.run(`
      INSERT INTO users (
        id, first_name, last_name, email, phone, password, user_type,
        is_email_verified, is_phone_verified, is_active, available_balance,
        pending_balance, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      requirerId, 'Test', 'Requirer', 'requirer@test.com', '+2348087654321',
      hashedPassword, 'requirer', 1, 1, 1, 750.00, 250.00, now, now
    ], function(err) {
      if (err) {
        console.error('Error creating requirer:', err);
      } else {
        console.log('Created requirer user:', {
          id: requirerId,
          email: 'requirer@test.com',
          userType: 'requirer',
          availableBalance: 750.00
        });
        
        // Close database after both inserts
        db.close();
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    db.close();
  }
}

createTestUsers();