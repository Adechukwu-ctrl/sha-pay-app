import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import httpClient from './httpClient';
import { API_ENDPOINTS, buildUrl, STORAGE_KEYS } from '../config/api';

class UserService {
  // Fetch user profile
  async fetchUserProfile(userId) {
    try {
      const response = await httpClient.get(buildUrl(API_ENDPOINTS.USER.PROFILE, { userId }));
      
      // Store locally for offline access
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      // Return cached data or mock data
      const cachedProfile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (cachedProfile) {
        return JSON.parse(cachedProfile);
      }
      
      // Mock user profile
      return {
        profile: {
          id: 'user_123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+2348012345678',
          profileImage: null,
          bio: 'Experienced service provider',
          location: 'Lagos, Nigeria',
          joinedDate: '2024-01-01',
          verificationStatus: {
            nimc: true,
            bvn: true,
            cbn: false,
          },
          creditRating: 4.2,
          totalJobs: 15,
          completedJobs: 12,
          successRate: 80,
        },
        skills: [
          { id: 1, name: 'Web Development', level: 'Expert', verified: true },
          { id: 2, name: 'Mobile Development', level: 'Intermediate', verified: false },
          { id: 3, name: 'UI/UX Design', level: 'Beginner', verified: false },
        ],
        ratings: [
          {
            id: 1,
            jobId: 'job_1',
            rating: 5,
            feedback: 'Excellent work quality and timely delivery',
            ratedBy: 'client_1',
            ratedAt: '2024-01-15',
          },
          {
            id: 2,
            jobId: 'job_2',
            rating: 4,
            feedback: 'Good communication and professional approach',
            ratedBy: 'client_2',
            ratedAt: '2024-01-10',
          },
        ],
        currentCategory: 'provider',
      };
    }
  }

  // Update user profile
  async updateUserProfile(profileData) {
    try {
      const response = await httpClient.put(API_ENDPOINTS.USER.UPDATE_PROFILE, profileData);
      
      // Update local storage
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      // Mock implementation
      const mockUpdatedProfile = {
        profile: {
          ...profileData,
          updatedAt: new Date().toISOString(),
        },
        skills: profileData.skills || [],
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(mockUpdatedProfile));
      return mockUpdatedProfile;
    }
  }

  // Switch user category (provider/requirer)
  async switchUserCategory(categoryData) {
    try {
      const response = await httpClient.post(API_ENDPOINTS.USER.SWITCH_CATEGORY, categoryData);
      
      // Update local storage
      const currentProfile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (currentProfile) {
        const profile = JSON.parse(currentProfile);
        profile.currentCategory = response.data.category;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
      }
      
      return response.data;
    } catch (error) {
      // Mock implementation
      const mockCategorySwitch = {
        category: categoryData.category,
        switchedAt: new Date().toISOString(),
        success: true,
      };
      
      // Update local storage
      const currentProfile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (currentProfile) {
        const profile = JSON.parse(currentProfile);
        profile.currentCategory = categoryData.category;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
      }
      
      return mockCategorySwitch;
    }
  }

  // Add or update user skills
  async updateUserSkills(skillsData) {
    try {
      const response = await httpClient.put(API_ENDPOINTS.USER.UPDATE_SKILLS, skillsData);
      return response.data;
    } catch (error) {
      // Mock implementation
      return {
        skills: skillsData.skills,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  // Get user verification status
  async getVerificationStatus(userId) {
    try {
      const response = await httpClient.get(buildUrl(API_ENDPOINTS.USER.VERIFICATION_STATUS, { userId }));
      return response.data;
    } catch (error) {
      // Mock verification status
      return {
        nimc: {
          verified: true,
          verifiedAt: '2024-01-01',
          nin: '12345678901',
        },
        bvn: {
          verified: true,
          verifiedAt: '2024-01-01',
          bvn: '12345678901',
        },
        cbn: {
          verified: false,
          verifiedAt: null,
          accountNumber: null,
        },
        creditRating: {
          score: 4.2,
          lastUpdated: '2024-01-15',
          factors: {
            paymentHistory: 4.5,
            jobCompletion: 4.0,
            clientFeedback: 4.1,
            disputeHistory: 4.8,
          },
        },
      };
    }
  }

  // Upload profile image
  async uploadProfileImage(imageData) {
    try {
      const formData = new FormData();
      formData.append('profileImage', {
        uri: imageData.uri,
        type: imageData.type,
        name: imageData.fileName,
      });

      const response = await httpClient.upload(API_ENDPOINTS.USER.UPLOAD_AVATAR, formData);
      return response.data;
    } catch (error) {
      // Mock implementation
      return {
        imageUrl: imageData.uri,
        uploadedAt: new Date().toISOString(),
      };
    }
  }

  // Helper methods
  async getToken() {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      return null;
    }
  }

  // Get user statistics
  async getUserStats(userId) {
    try {
      const response = await httpClient.get(buildUrl(API_ENDPOINTS.USER.STATISTICS, { userId }));
      return response.data;
    } catch (error) {
      // Mock user statistics
      return {
        totalJobs: 15,
        completedJobs: 12,
        activeJobs: 2,
        cancelledJobs: 1,
        successRate: 80,
        averageRating: 4.2,
        totalEarnings: 125000,
        thisMonthEarnings: 25000,
        responseTime: '2 hours',
        completionTime: '3 days',
        repeatClients: 8,
      };
    }
  }
}

export default new UserService();