const { User } = require('./models');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createUsers() {
  try {
    console.log('Creating users with Sequelize...');
    
    // Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create provider user
    const provider = await User.create({
      id: '2280bea7-8b16-4147-a18c-3d73784700ab',
      firstName: 'John',
      lastName: 'Provider',
      email: 'provider@test.com',
      phone: '+1234567890',
      password: hashedPassword,
      userType: 'provider',
      availableBalance: 1000.00,
      pendingBalance: 0.00,
      isActive: true,
      isVerified: true
    });
    
    console.log('Provider created:', {
      id: provider.id,
      email: provider.email,
      userType: provider.userType,
      availableBalance: provider.availableBalance
    });
    
    // Create requirer user
    const requirer = await User.create({
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      firstName: 'Jane',
      lastName: 'Requirer',
      email: 'requirer@test.com',
      phone: '+0987654321',
      password: hashedPassword,
      userType: 'requirer',
      availableBalance: 500.00,
      pendingBalance: 0.00,
      isActive: true,
      isVerified: true
    });
    
    console.log('Requirer created:', {
      id: requirer.id,
      email: requirer.email,
      userType: requirer.userType,
      availableBalance: requirer.availableBalance
    });
    
    // Verify users were created
    const userCount = await User.count();
    console.log('Total users in database:', userCount);
    
  } catch (error) {
    console.error('Error creating users:', error);
  }
}

createUsers();