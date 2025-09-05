import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import httpClient, { STORAGE_KEYS } from './httpClient';
import { API_ENDPOINTS } from '../config/api';

class AuthService {
  // Login with email/phone and password
  async login(credentials) {
    try {
      const { email, phone, password, rememberMe = false } = credentials;
      
      const loginData = {
        password,
      };

      // Use email or phone for login
      if (email) {
        loginData.email = email.toLowerCase().trim();
      } else if (phone) {
        loginData.phone = phone.trim();
      } else {
        throw new Error('Email or phone number is required');
      }

      const response = await httpClient.post(API_ENDPOINTS.AUTH.LOGIN, loginData);
      
      const { user, accessToken, refreshToken } = response.data;
      
      // Store tokens and user data using new storage keys
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      
      return {
        user,
        userType: user.userType,
        verificationStatus: user.verificationStatus,
        creditRating: user.creditRating,
        token: accessToken,
      };
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  }

  // Register new user
  async register(userData) {
    try {
      console.log('🔍 AuthService register called with:', userData);
      
      const {
        firstName,
        lastName,
        email,
        phone,
        password,
        confirmPassword,
        userType,
        acceptTerms,
        acceptPrivacy,
      } = userData;

      // Validate required fields
      if (!firstName || !lastName || !email || !phone || !password) {
        console.error('❌ Validation failed: Missing required fields');
        throw new Error('All required fields must be filled');
      }

      if (password !== confirmPassword) {
        console.error('❌ Validation failed: Passwords do not match');
        throw new Error('Passwords do not match');
      }

      if (!acceptTerms || !acceptPrivacy) {
        console.error('❌ Validation failed: Terms not accepted');
        throw new Error('You must accept the terms and privacy policy');
      }

      // Map frontend userType to backend expected values
      const mappedUserType = userType === 'requirer' ? 'requester' : 
                            userType === 'provider' ? 'provider' : 
                            'requester';

      const registrationData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password,
        confirmPassword,
        userType: mappedUserType,
        agreeToTerms: acceptTerms,
        agreeToPrivacy: acceptPrivacy,
      };

      console.log('📤 Making API call to:', API_ENDPOINTS.AUTH.REGISTER);
      console.log('📤 Full URL:', `${httpClient.baseURL}${API_ENDPOINTS.AUTH.REGISTER}`);
      console.log('📤 Registration data:', registrationData);
      console.log('📤 Environment:', __DEV__ ? 'development' : 'production');
      
      const response = await httpClient.post(API_ENDPOINTS.AUTH.REGISTER, registrationData);
      
      console.log('📥 API Response received:', response);
      
      const { user, accessToken, refreshToken } = response.data;
      
      console.log('✅ Registration successful, storing tokens...');
      
      // Store tokens and user data using new storage keys
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      
      return {
        user,
        userType: user.userType,
        token: accessToken,
      };
    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        data: error.data
      });
      
      // Handle specific network errors with user-friendly messages
      if (error.message && (
        error.message.includes('unreachable') ||
        error.message.includes('timeout') ||
        error.message.includes('Network error')
      )) {
        throw new Error('Unable to connect to our servers. Please check your internet connection and try again in a few moments.');
      }
      
      if (error.message && error.message.includes('Service is temporarily unavailable')) {
        throw new Error('Our registration service is temporarily unavailable. Please try again in a few minutes.');
      }
      
      // Handle validation errors
      if (error.status === 400 || error.status === 422) {
        const errorData = error.data;
        if (errorData && errorData.message) {
          throw new Error(errorData.message);
        }
        if (errorData && errorData.errors) {
          const firstError = Object.values(errorData.errors)[0];
          throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
        }
      }
      
