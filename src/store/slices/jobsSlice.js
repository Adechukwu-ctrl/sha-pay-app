import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import jobsService from '../../services/jobsService';

// Async thunks for jobs
export const createJobRequest = createAsyncThunk(
  'jobs/createRequest',
  async (jobData, { rejectWithValue }) => {
    try {
      return await jobsService.createJobRequest(jobData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create job request');
    }
  }
);

export const acceptJob = createAsyncThunk(
  'jobs/accept',
  async (acceptanceData, { rejectWithValue }) => {
    try {
      return await jobsService.acceptJob(acceptanceData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept job');
    }
  }
);

export const completeJob = createAsyncThunk(
  'jobs/complete',
  async (completionData, { rejectWithValue }) => {
    try {
      return await jobsService.completeJob(completionData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark job as complete');
    }
  }
);

export const satisfyJob = createAsyncThunk(
  'jobs/satisfy',
  async (satisfactionData, { rejectWithValue }) => {
    try {
      return await jobsService.satisfyJob(satisfactionData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit satisfaction');
    }
  }
);

export const createDispute = createAsyncThunk(
  'jobs/dispute',
  async (disputeData, { rejectWithValue }) => {
    try {
      return await jobsService.createDispute(disputeData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create dispute');
    }
  }
);

export const fetchJobs = createAsyncThunk(
  'jobs/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await jobsService.fetchJobs();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch jobs');
    }
  }
);

export const fetchJobById = createAsyncThunk(
  'jobs/fetchJobById',
  async (jobId, { rejectWithValue }) => {
    try {
      return await jobsService.fetchJobById(jobId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch job details');
    }
  }
);

export const fetchUserReviews = createAsyncThunk(
  'jobs/fetchUserReviews',
  async (userId, { rejectWithValue }) => {
    try {
      return await jobsService.fetchUserReviews(userId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user reviews');
    }
  }
);

export const fetchUserStats = createAsyncThunk(
  'jobs/fetchUserStats',
  async (userId, { rejectWithValue }) => {
    try {
      return await jobsService.fetchUserStats(userId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user stats');
    }
  }
);

export const markJobComplete = createAsyncThunk(
  'jobs/markJobComplete',
  async (jobId, { rejectWithValue }) => {
    try {
      return await jobsService.markJobComplete(jobId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark job as complete');
    }
  }
);

export const cancelJob = createAsyncThunk(
  'jobs/cancelJob',
  async (jobId, { rejectWithValue }) => {
    try {
      return await jobsService.cancelJob(jobId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel job');
    }
  }
);

export const fetchUserJobs = createAsyncThunk(
  'jobs/fetchUserJobs',
  async (userId, { rejectWithValue }) => {
    try {
      return await jobsService.fetchUserJobs(userId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user jobs');
    }
  }
);

export const favoriteJob = createAsyncThunk(
  'jobs/favoriteJob',
  async ({ jobId, isFavorite }, { rejectWithValue }) => {
    try {
      return await jobsService.favoriteJob(jobId, isFavorite);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update favorite status');
    }
  }
);

export const applyForJob = createAsyncThunk(
  'jobs/applyForJob',
  async ({ jobId, userId }, { rejectWithValue }) => {
    try {
      return await jobsService.applyForJob(jobId, userId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply for job');
    }
  }
);

export const fetchJobDetails = createAsyncThunk(
  'jobs/fetchJobDetails',
  async (jobId, { rejectWithValue }) => {
    try {
      return await jobsService.fetchJobDetails(jobId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch job details');
    }
  }
);

export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (jobData, { rejectWithValue }) => {
    try {
      return await jobsService.createJob(jobData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create job');
    }
  }
);

const initialState = {
  jobs: [],
  currentJob: null,
  userReviews: [],
  userStats: null,
  loading: false,
  error: null,
  jobRequests: [],
  jobOffers: [],
  activeJobs: [],
  completedJobs: [],
  disputes: [],
  filters: {
    category: '',
    location: '',
    priceRange: [0, 1000],
    jobType: '',
    sortBy: 'newest'
  },
};

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setCurrentJob: (state, action) => {
      state.currentJob = action.payload;
    },
    clearJobError: (state) => {
      state.error = null;
    },
    clearJobFilters: (state) => {
      state.filters = {
        category: '',
        location: '',
        priceRange: [0, 1000],
        jobType: '',
        sortBy: 'newest'
      };
    },
    setJobFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Jobs
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs = action.payload.jobs;
        state.jobRequests = action.payload.jobRequests;
        state.jobOffers = action.payload.jobOffers;
        state.activeJobs = action.payload.activeJobs;
        state.completedJobs = action.payload.completedJobs;
        state.disputes = action.payload.disputes;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Job By ID
      .addCase(fetchJobById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentJob = action.payload;
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Job Request
      .addCase(createJobRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createJobRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.jobRequests.push(action.payload);
        state.currentJob = action.payload;
      })
      .addCase(createJobRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Accept Job
      .addCase(acceptJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(acceptJob.fulfilled, (state, action) => {
        state.loading = false;
        state.activeJobs.push(action.payload);
        state.currentJob = action.payload;
        
        // Remove from job offers
        state.jobOffers = state.jobOffers.filter(
          offer => offer.id !== action.payload.id
        );
      })
      .addCase(acceptJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Complete Job
      .addCase(completeJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeJob.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update job status in active jobs
        const index = state.activeJobs.findIndex(
          job => job.id === action.payload.id
        );
        
        if (index !== -1) {
          state.activeJobs[index] = action.payload;
        }
        
        state.currentJob = action.payload;
      })
      .addCase(completeJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Satisfy Job
      .addCase(satisfyJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(satisfyJob.fulfilled, (state, action) => {
        state.loading = false;
        
        // Remove from active jobs and add to completed jobs
        state.activeJobs = state.activeJobs.filter(
          job => job.id !== action.payload.id
        );
        
        state.completedJobs.push(action.payload);
        state.currentJob = action.payload;
      })
      .addCase(satisfyJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Dispute
      .addCase(createDispute.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDispute.fulfilled, (state, action) => {
        state.loading = false;
        state.disputes.push(action.payload);
        
        // Update the current job with dispute information
        if (state.currentJob && state.currentJob.id === action.payload.jobId) {
          state.currentJob = {
            ...state.currentJob,
            hasDispute: true,
            disputeId: action.payload.id
          };
        }
      })
      .addCase(createDispute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch User Reviews
      .addCase(fetchUserReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.userReviews = action.payload;
      })
      .addCase(fetchUserReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch User Stats
      .addCase(fetchUserStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.loading = false;
        state.userStats = action.payload;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark Job Complete
      .addCase(markJobComplete.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markJobComplete.fulfilled, (state, action) => {
        state.loading = false;
        // Update job status in the jobs array
        const jobIndex = state.jobs.findIndex(job => job.id === action.payload.id);
        if (jobIndex !== -1) {
          state.jobs[jobIndex] = { ...state.jobs[jobIndex], ...action.payload };
        }
        // Update active jobs if applicable
        const activeJobIndex = state.activeJobs.findIndex(job => job.id === action.payload.id);
        if (activeJobIndex !== -1) {
          state.activeJobs[activeJobIndex] = { ...state.activeJobs[activeJobIndex], ...action.payload };
        }
      })
      .addCase(markJobComplete.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Cancel Job
      .addCase(cancelJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelJob.fulfilled, (state, action) => {
        state.loading = false;
        // Remove job from jobs array
        state.jobs = state.jobs.filter(job => job.id !== action.payload.id);
        // Remove from active jobs if applicable
        state.activeJobs = state.activeJobs.filter(job => job.id !== action.payload.id);
      })
      .addCase(cancelJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch User Jobs
      .addCase(fetchUserJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs = action.payload;
      })
      .addCase(fetchUserJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Favorite Job
      .addCase(favoriteJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(favoriteJob.fulfilled, (state, action) => {
        state.loading = false;
        // Update job favorite status in the jobs array
        const jobIndex = state.jobs.findIndex(job => job.id === action.payload.jobId);
        if (jobIndex !== -1) {
          state.jobs[jobIndex].isFavorite = action.payload.isFavorite;
        }
        // Update current job if it matches
        if (state.currentJob && state.currentJob.id === action.payload.jobId) {
          state.currentJob.isFavorite = action.payload.isFavorite;
        }
      })
      .addCase(favoriteJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Apply for Job
      .addCase(applyForJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyForJob.fulfilled, (state, action) => {
        state.loading = false;
        // Update job application status in the jobs array
        const jobIndex = state.jobs.findIndex(job => job.id === action.payload.jobId);
        if (jobIndex !== -1) {
          state.jobs[jobIndex].hasApplied = true;
          state.jobs[jobIndex].applicationId = action.payload.applicationId;
        }
        // Update current job if it matches
        if (state.currentJob && state.currentJob.id === action.payload.jobId) {
          state.currentJob.hasApplied = true;
          state.currentJob.applicationId = action.payload.applicationId;
        }
      })
      .addCase(applyForJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Job Details
      .addCase(fetchJobDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentJob = action.payload;
        // Update job in jobs array if it exists
        const jobIndex = state.jobs.findIndex(job => job.id === action.payload.id);
        if (jobIndex !== -1) {
          state.jobs[jobIndex] = action.payload;
        }
      })
      .addCase(fetchJobDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Job
      .addCase(createJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs.unshift(action.payload);
      })
      .addCase(createJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentJob, clearJobError, clearJobFilters, setJobFilters } = jobsSlice.actions;
export default jobsSlice.reducer;