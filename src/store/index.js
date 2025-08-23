import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import jobsReducer from './slices/jobsSlice';
import chatReducer from './slices/chatSlice';
import userReducer from './slices/userSlice';
import paymentReducer from './slices/paymentSlice';
import creditRatingReducer from './slices/creditRatingSlice';
import notificationReducer from './slices/notificationSlice';
import appReducer from './slices/appSlice';
import supportReducer from './slices/supportSlice';
import { errorHandlingMiddleware } from './middleware/errorHandling';
import { loggingMiddleware } from './middleware/logging';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    jobs: jobsReducer,
    chat: chatReducer,
    user: userReducer,
    payment: paymentReducer,
    creditRating: creditRatingReducer,
    notifications: notificationReducer,
    app: appReducer,
    support: supportReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['register'],
      },
    })
      .concat(errorHandlingMiddleware)
      .concat(loggingMiddleware),
  devTools: __DEV__ && {
    name: 'Sha_Pay Redux Store',
    trace: true,
    traceLimit: 25,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;