const jwt = require('jsonwebtoken');
require('dotenv').config();

// Provider user ID from the database
const providerId = '2280bea7-8b16-4147-a18c-3d73784700ab';
const requirerId = 'b37a1beb-eca5-4898-8509-2fe222338219';

// Generate tokens
const providerToken = jwt.sign(
  { userId: providerId },
  process.env.JWT_SECRET || 'your-secret-key',
  { expiresIn: '24h' }
);

const requirerToken = jwt.sign(
  { userId: requirerId },
  process.env.JWT_SECRET || 'your-secret-key',
  { expiresIn: '24h' }
);

console.log('Provider Token:', providerToken);
console.log('\nRequirer Token:', requirerToken);
console.log('\nTest the balance endpoint with:');
console.log(`curl -H "Authorization: Bearer ${providerToken}" http://localhost:3000/api/payments/balance`);