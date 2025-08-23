import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Mock API endpoints - replace with actual backend URLs
const API_BASE_URL = 'https://your-backend-api.com/api';

class JobsService {
  // Create a new job request
  async createJobRequest(jobData) {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getToken()}`,
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        throw new Error('Failed to create job request');
      }

      const data = await response.json();
      
      // Store locally for offline access
      await this.storeJobLocally(data.job);
      
      return data.job;
    } catch (error) {
      // Mock implementation for development
      const mockJob = {
        id: `job_${Date.now()}`,
        ...jobData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        requesterName: 'Current User',
      };
      
      await this.storeJobLocally(mockJob);
      return mockJob;
    }
  }

  // Accept a job offer
  async acceptJob(acceptanceData) {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${acceptanceData.jobId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getToken()}`,
        },
        body: JSON.stringify(acceptanceData),
      });

      if (!response.ok) {
        throw new Error('Failed to accept job');
      }

      const data = await response.json();
      await this.updateJobLocally(data.job);
      
      return data.job;
    } catch (error) {
      // Mock implementation
      const mockAcceptedJob = {
        id: acceptanceData.jobId,
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        agreedAmount: acceptanceData.agreedAmount,
        estimatedCompletion: acceptanceData.estimatedCompletion,
        additionalNotes: acceptanceData.additionalNotes,
        providerId: 'current_user_id',
        providerName: 'Current User',
      };
      
      await this.updateJobLocally(mockAcceptedJob);
      return mockAcceptedJob;
    }
  }

  // Mark job as complete
  async completeJob(completionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${completionData.jobId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getToken()}`,
        },
        body: JSON.stringify(completionData),
      });

      if (!response.ok) {
        throw new Error('Failed to mark job as complete');
      }

      const data = await response.json();
      await this.updateJobLocally(data.job);
      
      return data.job;
    } catch (error) {
      // Mock implementation
      const mockCompletedJob = {
        id: completionData.jobId,
        status: 'completed',
        completedAt: new Date().toISOString(),
        completionNotes: completionData.completionNotes,
        completionImages: completionData.completionImages,
        timeSpent: completionData.timeSpent,
        workQuality: completionData.workQuality,
        challengesFaced: completionData.challengesFaced,
        requestPayment: completionData.requestPayment,
      };
      
      await this.updateJobLocally(mockCompletedJob);
      return mockCompletedJob;
    }
  }

  // Submit job satisfaction
  async satisfyJob(satisfactionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${satisfactionData.jobId}/satisfy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getToken()}`,
        },
        body: JSON.stringify(satisfactionData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit satisfaction');
      }

      const data = await response.json();
      await this.updateJobLocally(data.job);
      
      return data.job;
    } catch (error) {
      // Mock implementation
      const mockSatisfiedJob = {
        id: satisfactionData.jobId,
        status: 'satisfied',
        satisfiedAt: new Date().toISOString(),
        rating: satisfactionData.rating,
        feedback: satisfactionData.feedback,
        isSatisfied: satisfactionData.isSatisfied,
        qualityAspects: satisfactionData.qualityAspects,
        wouldRecommend: satisfactionData.wouldRecommend,
        wouldHireAgain: satisfactionData.wouldHireAgain,
      };
      
      await this.updateJobLocally(mockSatisfiedJob);
      return mockSatisfiedJob;
    }
  }

  // Create a dispute
  async createDispute(disputeData) {
    try {
      const response = await fetch(`${API_BASE_URL}/disputes/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getToken()}`,
        },
        body: JSON.stringify(disputeData),
      });

      if (!response.ok) {
        throw new Error('Failed to create dispute');
      }

      const data = await response.json();
      await this.storeDisputeLocally(data.dispute);
      
      return data.dispute;
    } catch (error) {
      // Mock implementation
      const mockDispute = {
        id: `dispute_${Date.now()}`,
        jobId: disputeData.jobId,
        reason: disputeData.reason,
        description: disputeData.description,
        evidence: disputeData.evidence,
        initiatedBy: disputeData.initiatedBy,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      
      await this.storeDisputeLocally(mockDispute);
      return mockDispute;
    }
  }

  // Fetch all jobs
  async fetchJobs() {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      
      // Store locally for offline access
      await AsyncStorage.setItem('jobs_cache', JSON.stringify(data));
      
      return data;
    } catch (error) {
      // Return cached data or mock data
      const cachedJobs = await AsyncStorage.getItem('jobs_cache');
      if (cachedJobs) {
        return JSON.parse(cachedJobs);
      }
      
      // Mock data
      return {
        jobs: [],
        jobRequests: [],
        jobOffers: [],
        activeJobs: [],
        completedJobs: [],
        disputes: [],
      };
    }
  }

  // Fetch a specific job by ID
  async fetchJobById(jobId) {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }

      const data = await response.json();
      return data.job;
    } catch (error) {
      // Try to find job in local storage
      const existingJobs = await AsyncStorage.getItem('local_jobs');
      if (existingJobs) {
        const jobs = JSON.parse(existingJobs);
        const job = jobs.find(j => j.id === jobId);
        if (job) {
          return job;
        }
      }
      
      // Mock job data for development
      return {
        id: jobId,
        title: 'Sample Job',
        description: 'This is a sample job for development purposes.',
        category: 'General',
        budget: 100,
        status: 'pending',
        createdAt: new Date().toISOString(),
        requesterName: 'Sample User',
        serviceProviderId: null,
        serviceRequirerId: 'user_123',
      };
    }
  }

  // Fetch user reviews
  async fetchUserReviews(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/reviews`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user reviews');
      }

      const data = await response.json();
      return data.reviews;
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      
      // Return mock reviews as fallback
      return [
        {
          id: '1',
          rating: 5,
          comment: 'Excellent work quality and timely delivery!',
          reviewerName: 'John Doe',
          jobTitle: 'Website Development',
          date: new Date().toISOString()
        },
        {
          id: '2',
          rating: 4,
          comment: 'Good communication and professional service.',
          reviewerName: 'Jane Smith',
          jobTitle: 'Mobile App Design',
          date: new Date(Date.now() - 86400000).toISOString()
        }
      ];
    }
  }

  // Fetch user statistics
  async fetchUserStats(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }

      const data = await response.json();
      return data.stats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      
      // Return mock stats as fallback
      return {
        totalJobs: 15,
        completedJobs: 12,
        averageRating: 4.7,
        totalEarnings: 2500,
        successRate: 80,
        responseTime: '2 hours',
        joinDate: '2023-01-15'
      };
    }
  }

  // Helper methods
  async getToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      return null;
    }
  }

  async storeJobLocally(job) {
    try {
      const existingJobs = await AsyncStorage.getItem('local_jobs');
      const jobs = existingJobs ? JSON.parse(existingJobs) : [];
      jobs.push(job);
      await AsyncStorage.setItem('local_jobs', JSON.stringify(jobs));
    } catch (error) {
      console.error('Failed to store job locally:', error);
    }
  }

  async updateJobLocally(updatedJob) {
    try {
      const existingJobs = await AsyncStorage.getItem('local_jobs');
      const jobs = existingJobs ? JSON.parse(existingJobs) : [];
      const index = jobs.findIndex(job => job.id === updatedJob.id);
      
      if (index !== -1) {
        jobs[index] = { ...jobs[index], ...updatedJob };
      } else {
        jobs.push(updatedJob);
      }
      
      await AsyncStorage.setItem('local_jobs', JSON.stringify(jobs));
    } catch (error) {
      console.error('Failed to update job locally:', error);
    }
  }

  async storeDisputeLocally(dispute) {
    try {
      const existingDisputes = await AsyncStorage.getItem('local_disputes');
      const disputes = existingDisputes ? JSON.parse(existingDisputes) : [];
      disputes.push(dispute);
      await AsyncStorage.setItem('local_disputes', JSON.stringify(disputes));
    } catch (error) {
      console.error('Failed to store dispute locally:', error);
    }
  }

  // Mark job as complete
  async markJobComplete(jobId) {
    try {
      const token = await this.getToken();
      const response = await httpClient.put(
        API_ENDPOINTS.JOBS.COMPLETE.replace(':id', jobId),
        { status: 'completed' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const completedJob = response.data;
      await this.updateJobLocally(completedJob);
      return completedJob;
    } catch (error) {
      console.error('Error marking job as complete:', error);
      
      // Mock job completion for development
      const mockCompletedJob = {
        id: jobId,
        status: 'completed',
        completedAt: new Date().toISOString(),
        paymentReleased: true
      };
      
      await this.updateJobLocally(mockCompletedJob);
       return mockCompletedJob;
     }
   }

   // Cancel job
   async cancelJob(jobId) {
     try {
       const token = await this.getToken();
       const response = await httpClient.delete(
         API_ENDPOINTS.JOBS.CANCEL.replace(':id', jobId),
         {
           headers: {
             Authorization: `Bearer ${token}`,
             'Content-Type': 'application/json'
           }
         }
       );
       
       const cancelledJob = response.data;
       // Remove from local storage
       const existingJobs = await AsyncStorage.getItem('local_jobs');
       if (existingJobs) {
         const jobs = JSON.parse(existingJobs);
         const filteredJobs = jobs.filter(job => job.id !== jobId);
         await AsyncStorage.setItem('local_jobs', JSON.stringify(filteredJobs));
       }
       
       return cancelledJob;
     } catch (error) {
       console.error('Error cancelling job:', error);
       
       // Mock job cancellation for development
       const mockCancelledJob = {
         id: jobId,
         status: 'cancelled',
         cancelledAt: new Date().toISOString()
       };
       
       return mockCancelledJob;
      }
    }

    // Fetch user jobs
    async fetchUserJobs(userId) {
      try {
        const token = await this.getToken();
        const response = await httpClient.get(
          API_ENDPOINTS.JOBS.USER_JOBS.replace(':userId', userId),
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const userJobs = response.data;
        // Store jobs locally
        await AsyncStorage.setItem('local_jobs', JSON.stringify(userJobs));
        return userJobs;
      } catch (error) {
        console.error('Error fetching user jobs:', error);
        
        // Try to get jobs from local storage
        try {
          const localJobs = await AsyncStorage.getItem('local_jobs');
          if (localJobs) {
            return JSON.parse(localJobs);
          }
        } catch (localError) {
          console.error('Error reading local jobs:', localError);
        }
        
        // Return mock jobs for development
        return [
          {
            id: 'job_1',
            title: 'Sample Job 1',
            description: 'This is a sample job for development',
            status: 'active',
            amount: 50,
            createdAt: new Date().toISOString()
          },
          {
            id: 'job_2',
            title: 'Sample Job 2',
            description: 'Another sample job for development',
            status: 'completed',
            amount: 75,
            createdAt: new Date().toISOString()
          }
        ];
       }
     }

     // Favorite/unfavorite job
     async favoriteJob(jobId, isFavorite) {
       try {
         const token = await this.getToken();
         const response = await httpClient.post(
           API_ENDPOINTS.JOBS.FAVORITE.replace(':id', jobId),
           { isFavorite },
           {
             headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json'
             }
           }
         );
         
         return { jobId, isFavorite };
       } catch (error) {
         console.error('Error updating favorite status:', error);
         
         // Mock favorite update for development
          return { jobId, isFavorite };
        }
      }

      // Apply for job
      async applyForJob(jobId, userId) {
        try {
          const token = await this.getToken();
          const response = await httpClient.post(
            API_ENDPOINTS.JOBS.APPLY.replace(':id', jobId),
            { userId },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          return response.data;
        } catch (error) {
          console.error('Error applying for job:', error);
          
          // Mock job application for development
          return {
            jobId,
            userId,
            applicationId: `APP_${Date.now()}`,
            status: 'pending',
            appliedAt: new Date().toISOString()
          };
         }
       }

       // Fetch job details
       async fetchJobDetails(jobId) {
         try {
           const token = await this.getToken();
           const response = await httpClient.get(
             API_ENDPOINTS.JOBS.DETAILS.replace(':id', jobId),
             {
               headers: {
                 Authorization: `Bearer ${token}`,
                 'Content-Type': 'application/json'
               }
             }
           );
           
           const jobDetails = response.data;
           await this.updateJobLocally(jobDetails);
           return jobDetails;
         } catch (error) {
           console.error('Error fetching job details:', error);
           
           // Try to get job from local storage first
           try {
             const localJobs = await AsyncStorage.getItem('local_jobs');
             if (localJobs) {
               const jobs = JSON.parse(localJobs);
               const job = jobs.find(j => j.id === jobId);
               if (job) {
                 return job;
               }
             }
           } catch (localError) {
             console.error('Error reading local jobs:', localError);
           }
           
           // Return mock job details for development
           return {
             id: jobId,
             title: 'Sample Job Details',
             description: 'This is a detailed description of the job for development purposes.',
             category: 'Technology',
             location: 'Remote',
             budget: 100,
             duration: '1-2 weeks',
             skillsRequired: ['JavaScript', 'React Native'],
             postedBy: {
               id: 'user_123',
               name: 'John Doe',
               rating: 4.5,
               completedJobs: 25
             },
             status: 'open',
             applicants: 5,
             createdAt: new Date().toISOString(),
             deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
           };
         }
       }

       // Create job
       async createJob(jobData) {
         try {
           const token = await this.getToken();
           const response = await httpClient.post(
             API_ENDPOINTS.JOBS.CREATE,
             jobData,
             {
               headers: {
                 Authorization: `Bearer ${token}`,
                 'Content-Type': 'application/json'
               }
             }
           );
           
           const newJob = response.data;
           await this.storeJobLocally(newJob);
           return newJob;
         } catch (error) {
           console.error('Error creating job:', error);
           
           // Return mock job for development
           const mockJob = {
             id: `job_${Date.now()}`,
             ...jobData,
             status: 'open',
             applicants: 0,
             createdAt: new Date().toISOString(),
             postedBy: {
               id: 'user_123',
               name: 'Current User',
               rating: 4.5
             }
           };
           
           await this.storeJobLocally(mockJob);
           return mockJob;
         }
       }
     }

export default new JobsService();