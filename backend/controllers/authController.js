const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const { asyncHandler, AppError, ValidationError, AuthenticationError } = require('../middleware/errorHandler');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');

// Generate verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Register new user
const register = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    userType,
    agreeToTerms,
    agreeToPrivacy
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ValidationError('User with this email already exists');
  }

  // Check if phone number is already in use
  if (phone) {
    const existingPhone = await User.findOne({ where: { phone } });
    if (existingPhone) {
      throw new ValidationError('User with this phone number already exists');
    }
  }

  // Generate verification codes
  const emailVerificationCode = generateVerificationCode();
  const phoneVerificationCode = phone ? generateVerificationCode() : null;

  // Create user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    phone,
    userType,
    agreeToTerms,
    agreeToPrivacy,
    emailVerificationCode,
    phoneVerificationCode,
    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    phoneVerificationExpires: phone ? new Date(Date.now() + 15 * 60 * 1000) : null, // 15 minutes
    registrationIP: req.ip,
    lastLoginIP: req.ip
  });

  // Send verification email
  try {
    await emailService.sendVerificationEmail(user.email, emailVerificationCode, user.firstName);
  } catch (error) {
    console.error('Failed to send verification email:', error.message, '\nStack:', error.stack);
    // Don't fail registration if email fails
  }

  // Send verification SMS if phone provided
  if (phone && phoneVerificationCode) {
    try {
      await smsService.sendVerificationSMS(phone, phoneVerificationCode);
    } catch (error) {
      console.error('Failed to send verification SMS:', error.message, '\nStack:', error.stack);
      // Don't fail registration if SMS fails
    }
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save();

  // Remove sensitive data from response
  const userResponse = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    userType: user.userType,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    createdAt: user.createdAt
  };

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please check your email for verification.',
    data: {
      user: userResponse,
      accessToken,
      refreshToken
    }
  });
});

// Login user
const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe = false } = req.body;

  // Find user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Check if account is locked
  if (user.isAccountLocked()) {
    const lockTimeRemaining = Math.ceil((user.accountLockedUntil - Date.now()) / 1000 / 60);
    throw new AuthenticationError(`Account is locked. Try again in ${lockTimeRemaining} minutes.`);
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    await user.incrementLoginAttempts();
    throw new AuthenticationError('Invalid email or password');
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    user.loginAttempts = 0;
    user.accountLockedUntil = null;
  }

  // Update last login
  await user.updateLastLogin(req.ip);

  // Generate tokens
  const tokenExpiry = rememberMe ? '30d' : '1d';
  const { accessToken, refreshToken } = generateTokens(user.id, tokenExpiry);

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save();

  // Remove sensitive data from response
  const userResponse = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    userType: user.userType,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    profilePicture: user.profilePicture,
    lastLoginAt: user.lastLoginAt
  };

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userResponse,
      accessToken,
      refreshToken
    }
  });
});

// Refresh access token
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new AuthenticationError('Refresh token is required');
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(token);
  
  // Find user
  const user = await User.findByPk(decoded.userId);
  if (!user || user.refreshToken !== token) {
    throw new AuthenticationError('Invalid refresh token');
  }

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

  // Update refresh token
  user.refreshToken = newRefreshToken;
  await user.save();

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken,
      refreshToken: newRefreshToken
    }
  });
});

// Logout user
const logout = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  
  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Verify email
const verifyEmail = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  if (user.isEmailVerified) {
    return res.json({
      success: true,
      message: 'Email is already verified'
    });
  }

  // Check verification code
  if (user.emailVerificationCode !== code) {
    throw new ValidationError('Invalid verification code');
  }

  // Check if code has expired
  if (user.emailVerificationExpires < new Date()) {
    throw new ValidationError('Verification code has expired');
  }

  // Verify email
  user.isEmailVerified = true;
  user.emailVerificationCode = null;
  user.emailVerificationExpires = null;
  user.emailVerifiedAt = new Date();
  await user.save();

  res.json({
    success: true,
    message: 'Email verified successfully'
  });
});

// Resend email verification
const resendEmailVerification = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  if (user.isEmailVerified) {
    return res.json({
      success: true,
      message: 'Email is already verified'
    });
  }

  // Generate new verification code
  const emailVerificationCode = generateVerificationCode();
  user.emailVerificationCode = emailVerificationCode;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await user.save();

  // Send verification email
  await emailService.sendVerificationEmail(user.email, emailVerificationCode, user.firstName);

  res.json({
    success: true,
    message: 'Verification email sent successfully'
  });
});

// Verify phone
const verifyPhone = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  if (user.isPhoneVerified) {
    return res.json({
      success: true,
      message: 'Phone is already verified'
    });
  }

  // Check verification code
  if (user.phoneVerificationCode !== code) {
    throw new ValidationError('Invalid verification code');
  }

  // Check if code has expired
  if (user.phoneVerificationExpires < new Date()) {
    throw new ValidationError('Verification code has expired');
  }

  // Verify phone
  user.isPhoneVerified = true;
  user.phoneVerificationCode = null;
  user.phoneVerificationExpires = null;
  user.phoneVerifiedAt = new Date();
  await user.save();

  res.json({
    success: true,
    message: 'Phone verified successfully'
  });
});

// Resend phone verification
const resendPhoneVerification = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  if (!user.phone) {
    throw new ValidationError('No phone number associated with this account');
  }

  if (user.isPhoneVerified) {
    return res.json({
      success: true,
      message: 'Phone is already verified'
    });
  }

  // Generate new verification code
  const phoneVerificationCode = generateVerificationCode();
  user.phoneVerificationCode = phoneVerificationCode;
  user.phoneVerificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  await user.save();

  // Send verification SMS
  await smsService.sendVerificationSMS(user.phone, phoneVerificationCode);

  res.json({
    success: true,
    message: 'Verification SMS sent successfully'
  });
});

// Forgot password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    // Don't reveal if email exists or not
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }

  // Generate reset token
  const resetToken = generateResetToken();
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // Send reset email
  try {
    await emailService.sendPasswordResetEmail(user.email, resetToken, user.firstName);
  } catch (error) {
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
    throw new AppError('Failed to send password reset email. Please try again.', 500);
  }

  res.json({
    success: true,
    message: 'Password reset link has been sent to your email.'
  });
});

// Reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // Find user by reset token
  const user = await User.findOne({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        [require('sequelize').Op.gt]: new Date()
      }
    }
  });

  if (!user) {
    throw new ValidationError('Invalid or expired reset token');
  }

  // Update password
  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.passwordChangedAt = new Date();
  user.refreshToken = null; // Invalidate all sessions
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successfully. Please login with your new password.'
  });
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, password } = req.body;
  const userId = req.user.id;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new ValidationError('Current password is incorrect');
  }

  // Update password
  user.password = password;
  user.passwordChangedAt = new Date();
  user.refreshToken = null; // Invalidate all sessions
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully. Please login again.'
  });
});

// Get current user profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password', 'refreshToken', 'emailVerificationCode', 'phoneVerificationCode', 'passwordResetToken'] }
  });

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  res.json({
    success: true,
    data: { user }
  });
});

module.exports = {
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
};