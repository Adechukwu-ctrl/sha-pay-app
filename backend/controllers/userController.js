const { User, Service, Booking, Review } = require('../models');
const { asyncHandler, AppError, ValidationError, NotFoundError, AuthorizationError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const { uploadToCloudinary, uploadToS3, deleteFromCloud } = require('../config/cloudStorage');
const emailService = require('../services/emailService');

// Get all users (admin only)
const getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    userType,
    isEmailVerified,
    isPhoneVerified,
    isActive
  } = req.query;

  const offset = (page - 1) * limit;
  const order = [[sortBy, sortOrder.toUpperCase()]];

  // Build where clause
  const where = {};

  if (search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (userType) {
    where.userType = userType;
  }

  if (isEmailVerified !== undefined) {
    where.isEmailVerified = isEmailVerified === 'true';
  }

  if (isPhoneVerified !== undefined) {
    where.isPhoneVerified = isPhoneVerified === 'true';
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const { count, rows: users } = await User.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order,
    attributes: { exclude: ['password', 'refreshToken', 'emailVerificationCode', 'phoneVerificationCode', 'passwordResetToken'] }
  });

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers: count,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
});

// Get user by ID
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requestingUserId = req.user.id;
  const isAdmin = req.user.userType === 'admin';

  const user = await User.findByPk(id, {
    attributes: { exclude: ['password', 'refreshToken', 'emailVerificationCode', 'phoneVerificationCode', 'passwordResetToken'] },
    include: [
      {
        model: Service,
        as: 'services',
        where: { isActive: true },
        required: false,
        limit: 5,
        order: [['createdAt', 'DESC']]
      },
      {
        model: Review,
        as: 'receivedReviews',
        required: false,
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'firstName', 'lastName', 'profilePicture']
          }
        ]
      }
    ]
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Hide sensitive information for non-admin users viewing other profiles
  if (id !== requestingUserId && !isAdmin) {
    const publicFields = [
      'id', 'firstName', 'lastName', 'userType', 'profilePicture',
      'bio', 'skills', 'isEmailVerified', 'isPhoneVerified',
      'rating', 'totalReviews', 'totalEarnings', 'joinedAt',
      'services', 'receivedReviews'
    ];
    
    const publicUser = {};
    publicFields.forEach(field => {
      if (user[field] !== undefined) {
        publicUser[field] = user[field];
      }
    });
    
    return res.json({
      success: true,
      data: { user: publicUser }
    });
  }

  res.json({
    success: true,
    data: { user }
  });
});

// Update user profile
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    firstName,
    lastName,
    phone,
    bio,
    dateOfBirth,
    gender,
    address,
    city,
    state,
    country,
    zipCode,
    latitude,
    longitude,
    skills,
    hourlyRate,
    availability,
    languages,
    website,
    socialMedia
  } = req.body;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Check if phone number is already in use by another user
  if (phone && phone !== user.phone) {
    const existingPhone = await User.findOne({
      where: {
        phone,
        id: { [Op.ne]: userId }
      }
    });
    
    if (existingPhone) {
      throw new ValidationError('Phone number is already in use');
    }
    
    // If phone is being changed, reset phone verification
    user.isPhoneVerified = false;
    user.phoneVerifiedAt = null;
  }

  // Update user fields
  const updateFields = {
    firstName,
    lastName,
    phone,
    bio,
    dateOfBirth,
    gender,
    address,
    city,
    state,
    country,
    zipCode,
    latitude,
    longitude,
    skills,
    hourlyRate,
    availability,
    languages,
    website,
    socialMedia,
    updatedAt: new Date()
  };

  // Remove undefined fields
  Object.keys(updateFields).forEach(key => {
    if (updateFields[key] === undefined) {
      delete updateFields[key];
    }
  });

  await user.update(updateFields);

  // Return updated user without sensitive data
  const updatedUser = await User.findByPk(userId, {
    attributes: { exclude: ['password', 'refreshToken', 'emailVerificationCode', 'phoneVerificationCode', 'passwordResetToken'] }
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: updatedUser }
  });
});

// Upload profile picture
const uploadProfilePicture = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  let uploadResult;
  
  try {
    // Try Cloudinary first, then S3 as fallback
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      uploadResult = await uploadToCloudinary(req.file, {
        folder: 'sha-pay/profiles',
        transformation: { width: 300, height: 300, crop: 'fill' },
        public_id: `profile-${userId}-${Date.now()}`
      });
    } else if (process.env.AWS_ACCESS_KEY_ID) {
      uploadResult = await uploadToS3(req.file, `profiles/profile-${userId}-${Date.now()}`, {
        contentType: req.file.mimetype
      });
    } else {
      throw new Error('No cloud storage service configured');
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      try {
        await deleteFromCloud(user.profilePicture);
      } catch (error) {
        console.error('Failed to delete old profile picture:', error.message, '\nStack:', error.stack);
      }
    }

    // Update user profile picture
    user.profilePicture = uploadResult.secure_url || uploadResult.url;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Profile picture upload failed:', error.message, '\nStack:', error.stack);
    throw new ValidationError('Failed to upload profile picture. Please try again.');
  }
});

// Delete profile picture
const deleteProfilePicture = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (!user.profilePicture) {
    throw new ValidationError('No profile picture to delete');
  }

  // Delete file from cloud storage
  try {
    await deleteFromCloud(user.profilePicture);
  } catch (error) {
    console.error('Failed to delete profile picture:', error.message, '\nStack:', error.stack);
    // Continue with database update even if cloud deletion fails
  }

  // Remove profile picture from user
  user.profilePicture = null;
  await user.save();

  res.json({
    success: true,
    message: 'Profile picture deleted successfully'
  });
});

