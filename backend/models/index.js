const { sequelize } = require('../config/database');
const User = require('./User');
const Service = require('./Service');
const Booking = require('./Booking');
const Payment = require('./Payment');

// Define associations

// User associations
User.hasMany(Service, {
  foreignKey: 'providerId',
  as: 'services',
  onDelete: 'CASCADE'
});

User.hasMany(Booking, {
  foreignKey: 'requesterId',
  as: 'requestedBookings',
  onDelete: 'CASCADE'
});

User.hasMany(Booking, {
  foreignKey: 'providerId',
  as: 'providedBookings',
  onDelete: 'CASCADE'
});

User.hasMany(Payment, {
  foreignKey: 'payerId',
  as: 'paymentsMade',
  onDelete: 'CASCADE'
});

User.hasMany(Payment, {
  foreignKey: 'payeeId',
  as: 'paymentsReceived',
  onDelete: 'CASCADE'
});

// Service associations
Service.belongsTo(User, {
  foreignKey: 'providerId',
  as: 'provider',
  onDelete: 'CASCADE'
});

Service.hasMany(Booking, {
  foreignKey: 'serviceId',
  as: 'bookings',
  onDelete: 'CASCADE'
});

// Booking associations
Booking.belongsTo(User, {
  foreignKey: 'requesterId',
  as: 'requester',
  onDelete: 'CASCADE'
});

Booking.belongsTo(User, {
  foreignKey: 'providerId',
  as: 'provider',
  onDelete: 'CASCADE'
});

Booking.belongsTo(Service, {
  foreignKey: 'serviceId',
  as: 'service',
  onDelete: 'CASCADE'
});

Booking.hasMany(Payment, {
  foreignKey: 'bookingId',
  as: 'payments',
  onDelete: 'CASCADE'
});

// Self-referencing association for recurring bookings
Booking.belongsTo(Booking, {
  foreignKey: 'parentBookingId',
  as: 'parentBooking',
  onDelete: 'SET NULL'
});

Booking.hasMany(Booking, {
  foreignKey: 'parentBookingId',
  as: 'childBookings',
  onDelete: 'CASCADE'
});

// Payment associations
Payment.belongsTo(User, {
  foreignKey: 'payerId',
  as: 'payer',
  onDelete: 'CASCADE'
});

Payment.belongsTo(User, {
  foreignKey: 'payeeId',
  as: 'payee',
  onDelete: 'CASCADE'
});

Payment.belongsTo(Booking, {
  foreignKey: 'bookingId',
  as: 'booking',
  onDelete: 'CASCADE'
});

// Additional models for future features

