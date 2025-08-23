const { Service, User, Booking, Review, Category } = require('../models');
const { asyncHandler, AppError, ValidationError, NotFoundError, AuthorizationError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const uploadService = require('../services/uploadService');
const searchService = require('../services/searchService');

// Get all services with filtering and pagination
const getAllServices = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    category,
    subcategory,
    minPrice,
    maxPrice,
    location,
    radius = 50,
    search,
    providerId,
    isActive,
    featured
  } = req.query;

  const offset = (page - 1) * limit;
  const order = [[sortBy, sortOrder.toUpperCase()]];

  // Build where clause
  const where = {};

  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { tags: { [Op.contains]: [search] } }
    ];
  }

  if (category) {
    where.category = { [Op.iLike]: `%${category}%` };
  }

  if (subcategory) {
    where.subcategory = { [Op.iLike]: `%${subcategory}%` };
  }

  if (minPrice) {
    where.price = { [Op.gte]: parseFloat(minPrice) };
  }

  if (maxPrice) {
    where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice) };
  }

  if (providerId) {
    where.providerId = providerId;
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  if (featured !== undefined) {
    where.isFeatured = featured === 'true';
  }

  // Location-based filtering (simplified)
  if (location) {
    where[Op.or] = [
      ...(where[Op.or] || []),
      { city: { [Op.iLike]: `%${location}%` } },
      { state: { [Op.iLike]: `%${location}%` } },
      { country: { [Op.iLike]: `%${location}%` } }
    ];
  }

  const { count, rows: services } = await Service.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order,
    include: [
      {
        model: User,
        as: 'provider',
        attributes: ['id', 'firstName', 'lastName', 'profilePicture', 'rating', 'totalRatings']
      },
      {
        model: Review,
        as: 'reviews',
        limit: 3,
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

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    data: {
      services,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalServices: count,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
});

// Get service by ID
const getServiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await Service.findByPk(id, {
    include: [
      {
        model: User,
        as: 'provider',
        attributes: ['id', 'firstName', 'lastName', 'profilePicture', 'bio', 'rating', 'totalRatings', 'joinedAt']
      },
      {
        model: Review,
        as: 'reviews',
        include: [
          {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'firstName', 'lastName', 'profilePicture']
          }
        ],
        order: [['createdAt', 'DESC']]
      },
      {
        model: Booking,
        as: 'bookings',
        where: { status: 'completed' },
        required: false,
        attributes: ['id', 'status']
      }
    ]
  });

  if (!service) {
    throw new NotFoundError('Service not found');
  }

  // Increment view count
  await service.updateViews();

  res.json({
    success: true,
    data: { service }
  });
});

// Create new service
const createService = asyncHandler(async (req, res) => {
  const providerId = req.user.id;
  const {
    title,
    description,
    category,
    subcategory,
    price,
    currency = 'USD',
    duration,
    tags,
    requirements,
    address,
    city,
    state,
    country,
    zipCode,
    latitude,
    longitude,
    isActive = true,
    faqs,
    policies,
    addOns,
    packages
  } = req.body;

  // Check if user is a provider
  const user = await User.findByPk(providerId);
  if (!user || user.userType !== 'provider') {
    throw new AuthorizationError('Only providers can create services');
  }

  // Create service
  const service = await Service.create({
    providerId,
    title,
    description,
    category,
    subcategory,
    price,
    currency,
    duration,
    tags: tags || [],
    requirements,
    address,
    city,
    state,
    country,
    zipCode,
    latitude,
    longitude,
    isActive,
    faqs: faqs || [],
    policies: policies || {},
    addOns: addOns || [],
    packages: packages || []
  });

  // Load service with provider details
  const createdService = await Service.findByPk(service.id, {
    include: [
      {
        model: User,
        as: 'provider',
        attributes: ['id', 'firstName', 'lastName', 'profilePicture']
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Service created successfully',
    data: { service: createdService }
  });
});

// Update service
const updateService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.userType === 'admin';

  const service = await Service.findByPk(id);
  if (!service) {
    throw new NotFoundError('Service not found');
  }

  // Check ownership or admin privileges
  if (service.providerId !== userId && !isAdmin) {
    throw new AuthorizationError('You can only update your own services');
  }

  const {
    title,
    description,
    category,
    subcategory,
    price,
    currency,
    duration,
    tags,
    requirements,
    address,
    city,
    state,
    country,
    zipCode,
    latitude,
    longitude,
    isActive,
    faqs,
    policies,
    addOns,
    packages
  } = req.body;

  // Update service fields
  const updateFields = {
    title,
    description,
    category,
    subcategory,
    price,
    currency,
    duration,
    tags,
    requirements,
    address,
    city,
    state,
    country,
    zipCode,
    latitude,
    longitude,
    isActive,
    faqs,
    policies,
    addOns,
    packages,
    updatedAt: new Date()
  };

  // Remove undefined fields
  Object.keys(updateFields).forEach(key => {
    if (updateFields[key] === undefined) {
      delete updateFields[key];
    }
  });

  await service.update(updateFields);

  // Load updated service with provider details
  const updatedService = await Service.findByPk(id, {
    include: [
      {
        model: User,
        as: 'provider',
        attributes: ['id', 'firstName', 'lastName', 'profilePicture']
      }
    ]
  });

  res.json({
    success: true,
    message: 'Service updated successfully',
    data: { service: updatedService }
  });
});