// Get user statistics
const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.params.id || req.user.id;
  const requestingUserId = req.user.id;
  const isAdmin = req.user.userType === 'admin';

  // Check if user can view these stats
  if (userId !== requestingUserId && !isAdmin) {
    throw new AuthorizationError('Access denied');
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Get service statistics for providers
  let serviceStats = null;
  if (user.userType === 'provider') {
    const services = await Service.findAll({
      where: { providerId: userId },
      attributes: ['id', 'isActive']
    });

    serviceStats = {
      totalServices: services.length,
      activeServices: services.filter(s => s.isActive).length,
      inactiveServices: services.filter(s => !s.isActive).length
    };
  }

  // Get booking statistics
  const bookingWhere = user.userType === 'provider' 
    ? { providerId: userId }
    : { requesterId: userId };

  const bookings = await Booking.findAll({
    where: bookingWhere,
    attributes: ['id', 'status', 'totalAmount']
  });

  const bookingStats = {
    totalBookings: bookings.length,
    completedBookings: bookings.filter(b => b.status === 'completed').length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
    totalEarnings: user.userType === 'provider' 
      ? bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0)
      : null,
    totalSpent: user.userType === 'requester'
      ? bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0)
      : null
  };

  // Get review statistics
  const reviews = await Review.findAll({
    where: { revieweeId: userId },
    attributes: ['rating']
  });

  const reviewStats = {
    totalReviews: reviews.length,
    rating: reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0
  };

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        joinedAt: user.createdAt
      },
      serviceStats,
      bookingStats,
      reviewStats
    }
  });
});

// Deactivate user account
const deactivateAccount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { reason } = req.body;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (!user.isActive) {
    throw new ValidationError('Account is already deactivated');
  }

  // Deactivate user
  user.isActive = false;
  user.deactivatedAt = new Date();
  user.deactivationReason = reason;
  user.refreshToken = null; // Invalidate all sessions
  await user.save();

  // Deactivate all user's services
  await Service.update(
    { isActive: false },
    { where: { providerId: userId } }
  );

  // Send deactivation email
  try {
    await emailService.sendAccountDeactivationEmail(user.email, user.firstName);
  } catch (error) {
    console.error('Failed to send deactivation email:', error.message, '\nStack:', error.stack);
  }

  res.json({
    success: true,
    message: 'Account deactivated successfully'
  });
});

// Reactivate user account
const reactivateAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.userType === 'admin';

  if (!isAdmin) {
    throw new AuthorizationError('Only administrators can reactivate accounts');
  }

  const user = await User.findByPk(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.isActive) {
    throw new ValidationError('Account is already active');
  }

  // Reactivate user
  user.isActive = true;
  user.deactivatedAt = null;
  user.deactivationReason = null;
  await user.save();

  // Send reactivation email
  try {
    await emailService.sendAccountReactivationEmail(user.email, user.firstName);
  } catch (error) {
    console.error('Failed to send reactivation email:', error.message, '\nStack:', error.stack);
  }

  res.json({
    success: true,
    message: 'Account reactivated successfully'
  });
});

// Delete user account (admin only)
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.userType === 'admin';

  if (!isAdmin) {
    throw new AuthorizationError('Only administrators can delete accounts');
  }

  const user = await User.findByPk(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Delete user's profile picture
  if (user.profilePicture) {
    try {
      await uploadService.deleteFile(user.profilePicture);
    } catch (error) {
      console.error('Failed to delete profile picture:', error.message, '\nStack:', error.stack);
    }
  }

  // Delete user (this will cascade to related records)
  await user.destroy();

  res.json({
    success: true,
    message: 'User account deleted successfully'
  });
});

// Search users
const searchUsers = asyncHandler(async (req, res) => {
  const {
    q: query,
    userType,
    skills,
    location,
    radius = 50,
    minRating,
    page = 1,
    limit = 20,
    sortBy = 'rating',
    sortOrder = 'desc'
  } = req.query;

  const offset = (page - 1) * limit;
  const order = [[sortBy, sortOrder.toUpperCase()]];

  // Build where clause
  const where = {
    isActive: true,
    isEmailVerified: true
  };

  if (query) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${query}%` } },
      { lastName: { [Op.iLike]: `%${query}%` } },
      { bio: { [Op.iLike]: `%${query}%` } },
      { skills: { [Op.contains]: [query] } }
    ];
  }

  if (userType) {
    where.userType = userType;
  }

  if (skills) {
    const skillsArray = skills.split(',').map(skill => skill.trim());
    where.skills = { [Op.overlap]: skillsArray };
  }

  if (minRating) {
    where.rating = { [Op.gte]: parseFloat(minRating) };
  }

  // Location-based search (simplified - would need proper geospatial queries in production)
  if (location) {
    where[Op.or] = [
      ...(where[Op.or] || []),
      { city: { [Op.iLike]: `%${location}%` } },
      { state: { [Op.iLike]: `%${location}%` } },
      { country: { [Op.iLike]: `%${location}%` } }
    ];
  }

  const { count, rows: users } = await User.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order,
    attributes: {
      exclude: [
        'password', 'refreshToken', 'emailVerificationCode',
        'phoneVerificationCode', 'passwordResetToken', 'email',
        'phone', 'loginAttempts', 'accountLockedUntil'
      ]
    },
    include: [
      {
        model: Service,
        as: 'services',
        where: { isActive: true },
        required: false,
        limit: 3,
        attributes: ['id', 'title', 'price', 'currency', 'rating']
      }
    ]
  });

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers: count,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  getUserStats,
  deactivateAccount,
  reactivateAccount,
  deleteUser,
  searchUsers
};