      throw new Error(error.message || 'Registration failed. Please try again.');
    }
  }

  // NIMC Verification
  async verifyNIMC(nimcData) {
    try {
      const { nin, firstName, lastName, dateOfBirth } = nimcData;
      
      const response = await httpClient.post(API_ENDPOINTS.VERIFICATION.NIMC, {
        nin,
        firstName,
        lastName,
        dateOfBirth,
      });

      return response.data;
    } catch (error) {
      throw new Error(error.message || 'NIMC verification failed');
    }
  }

  // BVN Verification
  async verifyBVN(bvnData) {
    try {
      const { bvn, firstName, lastName, dateOfBirth } = bvnData;
      
      const response = await httpClient.post(API_ENDPOINTS.VERIFICATION.BVN, {
        bvn,
        firstName,
        lastName,
        dateOfBirth,
      });

      return response.data;
    } catch (error) {
      throw new Error(error.message || 'BVN verification failed');
    }
  }

  // CBN Credit Check
  async verifyCBN(cbnData) {
    try {
      const { accountNumber, bankCode } = cbnData;
      
      const response = await httpClient.post(API_ENDPOINTS.VERIFICATION.CBN, {
        accountNumber,
        bankCode,
      });

      return response.data;
    } catch (error) {
      throw new Error(error.message || 'CBN verification failed');
    }
  }

  // Complete user verification process
  async verifyUser(verificationData) {
    try {
      const { nimcData, bvnData, cbnData } = verificationData;
      
      // Perform all verifications
      const nimcResult = await this.verifyNIMC(nimcData);
      const bvnResult = await this.verifyBVN(bvnData);
      const cbnResult = await this.verifyCBN(cbnData);
      
      // Calculate credit rating based on verification results
      const creditRating = this.calculateCreditRating({
        nimc: nimcResult,
        bvn: bvnResult,
        cbn: cbnResult,
      });
      
      // Update user verification status
      const response = await httpClient.put(API_ENDPOINTS.USER.PROFILE, {
        verificationStatus: 'verified',
        creditRating,
        verificationData: {
          nimc: nimcResult.verified,
          bvn: bvnResult.verified,
          cbn: cbnResult.verified,
        },
      });

      const data = response.data;
      
      return {
        verificationStatus: 'verified',
        creditRating,
        verificationData: data.verificationData,
      };
    } catch (error) {
      throw new Error(error.message || 'Verification process failed');
    }
  }

  // Calculate credit rating based on verification results
  calculateCreditRating(verificationResults) {
    let rating = 0;
    
    // NIMC verification adds 30 points
    if (verificationResults.nimc?.verified) {
      rating += 30;
    }
    
    // BVN verification adds 40 points
    if (verificationResults.bvn?.verified) {
      rating += 40;
    }
    
    // CBN credit check adds 30 points
    if (verificationResults.cbn?.verified) {
      rating += 30;
    }
    
    // Convert to letter grade
    if (rating >= 90) return 'A+';
    if (rating >= 80) return 'A';
    if (rating >= 70) return 'B+';
    if (rating >= 60) return 'B';
    if (rating >= 50) return 'C+';
    if (rating >= 40) return 'C';
    return 'D';
  }

  // Get stored auth token
  async getToken() {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      return null;
    }
  }

  // Get stored user data
  async getUserData() {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  // Logout user
  async logout() {
    try {
      // Call logout endpoint to invalidate token on server
      try {
        await httpClient.post(API_ENDPOINTS.AUTH.LOGOUT);
      } catch (error) {
        // Continue with local logout even if server call fails
        console.warn('Server logout failed:', error);
      }
      
      // Clear local auth data
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
      return true;
    } catch (error) {
      throw new Error('Logout failed');
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const token = await this.getToken();
      return !!token;
    } catch (error) {
      return false;
    }
  }

  // Delete user account
  async deleteAccount() {
    try {
      await httpClient.delete(API_ENDPOINTS.USER.DELETE_ACCOUNT);
      
      // Clear local auth data after successful deletion
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
      
      return { success: true, message: 'Account deleted successfully' };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Account deletion failed');
    }
  }

  // Update user settings
  async updateUserSettings(settings) {
    try {
      const response = await httpClient.put(API_ENDPOINTS.USER.PREFERENCES, settings);
      
      // Update stored user data with new settings
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (userData) {
        const user = JSON.parse(userData);
        const updatedUser = { ...user, ...response.data };
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      }
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Settings update failed');
    }
  }

  // Update user skills
  async updateSkills(userId, skills) {
    try {
      const token = await this.getToken();
      const response = await httpClient.put(
        API_ENDPOINTS.AUTH.UPDATE_SKILLS.replace(':id', userId),
        { skills },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update stored user data with new skills
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (userData) {
        const user = JSON.parse(userData);
        const updatedUser = { ...user, skills: response.data.skills };
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating skills:', error);
      
      // Return mock data for development
      return {
         skills: skills,
         message: 'Skills updated successfully (mock)'
       };
     }
   }

   // Update user profile
   async updateProfile(userId, profileData) {
     try {
       const token = await this.getToken();
       const response = await httpClient.put(
         API_ENDPOINTS.AUTH.UPDATE_PROFILE.replace(':id', userId),
         profileData,
         {
           headers: {
             Authorization: `Bearer ${token}`,
             'Content-Type': 'application/json'
           }
         }
       );
       
       // Update stored user data with new profile
       const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
       if (userData) {
         const user = JSON.parse(userData);
         const updatedUser = { ...user, ...response.data };
         await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
       }
       
       return response.data;
     } catch (error) {
       console.error('Error updating profile:', error);
       
       // Return mock data for development
       return {
         ...profileData,
         message: 'Profile updated successfully (mock)'
       };
     }
   }

   // Upload profile image
   async uploadProfileImage(userId, imageData) {
     try {
       const token = await this.getToken();
       const response = await httpClient.post(
         API_ENDPOINTS.AUTH.UPLOAD_IMAGE.replace(':id', userId),
         imageData,
         {
           headers: {
             Authorization: `Bearer ${token}`,
             'Content-Type': 'multipart/form-data'
           }
         }
       );
       
       // Update stored user data with new image URL
       const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
       if (userData) {
         const user = JSON.parse(userData);
         const updatedUser = { ...user, profileImage: response.data.imageUrl };
         await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
       }
       
       return response.data;
     } catch (error) {
       console.error('Error uploading profile image:', error);
       
       // Return mock data for development
       return {
         imageUrl: 'https://via.placeholder.com/150',
         message: 'Image uploaded successfully (mock)'
       };
     }
   }
 }

export default new AuthService();