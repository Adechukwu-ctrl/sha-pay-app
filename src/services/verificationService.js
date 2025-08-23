import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

/**
 * Verification Service
 * Handles identity verification processes including NIMC, BVN, and CBN integration
 */
class VerificationService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.verificationCache = new Map();
  }

  /**
   * Verify NIMC (National Identity Management Commission) data
   */
  async verifyNIMC(data) {
    try {
      const response = await fetch(`${this.baseURL}/verification/nimc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          nin: data.nin,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          phoneNumber: data.phoneNumber,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'NIMC verification failed');
      }

      // Cache verification result
      this.verificationCache.set(`nimc_${data.nin}`, {
        ...result,
        timestamp: Date.now(),
      });

      return {
        success: true,
        verified: result.verified,
        data: result.data,
        confidence: result.confidence,
        verificationId: result.verificationId,
      };
    } catch (error) {
      console.error('NIMC verification error:', error);
      return {
        success: false,
        error: error.message,
        verified: false,
      };
    }
  }

  /**
   * Verify BVN (Bank Verification Number)
   */
  async verifyBVN(data) {
    try {
      const response = await fetch(`${this.baseURL}/verification/bvn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          bvn: data.bvn,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          phoneNumber: data.phoneNumber,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'BVN verification failed');
      }

      // Cache verification result
      this.verificationCache.set(`bvn_${data.bvn}`, {
        ...result,
        timestamp: Date.now(),
      });

      return {
        success: true,
        verified: result.verified,
        data: result.data,
        bankInfo: result.bankInfo,
        verificationId: result.verificationId,
      };
    } catch (error) {
      console.error('BVN verification error:', error);
      return {
        success: false,
        error: error.message,
        verified: false,
      };
    }
  }

  /**
   * Verify CBN (Central Bank of Nigeria) compliance
   */
  async verifyCBNCompliance(data) {
    try {
      const response = await fetch(`${this.baseURL}/verification/cbn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          accountNumber: data.accountNumber,
          bankCode: data.bankCode,
          bvn: data.bvn,
          userId: data.userId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'CBN compliance verification failed');
      }

      return {
        success: true,
        compliant: result.compliant,
        riskLevel: result.riskLevel,
        restrictions: result.restrictions,
        verificationId: result.verificationId,
      };
    } catch (error) {
      console.error('CBN compliance verification error:', error);
      return {
        success: false,
        error: error.message,
        compliant: false,
      };
    }
  }

  /**
   * Verify phone number via OTP
   */
  async verifyPhoneNumber(phoneNumber) {
    try {
      const response = await fetch(`${this.baseURL}/verification/phone/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send OTP');
      }

      return {
        success: true,
        otpSent: true,
        verificationId: result.verificationId,
        expiresAt: result.expiresAt,
      };
    } catch (error) {
      console.error('Phone verification error:', error);
      return {
        success: false,
        error: error.message,
        otpSent: false,
      };
    }
  }

  /**
   * Confirm phone number verification with OTP
   */
  async confirmPhoneVerification(verificationId, otp) {
    try {
      const response = await fetch(`${this.baseURL}/verification/phone/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({ verificationId, otp }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'OTP verification failed');
      }

      return {
        success: true,
        verified: result.verified,
        phoneNumber: result.phoneNumber,
      };
    } catch (error) {
      console.error('OTP confirmation error:', error);
      return {
        success: false,
        error: error.message,
        verified: false,
      };
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(email) {
    try {
      const response = await fetch(`${this.baseURL}/verification/email/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send verification email');
      }

      return {
        success: true,
        emailSent: true,
        verificationId: result.verificationId,
      };
    } catch (error) {
      console.error('Email verification error:', error);
      return {
        success: false,
        error: error.message,
        emailSent: false,
      };
    }
  }

  /**
   * Confirm email verification
   */
  async confirmEmailVerification(verificationId, token) {
    try {
      const response = await fetch(`${this.baseURL}/verification/email/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({ verificationId, token }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Email verification failed');
      }

      return {
        success: true,
        verified: result.verified,
        email: result.email,
      };
    } catch (error) {
      console.error('Email confirmation error:', error);
      return {
        success: false,
        error: error.message,
        verified: false,
      };
    }
  }

  /**
   * Upload and verify identity document
   */
  async verifyDocument(documentData) {
    try {
      const formData = new FormData();
      formData.append('document', {
        uri: documentData.uri,
        type: documentData.type,
        name: documentData.name,
      });
      formData.append('documentType', documentData.documentType);
      formData.append('userId', documentData.userId);

      const response = await fetch(`${this.baseURL}/verification/document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Document verification failed');
      }

      return {
        success: true,
        verified: result.verified,
        documentId: result.documentId,
        extractedData: result.extractedData,
        confidence: result.confidence,
        verificationId: result.verificationId,
      };
    } catch (error) {
      console.error('Document verification error:', error);
      return {
        success: false,
        error: error.message,
        verified: false,
      };
    }
  }

  /**
   * Get user verification status
   */
  async getVerificationStatus(userId) {
    try {
      const response = await fetch(`${this.baseURL}/verification/status/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get verification status');
      }

      return {
        success: true,
        status: result.status,
        verifications: result.verifications,
        completionPercentage: result.completionPercentage,
        nextSteps: result.nextSteps,
      };
    } catch (error) {
      console.error('Get verification status error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get verification requirements
   */
  async getVerificationRequirements(userType = 'individual') {
    try {
      const response = await fetch(`${this.baseURL}/verification/requirements?type=${userType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get verification requirements');
      }

      return {
        success: true,
        requirements: result.requirements,
        optional: result.optional,
        benefits: result.benefits,
      };
    } catch (error) {
      console.error('Get verification requirements error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Perform comprehensive verification
   */
  async performComprehensiveVerification(userData) {
    try {
      const verificationResults = {
        nimc: null,
        bvn: null,
        cbn: null,
        phone: null,
        email: null,
        documents: [],
      };

      // NIMC Verification
      if (userData.nin) {
        verificationResults.nimc = await this.verifyNIMC({
          nin: userData.nin,
          firstName: userData.firstName,
          lastName: userData.lastName,
          dateOfBirth: userData.dateOfBirth,
          phoneNumber: userData.phoneNumber,
        });
      }

      // BVN Verification
      if (userData.bvn) {
        verificationResults.bvn = await this.verifyBVN({
          bvn: userData.bvn,
          firstName: userData.firstName,
          lastName: userData.lastName,
          dateOfBirth: userData.dateOfBirth,
          phoneNumber: userData.phoneNumber,
        });
      }

      // CBN Compliance
      if (userData.accountNumber && userData.bankCode) {
        verificationResults.cbn = await this.verifyCBNCompliance({
          accountNumber: userData.accountNumber,
          bankCode: userData.bankCode,
          bvn: userData.bvn,
          userId: userData.userId,
        });
      }

      // Calculate overall verification score
      const score = this.calculateVerificationScore(verificationResults);

      return {
        success: true,
        results: verificationResults,
        overallScore: score,
        verificationLevel: this.getVerificationLevel(score),
        recommendations: this.getVerificationRecommendations(verificationResults),
      };
    } catch (error) {
      console.error('Comprehensive verification error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Calculate verification score based on completed verifications
   */
  calculateVerificationScore(results) {
    let score = 0;
    const weights = {
      nimc: 30,
      bvn: 25,
      cbn: 20,
      phone: 15,
      email: 10,
    };

    Object.entries(results).forEach(([key, result]) => {
      if (result && result.success && result.verified) {
        score += weights[key] || 0;
      }
    });

    return Math.min(score, 100);
  }

  /**
   * Get verification level based on score
   */
  getVerificationLevel(score) {
    if (score >= 90) return 'Platinum';
    if (score >= 75) return 'Gold';
    if (score >= 60) return 'Silver';
    if (score >= 40) return 'Bronze';
    return 'Basic';
  }

  /**
   * Get verification recommendations
   */
  getVerificationRecommendations(results) {
    const recommendations = [];

    if (!results.nimc || !results.nimc.verified) {
      recommendations.push({
        type: 'nimc',
        title: 'Complete NIMC Verification',
        description: 'Verify your National Identity Number to increase trust',
        priority: 'high',
        impact: 30,
      });
    }

    if (!results.bvn || !results.bvn.verified) {
      recommendations.push({
        type: 'bvn',
        title: 'Complete BVN Verification',
        description: 'Verify your Bank Verification Number for financial trust',
        priority: 'high',
        impact: 25,
      });
    }

    if (!results.cbn || !results.cbn.compliant) {
      recommendations.push({
        type: 'cbn',
        title: 'Ensure CBN Compliance',
        description: 'Complete CBN compliance verification',
        priority: 'medium',
        impact: 20,
      });
    }

    if (!results.phone || !results.phone.verified) {
      recommendations.push({
        type: 'phone',
        title: 'Verify Phone Number',
        description: 'Verify your phone number for better communication',
        priority: 'medium',
        impact: 15,
      });
    }

    if (!results.email || !results.email.verified) {
      recommendations.push({
        type: 'email',
        title: 'Verify Email Address',
        description: 'Verify your email for account security',
        priority: 'low',
        impact: 10,
      });
    }

    return recommendations.sort((a, b) => b.impact - a.impact);
  }

  /**
   * Get cached verification result
   */
  getCachedVerification(type, identifier) {
    const key = `${type}_${identifier}`;
    const cached = this.verificationCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
      return cached;
    }
    
    return null;
  }

  /**
   * Clear verification cache
   */
  clearCache() {
    this.verificationCache.clear();
  }

  /**
   * Get authentication token
   */
  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }
}

export default new VerificationService();