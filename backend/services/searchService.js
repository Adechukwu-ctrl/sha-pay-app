const { Service, User, Category, Review } = require('../models');
const { Op, Sequelize } = require('sequelize');
const winston = require('winston');

// Search service class
class SearchService {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'logs/search-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/search.log' })
      ]
    });
  }

  // Search services with advanced filters
  async searchServices({
    query = '',
    category = null,
    location = null,
    minPrice = null,
    maxPrice = null,
    rating = null,
    availability = null,
    sortBy = 'relevance',
    sortOrder = 'DESC',
    page = 1,
    limit = 20,
    latitude = null,
    longitude = null,
    radius = 10 // km
  } = {}) {
    try {
      const offset = (page - 1) * limit;
      const where = { status: 'active' };
      const include = [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'firstName', 'lastName', 'profilePicture', 'rating', 'totalReviews'],
          where: { status: 'active' }
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Review,
          as: 'reviews',
          attributes: ['rating'],
          required: false
        }
      ];

      // Text search
      if (query) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } },
          { tags: { [Op.contains]: [query] } },
          Sequelize.literal(`
            EXISTS (
              SELECT 1 FROM "Users" u 
              WHERE u.id = "Service"."providerId" 
              AND (u."firstName" ILIKE '%${query}%' OR u."lastName" ILIKE '%${query}%')
            )
          `)
        ];
      }

      // Category filter
      if (category) {
        if (Array.isArray(category)) {
          where.categoryId = { [Op.in]: category };
        } else {
          where.categoryId = category;
        }
      }

      // Location filter
      if (location) {
        if (typeof location === 'string') {
          where[Op.or] = [
            ...(where[Op.or] || []),
            { city: { [Op.iLike]: `%${location}%` } },
            { state: { [Op.iLike]: `%${location}%` } },
            { country: { [Op.iLike]: `%${location}%` } }
          ];
        } else if (location.city) {
          where.city = { [Op.iLike]: `%${location.city}%` };
        }
      }

      // Price range filter
      if (minPrice !== null || maxPrice !== null) {
        where.price = {};
        if (minPrice !== null) where.price[Op.gte] = minPrice;
        if (maxPrice !== null) where.price[Op.lte] = maxPrice;
      }

      // Rating filter
      if (rating !== null) {
        where.rating = { [Op.gte]: rating };
      }

      // Availability filter
      if (availability) {
        where.isAvailable = true;
        if (availability.date) {
          // Check if service is available on specific date
          where.availableDates = {
            [Op.contains]: [availability.date]
          };
        }
      }

      // Geographic search
      if (latitude && longitude && radius) {
        const earthRadius = 6371; // Earth's radius in kilometers
        where[Op.and] = Sequelize.literal(`
          (
            ${earthRadius} * acos(
              cos(radians(${latitude})) * 
              cos(radians(latitude)) * 
              cos(radians(longitude) - radians(${longitude})) + 
              sin(radians(${latitude})) * 
              sin(radians(latitude))
            )
          ) <= ${radius}
        `);
      }

      // Sorting
      let order = [];
      switch (sortBy) {
        case 'price_low':
          order = [['price', 'ASC']];
          break;
        case 'price_high':
          order = [['price', 'DESC']];
          break;
        case 'rating':
          order = [['rating', 'DESC']];
          break;
        case 'newest':
          order = [['createdAt', 'DESC']];
          break;
        case 'popular':
          order = [['viewCount', 'DESC']];
          break;
        case 'distance':
          if (latitude && longitude) {
            order = [Sequelize.literal(`
              (
                6371 * acos(
                  cos(radians(${latitude})) * 
                  cos(radians(latitude)) * 
                  cos(radians(longitude) - radians(${longitude})) + 
                  sin(radians(${latitude})) * 
                  sin(radians(latitude))
                )
              ) ASC
            `)];
          } else {
            order = [['createdAt', 'DESC']];
          }
          break;
        case 'relevance':
        default:
          if (query) {
            // Relevance scoring based on text match
            order = [
              Sequelize.literal(`
                CASE 
                  WHEN title ILIKE '%${query}%' THEN 1
                  WHEN description ILIKE '%${query}%' THEN 2
                  WHEN '${query}' = ANY(tags) THEN 3
                  ELSE 4
                END ASC
              `),
              ['rating', 'DESC'],
              ['viewCount', 'DESC']
            ];
          } else {
            order = [['rating', 'DESC'], ['viewCount', 'DESC']];
          }
      }

      // Execute search
      const { count, rows: services } = await Service.findAndCountAll({
        where,
        include,
        order,
        limit,
        offset,
        distinct: true,
        subQuery: false
      });

      // Calculate additional metrics
      const servicesWithMetrics = services.map(service => {
        const serviceData = service.toJSON();
        
        // Calculate distance if coordinates provided
        if (latitude && longitude && service.latitude && service.longitude) {
          serviceData.distance = this.calculateDistance(
            latitude, longitude,
            service.latitude, service.longitude
          );
        }

        // Calculate review summary
        if (service.reviews && service.reviews.length > 0) {
          const ratings = service.reviews.map(r => r.rating);
          serviceData.reviewSummary = {
            rating: ratings.reduce((a, b) => a + b, 0) / ratings.length,
            totalReviews: ratings.length
          };
        }

        return serviceData;
      });

      this.logger.info('Service search completed', {
        query,
        resultsCount: count,
        page,
        filters: { category, location, minPrice, maxPrice, rating }
      });

      return {
        services: servicesWithMetrics,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
          hasNext: page < Math.ceil(count / limit),
          hasPrev: page > 1
        },
        filters: {
          query,
          category,
          location,
          priceRange: { min: minPrice, max: maxPrice },
          rating,
          sortBy
        }
      };
    } catch (error) {
      this.logger.error('Service search failed:', error);
      throw error;
    }
  }

  // Search users (providers)
  async searchUsers({
    query = '',
    role = 'provider',
    location = null,
    skills = null,
    rating = null,
    verified = null,
    sortBy = 'rating',
    page = 1,
    limit = 20
  } = {}) {
    try {
      const offset = (page - 1) * limit;
      const where = {
        status: 'active',
        role: { [Op.in]: Array.isArray(role) ? role : [role] }
      };

      const include = [
        {
          model: Service,
          as: 'services',
          attributes: ['id', 'title', 'price', 'rating'],
          where: { status: 'active' },
          required: false
        }
      ];

      // Text search
      if (query) {
        where[Op.or] = [
          { firstName: { [Op.iLike]: `%${query}%` } },
          { lastName: { [Op.iLike]: `%${query}%` } },
          { bio: { [Op.iLike]: `%${query}%` } },
          { skills: { [Op.contains]: [query] } }
        ];
      }

      // Location filter
      if (location) {
        where[Op.or] = [
          ...(where[Op.or] || []),
          { city: { [Op.iLike]: `%${location}%` } },
          { state: { [Op.iLike]: `%${location}%` } },
          { country: { [Op.iLike]: `%${location}%` } }
        ];
      }

      // Skills filter
      if (skills) {
        const skillsArray = Array.isArray(skills) ? skills : [skills];
        where.skills = { [Op.overlap]: skillsArray };
      }

      // Rating filter
      if (rating !== null) {
        where.rating = { [Op.gte]: rating };
      }

      // Verification filter
      if (verified !== null) {
        if (verified) {
          where[Op.and] = [
            { emailVerified: true },
            { phoneVerified: true }
          ];
        } else {
          where[Op.or] = [
            { emailVerified: false },
            { phoneVerified: false }
          ];
        }
      }

      // Sorting
      let order = [];
      switch (sortBy) {
        case 'rating':
          order = [['rating', 'DESC']];
          break;
        case 'reviews':
          order = [['totalReviews', 'DESC']];
          break;
        case 'newest':
          order = [['createdAt', 'DESC']];
          break;
        case 'name':
          order = [['firstName', 'ASC'], ['lastName', 'ASC']];
          break;
        default:
          order = [['rating', 'DESC'], ['totalReviews', 'DESC']];
      }

      const { count, rows: users } = await User.findAndCountAll({
        where,
        include,
        order,
        limit,
        offset,
        attributes: {
          exclude: ['password', 'refreshToken', 'resetPasswordToken', 'emailVerificationToken']
        }
      });

      this.logger.info('User search completed', {
        query,
        role,
        resultsCount: count,
        page
      });

      return {
        users,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
          hasNext: page < Math.ceil(count / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      this.logger.error('User search failed:', error);
      throw error;
    }
  }

  // Get search suggestions
  async getSearchSuggestions(query, type = 'service', limit = 10) {
    try {
      const suggestions = [];

      if (type === 'service' || type === 'all') {
        // Service title suggestions
        const serviceTitles = await Service.findAll({
          where: {
            title: { [Op.iLike]: `%${query}%` },
            status: 'active'
          },
          attributes: ['title'],
          limit: limit / 2,
          group: ['title'],
          order: [['viewCount', 'DESC']]
        });

        suggestions.push(...serviceTitles.map(s => ({
          type: 'service',
          text: s.title,
          category: 'Service'
        })));

        // Category suggestions
        const categories = await Category.findAll({
          where: {
            name: { [Op.iLike]: `%${query}%` }
          },
          attributes: ['name'],
          limit: 3
        });

        suggestions.push(...categories.map(c => ({
          type: 'category',
          text: c.name,
          category: 'Category'
        })));
      }

      if (type === 'user' || type === 'all') {
        // User name suggestions
        const users = await User.findAll({
          where: {
            [Op.or]: [
              { firstName: { [Op.iLike]: `%${query}%` } },
              { lastName: { [Op.iLike]: `%${query}%` } }
            ],
            status: 'active',
            role: 'provider'
          },
          attributes: ['firstName', 'lastName'],
          limit: limit / 3
        });

        suggestions.push(...users.map(u => ({
          type: 'user',
          text: `${u.firstName} ${u.lastName}`,
          category: 'Provider'
        })));
      }

      // Remove duplicates and limit results
      const uniqueSuggestions = suggestions
        .filter((suggestion, index, self) => 
          index === self.findIndex(s => s.text === suggestion.text)
        )
        .slice(0, limit);

      return uniqueSuggestions;
    } catch (error) {
      this.logger.error('Failed to get search suggestions:', error);
      throw error;
    }
  }

  // Get popular searches
  async getPopularSearches(limit = 10) {
    try {
      // This would typically come from a search analytics table
      // For now, we'll return popular service categories and titles
      const popularServices = await Service.findAll({
        where: { status: 'active' },
        attributes: ['title'],
        order: [['viewCount', 'DESC']],
        limit: limit / 2
      });

      const popularCategories = await Category.findAll({
        attributes: ['name'],
        include: [{
          model: Service,
          as: 'services',
          attributes: [],
          where: { status: 'active' }
        }],
        group: ['Category.id', 'Category.name'],
        order: [Sequelize.literal('COUNT("services"."id") DESC')],
        limit: limit / 2
      });

      const popular = [
        ...popularServices.map(s => ({ text: s.title, type: 'service' })),
        ...popularCategories.map(c => ({ text: c.name, type: 'category' }))
      ];

      return popular.slice(0, limit);
    } catch (error) {
      this.logger.error('Failed to get popular searches:', error);
      throw error;
    }
  }

  // Calculate distance between two coordinates
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Convert degrees to radians
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Advanced search with filters aggregation
  async getSearchFilters(query = '') {
    try {
      const baseWhere = { status: 'active' };
      
      if (query) {
        baseWhere[Op.or] = [
          { title: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } }
        ];
      }

      // Get available categories
      const categories = await Category.findAll({
        attributes: ['id', 'name'],
        include: [{
          model: Service,
          as: 'services',
          where: baseWhere,
          attributes: [],
          required: true
        }],
        group: ['Category.id', 'Category.name']
      });

      // Get price range
      const priceRange = await Service.findOne({
        where: baseWhere,
        attributes: [
          [Sequelize.fn('MIN', Sequelize.col('price')), 'minPrice'],
          [Sequelize.fn('MAX', Sequelize.col('price')), 'maxPrice']
        ]
      });

      // Get available locations
      const locations = await Service.findAll({
        where: baseWhere,
        attributes: ['city', 'state'],
        group: ['city', 'state'],
        having: Sequelize.literal('COUNT(*) > 0'),
        limit: 20
      });

      // Get rating distribution
      const ratingDistribution = await Service.findAll({
        where: baseWhere,
        attributes: [
          [Sequelize.fn('FLOOR', Sequelize.col('rating')), 'rating_floor'],
          [Sequelize.fn('COUNT', '*'), 'count']
        ],
        group: [Sequelize.fn('FLOOR', Sequelize.col('rating'))],
        order: [[Sequelize.fn('FLOOR', Sequelize.col('rating')), 'DESC']]
      });

      return {
        categories,
        priceRange: {
          min: priceRange?.dataValues?.minPrice || 0,
          max: priceRange?.dataValues?.maxPrice || 1000
        },
        locations: locations.map(l => ({
          city: l.city,
          state: l.state,
          label: `${l.city}, ${l.state}`
        })),
        ratings: ratingDistribution.map(r => ({
          rating: parseInt(r.dataValues.rating),
          count: parseInt(r.dataValues.count)
        }))
      };
    } catch (error) {
      this.logger.error('Failed to get search filters:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const searchService = new SearchService();
module.exports = searchService;