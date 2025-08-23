const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  providerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [5, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [20, 2000]
    }
  },
  category: {
    type: DataTypes.ENUM(
      'cleaning',
      'plumbing',
      'electrical',
      'carpentry',
      'painting',
      'gardening',
      'tutoring',
      'delivery',
      'photography',
      'catering',
      'beauty',
      'fitness',
      'tech_support',
      'automotive',
      'pet_care',
      'home_repair',
      'moving',
      'event_planning',
      'consulting',
      'other'
    ),
    allowNull: false
  },
  subcategory: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  serviceType: {
    type: DataTypes.ENUM('one_time', 'recurring', 'project_based'),
    allowNull: false,
    defaultValue: 'one_time'
  },
  pricingType: {
    type: DataTypes.ENUM('fixed', 'hourly', 'per_item', 'negotiable'),
    allowNull: false,
    defaultValue: 'fixed'
  },
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'NGN'
  },
  duration: {
    type: DataTypes.INTEGER, // Duration in minutes
    allowNull: true,
    validate: {
      min: 15
    }
  },
  location: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      type: 'remote', // 'remote', 'client_location', 'provider_location', 'flexible'
      address: null,
      city: null,
      state: null,
      country: 'Nigeria',
      radius: 10, // Service radius in km
      coordinates: {
        latitude: null,
        longitude: null
      }
    }
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  requirements: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      tools: [],
      materials: [],
      skills: [],
      experience: null,
      certifications: []
    }
  },
  availability: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      schedule: {
        monday: { available: true, hours: '09:00-17:00' },
        tuesday: { available: true, hours: '09:00-17:00' },
        wednesday: { available: true, hours: '09:00-17:00' },
        thursday: { available: true, hours: '09:00-17:00' },
        friday: { available: true, hours: '09:00-17:00' },
        saturday: { available: false, hours: '' },
        sunday: { available: false, hours: '' }
      },
      advanceBooking: 24, // Hours in advance required
      maxBookingsPerDay: 5
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isPromoted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  promotionExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 5
    }
  },
  totalRatings: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalBookings: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  completedBookings: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  cancelledBookings: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastBookedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  featuredUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'paused', 'suspended', 'archived'),
    defaultValue: 'draft'
  },
  moderationStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'flagged'),
    defaultValue: 'pending'
  },
  moderationNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  seoTitle: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  seoDescription: {
    type: DataTypes.STRING(300),
    allowNull: true
  },
  seoKeywords: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  faqs: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  policies: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      cancellation: {
        policy: 'flexible', // 'flexible', 'moderate', 'strict'
        freeUntil: 24, // Hours before service
        refundPercentage: 100
      },
      rescheduling: {
        allowed: true,
        freeUntil: 12, // Hours before service
        maxReschedules: 2
      },
      payment: {
        advancePayment: 0, // Percentage
        paymentMethods: ['card', 'bank_transfer', 'cash']
      }
    }
  },
  addOns: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  packages: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  discounts: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      bulkDiscount: {
        enabled: false,
        threshold: 5,
        percentage: 10
      },
      firstTimeDiscount: {
        enabled: false,
        percentage: 15
      },
      seasonalDiscount: {
        enabled: false,
        startDate: null,
        endDate: null,
        percentage: 20
      }
    }
  },
  analytics: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      rating: 0,
      responseTime: 0
    }
  }
}, {
  tableName: 'services',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['provider_id']
    },
    {
      fields: ['category']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['status']
    },
    {
      fields: ['rating']
    },
    {
      fields: ['base_price']
    },
    {
      fields: ['featured']
    },
    {
      fields: ['moderation_status']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['location']
    }
  ]
});

// Instance methods
Service.prototype.incrementViews = async function() {
  return this.update({ 
    views: this.views + 1,
    'analytics.impressions': this.analytics.impressions + 1
  });
};

Service.prototype.updateRating = async function(newRating) {
  const totalRatings = this.totalRatings + 1;
  const currentTotal = this.rating * this.totalRatings;
  const newAverage = (currentTotal + newRating) / totalRatings;
  
  return this.update({
    rating: Math.round(newAverage * 100) / 100,
    totalRatings: totalRatings,
    'analytics.rating': Math.round(newAverage * 100) / 100
  });
};

Service.prototype.incrementBookings = async function() {
  return this.update({ 
    totalBookings: this.totalBookings + 1,
    lastBookedAt: new Date(),
    'analytics.conversions': this.analytics.conversions + 1
  });
};

Service.prototype.incrementCompletedBookings = async function() {
  return this.update({ 
    completedBookings: this.completedBookings + 1
  });
};

Service.prototype.incrementCancelledBookings = async function() {
  return this.update({ 
    cancelledBookings: this.cancelledBookings + 1
  });
};

Service.prototype.getSuccessRate = function() {
  if (this.totalBookings === 0) return 0;
  return Math.round((this.completedBookings / this.totalBookings) * 100);
};

Service.prototype.isAvailableOn = function(date, time) {
  const dayName = date.toLocaleLowerCase();
  const availability = this.availability.schedule[dayName];
  
  if (!availability || !availability.available) {
    return false;
  }
  
  if (!availability.hours) {
    return true;
  }
  
  const [startTime, endTime] = availability.hours.split('-');
  return time >= startTime && time <= endTime;
};

Service.prototype.calculatePrice = function(options = {}) {
  let price = parseFloat(this.basePrice);
  
  // Apply duration-based pricing for hourly services
  if (this.pricingType === 'hourly' && options.duration) {
    price = price * (options.duration / 60); // Convert minutes to hours
  }
  
  // Apply quantity-based pricing
  if (this.pricingType === 'per_item' && options.quantity) {
    price = price * options.quantity;
  }
  
  // Apply add-ons
  if (options.addOns && Array.isArray(options.addOns)) {
    const addOnPrices = options.addOns.reduce((total, addOnId) => {
      const addOn = this.addOns.find(a => a.id === addOnId);
      return total + (addOn ? parseFloat(addOn.price) : 0);
    }, 0);
    price += addOnPrices;
  }
  
  // Apply discounts
  if (options.applyDiscounts) {
    if (this.discounts.firstTimeDiscount.enabled && options.isFirstTime) {
      price = price * (1 - this.discounts.firstTimeDiscount.percentage / 100);
    }
    
    if (this.discounts.bulkDiscount.enabled && options.quantity >= this.discounts.bulkDiscount.threshold) {
      price = price * (1 - this.discounts.bulkDiscount.percentage / 100);
    }
  }
  
  return Math.round(price * 100) / 100; // Round to 2 decimal places
};

Service.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Add computed fields
  values.successRate = this.getSuccessRate();
  
  return values;
};

// Static methods
Service.getPopularCategories = async function() {
  const result = await this.findAll({
    attributes: [
      'category',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    where: {
      isActive: true,
      status: 'active'
    },
    group: ['category'],
    order: [[sequelize.literal('count'), 'DESC']],
    limit: 10
  });
  
  return result;
};

Service.getFeaturedServices = async function(limit = 10) {
  return this.findAll({
    where: {
      featured: true,
      isActive: true,
      status: 'active',
      featuredUntil: {
        [sequelize.Op.gt]: new Date()
      }
    },
    order: [['rating', 'DESC'], ['totalBookings', 'DESC']],
    limit
  });
};

module.exports = Service;