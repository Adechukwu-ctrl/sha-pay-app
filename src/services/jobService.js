/**
 * Job Service
 * Handles all job-related API operations
 */

import httpClient from './httpClient';
import { API_ENDPOINTS, buildUrl } from '../config/api';

class JobService {
  // Get all jobs with filters
  async getJobs(filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        location,
        minPrice,
        maxPrice,
        skills,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
      } = filters;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      if (category) queryParams.append('category', category);
      if (location) queryParams.append('location', location);
      if (minPrice) queryParams.append('minPrice', minPrice.toString());
      if (maxPrice) queryParams.append('maxPrice', maxPrice.toString());
      if (skills) queryParams.append('skills', skills.join(','));
      if (search) queryParams.append('search', search);

      const response = await httpClient.get(`${API_ENDPOINTS.JOBS.LIST}?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Get jobs error:', error);
      throw error;
    }
  }

  // Search jobs
  async searchJobs(query, filters = {}) {
    try {
      const searchParams = {
        q: query,
        ...filters,
      };

      const queryParams = new URLSearchParams(searchParams);
      const response = await httpClient.get(`${API_ENDPOINTS.JOBS.SEARCH}?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Search jobs error:', error);
      throw error;
    }
  }

  // Get job details
  async getJobDetails(jobId) {
    try {
      const url = buildUrl(API_ENDPOINTS.JOBS.DETAILS, { id: jobId });
      const response = await httpClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Get job details error:', error);
      throw error;
    }
  }

  // Create new job
  async createJob(jobData) {
    try {
      const {
        title,
        description,
        category,
        subcategory,
        skills,
        budget,
        budgetType, // 'fixed' or 'hourly'
        location,
        locationType, // 'remote', 'onsite', 'hybrid'
        duration,
        urgency, // 'low', 'medium', 'high'
        requirements,
        images,
        contactPreference, // 'chat', 'phone', 'email'
      } = jobData;

      // Validate required fields
      if (!title || !description || !category || !budget) {
        throw new Error('Title, description, category, and budget are required');
      }

      const jobPayload = {
        title: title.trim(),
        description: description.trim(),
        category,
        subcategory,
        skills: skills || [],
        budget: parseFloat(budget),
        budgetType: budgetType || 'fixed',
        location: location?.trim(),
        locationType: locationType || 'remote',
        duration,
        urgency: urgency || 'medium',
        requirements: requirements || [],
        contactPreference: contactPreference || 'chat',
      };

      const response = await httpClient.post(API_ENDPOINTS.JOBS.CREATE, jobPayload);
      
      // Upload images if provided
      if (images && images.length > 0) {
        await this.uploadJobImages(response.data.id, images);
      }

      return response.data;
    } catch (error) {
      console.error('Create job error:', error);
      throw error;
    }
  }

  // Update job
  async updateJob(jobId, jobData) {
    try {
      const url = buildUrl(API_ENDPOINTS.JOBS.UPDATE, { id: jobId });
      const response = await httpClient.put(url, jobData);
      return response.data;
    } catch (error) {
      console.error('Update job error:', error);
      throw error;
    }
  }

  // Delete job
  async deleteJob(jobId) {
    try {
      const url = buildUrl(API_ENDPOINTS.JOBS.DELETE, { id: jobId });
      const response = await httpClient.delete(url);
      return response.data;
    } catch (error) {
      console.error('Delete job error:', error);
      throw error;
    }
  }

  // Apply for job
  async applyForJob(jobId, applicationData) {
    try {
      const {
        coverLetter,
        proposedBudget,
        estimatedDuration,
        portfolio,
        questions, // Answers to job-specific questions
      } = applicationData;

      const applicationPayload = {
        coverLetter: coverLetter?.trim(),
        proposedBudget: proposedBudget ? parseFloat(proposedBudget) : null,
        estimatedDuration,
        portfolio: portfolio || [],
        questions: questions || {},
      };

      const url = buildUrl(API_ENDPOINTS.JOBS.APPLY, { id: jobId });
      const response = await httpClient.post(url, applicationPayload);
      return response.data;
    } catch (error) {
      console.error('Apply for job error:', error);
      throw error;
    }
  }

  // Accept job application
  async acceptJobApplication(jobId, applicationId) {
    try {
      const url = buildUrl(API_ENDPOINTS.JOBS.ACCEPT, { id: jobId });
      const response = await httpClient.post(url, { applicationId });
      return response.data;
    } catch (error) {
      console.error('Accept job application error:', error);
      throw error;
    }
  }

  // Complete job
  async completeJob(jobId, completionData) {
    try {
      const {
        deliverables,
        notes,
        images,
        requestPayment = true,
      } = completionData;

      const completionPayload = {
        deliverables: deliverables || [],
        notes: notes?.trim(),
        requestPayment,
      };

      const url = buildUrl(API_ENDPOINTS.JOBS.COMPLETE, { id: jobId });
      const response = await httpClient.post(url, completionPayload);
      
      // Upload completion images if provided
      if (images && images.length > 0) {
        await this.uploadJobImages(jobId, images, 'completion');
      }

      return response.data;
    } catch (error) {
      console.error('Complete job error:', error);
      throw error;
    }
  }

  // Cancel job
  async cancelJob(jobId, reason) {
    try {
      const url = buildUrl(API_ENDPOINTS.JOBS.CANCEL, { id: jobId });
      const response = await httpClient.post(url, { reason: reason?.trim() });
      return response.data;
    } catch (error) {
      console.error('Cancel job error:', error);
      throw error;
    }
  }

  // Rate job
  async rateJob(jobId, ratingData) {
    try {
      const {
        rating, // 1-5 stars
        review,
        categories, // { communication: 5, quality: 4, timeliness: 5 }
      } = ratingData;

      if (!rating || rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const ratingPayload = {
        rating,
        review: review?.trim(),
        categories: categories || {},
      };

      const url = buildUrl(API_ENDPOINTS.JOBS.RATE, { id: jobId });
      const response = await httpClient.post(url, ratingPayload);
      return response.data;
    } catch (error) {
      console.error('Rate job error:', error);
      throw error;
    }
  }

  // Dispute job
  async disputeJob(jobId, disputeData) {
    try {
      const {
        reason,
        description,
        evidence, // Array of file URLs or descriptions
      } = disputeData;

      if (!reason || !description) {
        throw new Error('Reason and description are required for disputes');
      }

      const disputePayload = {
        reason: reason.trim(),
        description: description.trim(),
        evidence: evidence || [],
      };

      const url = buildUrl(API_ENDPOINTS.JOBS.DISPUTE, { id: jobId });
      const response = await httpClient.post(url, disputePayload);
      return response.data;
    } catch (error) {
      console.error('Dispute job error:', error);
      throw error;
    }
  }

  // Get user's jobs
  async getMyJobs(filters = {}) {
    try {
      const {
        status, // 'active', 'completed', 'cancelled', 'disputed'
        type, // 'created', 'applied', 'assigned'
        page = 1,
        limit = 20,
      } = filters;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (status) queryParams.append('status', status);
      if (type) queryParams.append('type', type);

      const response = await httpClient.get(`${API_ENDPOINTS.JOBS.MY_JOBS}?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Get my jobs error:', error);
      throw error;
    }
  }

  // Get job applications
  async getJobApplications(jobId) {
    try {
      const url = buildUrl(API_ENDPOINTS.JOBS.APPLICATIONS, { id: jobId });
      const response = await httpClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Get job applications error:', error);
      throw error;
    }
  }

  // Get job categories
  async getJobCategories() {
    try {
      const response = await httpClient.get(API_ENDPOINTS.JOBS.CATEGORIES);
      return response.data;
    } catch (error) {
      console.error('Get job categories error:', error);
      throw error;
    }
  }

  // Get skills
  async getSkills(category = null) {
    try {
      const queryParams = category ? `?category=${category}` : '';
      const response = await httpClient.get(`${API_ENDPOINTS.JOBS.SKILLS}${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Get skills error:', error);
      throw error;
    }
  }

  // Upload job images
  async uploadJobImages(jobId, images, type = 'job') {
    try {
      const uploadPromises = images.map(async (image, index) => {
        const formData = new FormData();
        formData.append('file', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.name || `${type}_image_${index}.jpg`,
        });
        formData.append('jobId', jobId);
        formData.append('type', type);

        return httpClient.upload('/jobs/upload-image', formData);
      });

      const results = await Promise.all(uploadPromises);
      return results.map(result => result.data);
    } catch (error) {
      console.error('Upload job images error:', error);
      throw error;
    }
  }

  // Get job statistics
  async getJobStatistics(userId = null) {
    try {
      const queryParams = userId ? `?userId=${userId}` : '';
      const response = await httpClient.get(`/jobs/statistics${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Get job statistics error:', error);
      throw error;
    }
  }

  // Report job
  async reportJob(jobId, reportData) {
    try {
      const {
        reason,
        description,
        category, // 'spam', 'inappropriate', 'fraud', 'other'
      } = reportData;

      if (!reason || !description) {
        throw new Error('Reason and description are required');
      }

      const reportPayload = {
        reason: reason.trim(),
        description: description.trim(),
        category: category || 'other',
      };

      const response = await httpClient.post(`/jobs/${jobId}/report`, reportPayload);
      return response.data;
    } catch (error) {
      console.error('Report job error:', error);
      throw error;
    }
  }

  // Save/bookmark job
  async saveJob(jobId) {
    try {
      const response = await httpClient.post(`/jobs/${jobId}/save`);
      return response.data;
    } catch (error) {
      console.error('Save job error:', error);
      throw error;
    }
  }

  // Unsave/unbookmark job
  async unsaveJob(jobId) {
    try {
      const response = await httpClient.delete(`/jobs/${jobId}/save`);
      return response.data;
    } catch (error) {
      console.error('Unsave job error:', error);
      throw error;
    }
  }

  // Get saved jobs
  async getSavedJobs(page = 1, limit = 20) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await httpClient.get(`/jobs/saved?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Get saved jobs error:', error);
      throw error;
    }
  }
}

// Create and export job service instance
const jobService = new JobService();

export default jobService;