// Delete service
const deleteService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.userType === 'admin';

  const service = await Service.findByPk(id);
  if (!service) {
    throw new NotFoundError('Service not found');
  }

  // Check ownership or admin privileges
  if (service.providerId !== userId && !isAdmin) {
    throw new AuthorizationError('You can only delete your own services');
  }

  // Check for active bookings
  const activeBookings = await Booking.count({
    where: {
      serviceId: id,
      status: { [Op.in]: ['pending', 'confirmed', 'in_progress'] }
    }
  });

  if (activeBookings > 0) {
    throw new ValidationError('Cannot delete service with active bookings');
  }

  // Delete service images
  if (service.images && service.images.length > 0) {
    for (const imageUrl of service.images) {
      try {
        await uploadService.deleteFile(imageUrl);
      } catch (error) {
        console.error('Failed to delete service image:', error.message, '\nStack:', error.stack);
      }
    }
  }

  // Delete service
  await service.destroy();

  res.json({
    success: true,
    message: 'Service deleted successfully'
  });
});

// Upload service images
const uploadServiceImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!req.files || req.files.length === 0) {
    throw new ValidationError('No files uploaded');
  }

  const service = await Service.findByPk(id);
  if (!service) {
    throw new NotFoundError('Service not found');
  }

  // Check ownership
  if (service.providerId !== userId) {
    throw new AuthorizationError('You can only upload images for your own services');
  }

  // Upload service images
  const uploadResults = await uploadService.uploadServiceImages(req.files, id);
  const imageUrls = uploadResults.map(result => result.url);

  // Update service images
  const currentImages = service.images || [];
  const updatedImages = [...currentImages, ...imageUrls];
  
  // Limit to maximum 10 images
  if (updatedImages.length > 10) {
    throw new ValidationError('Maximum 10 images allowed per service');
  }

  service.images = updatedImages;
  await service.save();

  res.json({
    success: true,
    message: 'Images uploaded successfully',
    data: {
      images: imageUrls,
      totalImages: updatedImages.length
    }
  });
});

// Delete service image
const deleteServiceImage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { imageUrl } = req.body;
  const userId = req.user.id;

  const service = await Service.findByPk(id);
  if (!service) {
    throw new NotFoundError('Service not found');
  }

  // Check ownership
  if (service.providerId !== userId) {
    throw new AuthorizationError('You can only delete images from your own services');
  }

  if (!service.images || !service.images.includes(imageUrl)) {
    throw new ValidationError('Image not found in service');
  }

  // Delete image from cloud storage
  try {
    await uploadService.deleteFile(imageUrl);
  } catch (error) {
    console.error('Failed to delete image from storage:', error.message, '\nStack:', error.stack);
  }

  // Remove image from service
  service.images = service.images.filter(img => img !== imageUrl);
  await service.save();

  res.json({
    success: true,
    message: 'Image deleted successfully'
  });
});

// Search services
const searchServices = asyncHandler(async (req, res) => {
  const {
    q: query,
    category,
    subcategory,
    minPrice,
    maxPrice,
    location,
    radius = 50,
    latitude,
    longitude,
    sortBy = 'relevance',
    page = 1,
    limit = 20
  } = req.query;

  // Use search service for advanced search
  const searchResults = await searchService.searchServices({
    query,
    category,
    subcategory,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    location,
    radius: parseFloat(radius),
    latitude: latitude ? parseFloat(latitude) : undefined,
    longitude: longitude ? parseFloat(longitude) : undefined,
    sortBy,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res.json({
    success: true,
    data: searchResults
  });
});

// Get featured services
const getFeaturedServices = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const services = await Service.findAll({
    where: {
      isActive: true,
      isFeatured: true
    },
    limit: parseInt(limit),
    order: [['rating', 'DESC'], ['totalBookings', 'DESC']],
    include: [
      {
        model: User,
        as: 'provider',
        attributes: ['id', 'firstName', 'lastName', 'profilePicture', 'rating']
      }
    ]
  });

  res.json({
    success: true,
    data: { services }
  });
});

// Get popular services
const getPopularServices = asyncHandler(async (req, res) => {
  const { limit = 10, category } = req.query;

  const where = {
    isActive: true
  };

  if (category) {
    where.category = category;
  }

  const services = await Service.findAll({
    where,
    limit: parseInt(limit),
    order: [['totalBookings', 'DESC'], ['rating', 'DESC']],
    include: [
      {
        model: User,
        as: 'provider',
        attributes: ['id', 'firstName', 'lastName', 'profilePicture', 'rating']
      }
    ]
  });

  res.json({
    success: true,
    data: { services }
  });
});

// Get service categories
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Service.getPopularCategories();

  res.json({
    success: true,
    data: { categories }
  });
});

// Get services by provider
const getServicesByProvider = asyncHandler(async (req, res) => {
  const { providerId } = req.params;
  const {
    page = 1,
    limit = 20,
    isActive
  } = req.query;

  const offset = (page - 1) * limit;
  const where = { providerId };

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const { count, rows: services } = await Service.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'provider',
        attributes: ['id', 'firstName', 'lastName', 'profilePicture']
      }
    ]
  });

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    data: {
      services,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalServices: count,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
});

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  uploadServiceImages,
  deleteServiceImage,
  searchServices,
  getFeaturedServices,
  getPopularServices,
  getCategories,
  getServicesByProvider
};