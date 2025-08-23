const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock user data
const users = [
  {
    id: 1,
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    phone: '+2348012345678'
  }
];

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email, password });
  
  // Find user
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        userType: 'service_requester'
      },
      accessToken: 'mock-jwt-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now()
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { firstName, lastName, email, password, phone, userType, acceptTerms, acceptPrivacy } = req.body;
  
  console.log('Registration attempt:', { firstName, lastName, email, phone, userType, acceptTerms, acceptPrivacy });
  console.log('Full request body:', req.body);
  
  // Validate required fields
  if (!firstName || !lastName || !email || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: 'All required fields must be filled'
    });
  }
  
  if (!acceptTerms || !acceptPrivacy) {
    return res.status(400).json({
      success: false,
      message: 'You must accept the terms and privacy policy'
    });
  }
  
  // Check if user already exists
  const existingUser = users.find(u => u.email === email);
  
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists'
    });
  }
  
  // Map frontend userType to backend expected values
  const mappedUserType = userType === 'requirer' ? 'service_requester' : 
                        userType === 'provider' ? 'service_provider' : 
                        userType || 'service_requester';

  // Create new user
  const newUser = {
    id: users.length + 1,
    firstName,
    lastName,
    email,
    password,
    phone,
    userType: mappedUserType
  };
  
  users.push(newUser);
  
  res.status(201).json({
    user: {
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      phone: newUser.phone,
      userType: newUser.userType
    },
    accessToken: 'mock-jwt-token-' + Date.now(),
    refreshToken: 'mock-refresh-token-' + Date.now()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'Sha Pay Backend API',
    version: '1.0.0',
    endpoints: {
      login: 'POST /api/auth/login',
      register: 'POST /api/auth/register',
      health: 'GET /api/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Sha Pay Backend Server running on http://localhost:${PORT}`);
  console.log(`📋 API Documentation available at http://localhost:${PORT}`);
  console.log('\n📍 Available endpoints:');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/auth/register');
  console.log('  GET /api/health');
  console.log('\n🔐 Test credentials:');
  console.log('  Email: test@example.com');
  console.log('  Password: password123');
});

module.exports = app;