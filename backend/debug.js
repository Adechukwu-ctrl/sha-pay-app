// Debug script to check imports
try {
  console.log('=== AuthController Debug ===');
  const authController = require('./controllers/authController');
  console.log('AuthController exports:', Object.keys(authController));
  console.log('register function:', typeof authController.register);
  
  console.log('\n=== Validation Debug ===');
  const validation = require('./middleware/validation');
  console.log('Validation exports:', Object.keys(validation));
  console.log('userValidations:', typeof validation.userValidations);
  console.log('userValidations.register:', typeof validation.userValidations?.register);
  console.log('userValidations.register content:', validation.userValidations?.register);
  
  console.log('\n=== Spread Test ===');
  if (validation.userValidations?.register) {
    const spread = [...validation.userValidations.register];
    console.log('Spread result:', spread);
    console.log('Spread types:', spread.map(item => typeof item));
  }
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}