// Review model for ratings and reviews
const Review = sequelize.define('Review', {
  id: {
    type: sequelize.Sequelize.DataTypes.UUID,
    defaultValue: sequelize.Sequelize.DataTypes.UUIDV4,
    primaryKey: true
  },
  bookingId: {
    type: sequelize.Sequelize.DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'bookings',
      key: 'id'
    }
  },
  reviewerId: {
    type: sequelize.Sequelize.DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  revieweeId: {
    type: sequelize.Sequelize.DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  serviceId: {
    type: sequelize.Sequelize.DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'services',
      key: 'id'
    }
  },
  rating: {
    type: sequelize.Sequelize.DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  review: {
    type: sequelize.Sequelize.DataTypes.TEXT,
    allowNull: true
  },
  isPublic: {
    type: sequelize.Sequelize.DataTypes.BOOLEAN,
    defaultValue: true
  },
  isVerified: {
    type: sequelize.Sequelize.DataTypes.BOOLEAN,
    defaultValue: false
  },
  helpfulCount: {
    type: sequelize.Sequelize.DataTypes.INTEGER,
    defaultValue: 0
  },
  reportCount: {
    type: sequelize.Sequelize.DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'reviews',
  timestamps: true,
  paranoid: true
});

// Notification model
const Notification = sequelize.define('Notification', {
  id: {
    type: sequelize.Sequelize.DataTypes.UUID,
    defaultValue: sequelize.Sequelize.DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: sequelize.Sequelize.DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: sequelize.Sequelize.DataTypes.ENUM(
      'booking_request',
      'booking_confirmed',
      'booking_cancelled',
      'booking_completed',
      'payment_received',
      'payment_failed',
      'review_received',
      'service_approved',
      'service_rejected',
      'account_verified',
      'promotion',
      'system_update'
    ),
    allowNull: false
  },
  title: {
    type: sequelize.Sequelize.DataTypes.STRING(200),
    allowNull: false
  },
  message: {
    type: sequelize.Sequelize.DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: sequelize.Sequelize.DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  isRead: {
    type: sequelize.Sequelize.DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: sequelize.Sequelize.DataTypes.DATE,
    allowNull: true
  },
  actionUrl: {
    type: sequelize.Sequelize.DataTypes.STRING(500),
    allowNull: true
  },
  priority: {
    type: sequelize.Sequelize.DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  expiresAt: {
    type: sequelize.Sequelize.DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  paranoid: true
});

// Message model for in-app messaging
const Message = sequelize.define('Message', {
  id: {
    type: sequelize.Sequelize.DataTypes.UUID,
    defaultValue: sequelize.Sequelize.DataTypes.UUIDV4,
    primaryKey: true
  },
  bookingId: {
    type: sequelize.Sequelize.DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'bookings',
      key: 'id'
    }
  },
  senderId: {
    type: sequelize.Sequelize.DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  receiverId: {
    type: sequelize.Sequelize.DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  content: {
    type: sequelize.Sequelize.DataTypes.TEXT,
    allowNull: false
  },
  messageType: {
    type: sequelize.Sequelize.DataTypes.ENUM('text', 'image', 'file', 'location', 'system'),
    defaultValue: 'text'
  },
  attachments: {
    type: sequelize.Sequelize.DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  isRead: {
    type: sequelize.Sequelize.DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: sequelize.Sequelize.DataTypes.DATE,
    allowNull: true
  },
  isEdited: {
    type: sequelize.Sequelize.DataTypes.BOOLEAN,
    defaultValue: false
  },
  editedAt: {
    type: sequelize.Sequelize.DataTypes.DATE,
    allowNull: true
  },
  isDeleted: {
    type: sequelize.Sequelize.DataTypes.BOOLEAN,
    defaultValue: false
  },
  deletedAt: {
    type: sequelize.Sequelize.DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'messages',
  timestamps: true,
  paranoid: true
});

// Category model for service categories
const Category = sequelize.define('Category', {
  id: {
    type: sequelize.Sequelize.DataTypes.UUID,
    defaultValue: sequelize.Sequelize.DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: sequelize.Sequelize.DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  slug: {
    type: sequelize.Sequelize.DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: sequelize.Sequelize.DataTypes.TEXT,
    allowNull: true
  },
  icon: {
    type: sequelize.Sequelize.DataTypes.STRING(255),
    allowNull: true
  },
  image: {
    type: sequelize.Sequelize.DataTypes.STRING(255),
    allowNull: true
  },
  parentId: {
    type: sequelize.Sequelize.DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  isActive: {
    type: sequelize.Sequelize.DataTypes.BOOLEAN,
    defaultValue: true
  },
  sortOrder: {
    type: sequelize.Sequelize.DataTypes.INTEGER,
    defaultValue: 0
  },
  serviceCount: {
    type: sequelize.Sequelize.DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'categories',
  timestamps: true,
  paranoid: true
});

// Define additional associations

// Review associations
Review.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });
Review.belongsTo(User, { foreignKey: 'revieweeId', as: 'reviewee' });
Review.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
Review.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

User.hasMany(Review, { foreignKey: 'reviewerId', as: 'reviewsGiven' });
User.hasMany(Review, { foreignKey: 'revieweeId', as: 'reviewsReceived' });
Booking.hasMany(Review, { foreignKey: 'bookingId', as: 'reviews' });
Service.hasMany(Review, { foreignKey: 'serviceId', as: 'reviews' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

// Message associations
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
Message.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
Booking.hasMany(Message, { foreignKey: 'bookingId', as: 'messages' });

// Category associations
Category.belongsTo(Category, { foreignKey: 'parentId', as: 'parent' });
Category.hasMany(Category, { foreignKey: 'parentId', as: 'children' });

// Sync database (only in development)
const syncDatabase = async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized successfully.');
    }
  } catch (error) {
    console.error('❌ Error synchronizing database models:', error.message);
  }
};

// Export all models and utilities
module.exports = {
  sequelize,
  User,
  Service,
  Booking,
  Payment,
  Review,
  Notification,
  Message,
  Category,
  syncDatabase
};