const { User } = require('./models');

async function testUserModel() {
  try {
    console.log('Testing User model...');
    
    // Test finding all users
    const allUsers = await User.findAll({
      attributes: ['id', 'email', 'userType', 'availableBalance']
    });
    
    console.log('All users found:', allUsers.length);
    allUsers.forEach(user => {
      console.log('User:', {
        id: user.id,
        email: user.email,
        userType: user.userType,
        availableBalance: user.availableBalance
      });
    });
    
    // Test finding specific user by ID
    const providerId = '2280bea7-8b16-4147-a18c-3d73784700ab';
    const user = await User.findByPk(providerId, {
      attributes: { exclude: ['password', 'refreshToken'] }
    });
    
    if (user) {
      console.log('Found user by ID:', {
        id: user.id,
        email: user.email,
        userType: user.userType,
        availableBalance: user.availableBalance,
        isActive: user.isActive
      });
    } else {
      console.log('User not found by ID:', providerId);
    }
    
  } catch (error) {
    console.error('Error testing User model:', error);
  }
}

testUserModel();