const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  resendEmailVerification,
  verifyPhone,
  resendPhoneVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile
} = require('../controllers/authController');
const {
  handleValidationErrors,
  userValidations
} = require('../middleware/validation');
const { body } = require('express-validator');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { authRateLimit, passwordResetRateLimit, registrationRateLimit } = require('../middleware/security');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - phone
 *               - password
 *               - firstName
 *               - lastName
 *               - userType
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               phone:
 *                 type: string
 *                 example: "+2348012345678"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "SecurePass123!"
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               userType:
 *                 type: string
 *                 enum: [provider, requirer]
 *                 example: "provider"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', 
  registrationRateLimit,
  ...userValidations.register,
  register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email or phone number
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "SecurePass123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login',
  authRateLimit,
  ...userValidations.login,
  login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh',
  authRateLimit,
  refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout',
  verifyToken,
  logout
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with code
 * @access  Public
 */
router.post('/verify-email',
  authRateLimit,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits'),
    handleValidationErrors
  ],
  verifyEmail
);

/**
 * @route   POST /api/auth/resend-email-verification
 * @desc    Resend email verification
 * @access  Private
 */
router.post('/resend-email-verification',
  authRateLimit,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    handleValidationErrors
  ],
  resendEmailVerification
);

/**
 * @route   POST /api/auth/verify-phone
 * @desc    Verify phone number with OTP
 * @access  Private
 */
router.post('/verify-phone',
  authRateLimit,
  [
    body('phone').isMobilePhone().withMessage('Valid phone number is required'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits'),
    handleValidationErrors
  ],
  verifyPhone
);

/**
 * @route   POST /api/auth/resend-phone-verification
 * @desc    Resend phone verification OTP
 * @access  Private
 */
router.post('/resend-phone-verification',
  authRateLimit,
  [
    body('phone').isMobilePhone().withMessage('Valid phone number is required'),
    handleValidationErrors
  ],
  resendPhoneVerification
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password',
  passwordResetRateLimit,
  ...userValidations.forgotPassword,
  forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password',
  passwordResetRateLimit,
  ...userValidations.resetPassword,
  resetPassword
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (authenticated user)
 * @access  Private
 */
router.post('/change-password',
  authRateLimit,
  verifyToken,
  ...userValidations.changePassword,
  changePassword
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile',
  verifyToken,
  getProfile
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info (alias for profile)
 * @access  Private
 */
router.get('/me',
  verifyToken,
  getProfile
);

/**
 * @route   GET /api/auth/check
 * @desc    Check if user is authenticated
 * @access  Public/Private
 */
router.get('/check',
  optionalAuth,
  (req, res) => {
    res.json({
      success: true,
      data: {
        isAuthenticated: !!req.user,
        user: req.user || null
      }
    });
  }
);

module.exports = router;