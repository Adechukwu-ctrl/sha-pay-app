/**
 * Logging middleware for Redux actions
 * Provides detailed logging for development and debugging
 */
export const loggingMiddleware = (store) => (next) => (action) => {
  // Only log in development mode
  if (__DEV__) {
    const prevState = store.getState();
    const startTime = performance.now();
    
    console.group(`🔄 Redux Action: ${action.type}`);
    console.log('📤 Action:', action);
    console.log('📊 Previous State:', prevState);
    
    const result = next(action);
    
    const nextState = store.getState();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log('📈 Next State:', nextState);
    console.log(`⏱️ Duration: ${duration.toFixed(2)}ms`);
    
    // Log state changes
    logStateChanges(prevState, nextState, action.type);
    
    console.groupEnd();
    
    return result;
  }
  
  return next(action);
};

/**
 * Log specific state changes for better debugging
 */
const logStateChanges = (prevState, nextState, actionType) => {
  const changes = [];
  
  // Check auth state changes
  if (prevState.auth !== nextState.auth) {
    if (prevState.auth.isAuthenticated !== nextState.auth.isAuthenticated) {
      changes.push(`🔐 Authentication: ${prevState.auth.isAuthenticated} → ${nextState.auth.isAuthenticated}`);
    }
    if (prevState.auth.loading !== nextState.auth.loading) {
      changes.push(`⏳ Auth Loading: ${prevState.auth.loading} → ${nextState.auth.loading}`);
    }
    if (prevState.auth.error !== nextState.auth.error) {
      changes.push(`❌ Auth Error: ${prevState.auth.error} → ${nextState.auth.error}`);
    }
  }
  
  // Check jobs state changes
  if (prevState.jobs !== nextState.jobs) {
    if (prevState.jobs.jobs.length !== nextState.jobs.jobs.length) {
      changes.push(`💼 Jobs Count: ${prevState.jobs.jobs.length} → ${nextState.jobs.jobs.length}`);
    }
    if (prevState.jobs.loading !== nextState.jobs.loading) {
      changes.push(`⏳ Jobs Loading: ${prevState.jobs.loading} → ${nextState.jobs.loading}`);
    }
  }
  
  // Check payment state changes
  if (prevState.payment !== nextState.payment) {
    if (prevState.payment.loading !== nextState.payment.loading) {
      changes.push(`⏳ Payment Loading: ${prevState.payment.loading} → ${nextState.payment.loading}`);
    }
    if (prevState.payment.escrowBalance !== nextState.payment.escrowBalance) {
      changes.push(`💰 Escrow Balance: ${prevState.payment.escrowBalance} → ${nextState.payment.escrowBalance}`);
    }
  }
  
  // Check chat state changes
  if (prevState.chat !== nextState.chat) {
    if (prevState.chat.conversations.length !== nextState.chat.conversations.length) {
      changes.push(`💬 Conversations: ${prevState.chat.conversations.length} → ${nextState.chat.conversations.length}`);
    }
    if (prevState.chat.messages.length !== nextState.chat.messages.length) {
      changes.push(`📨 Messages: ${prevState.chat.messages.length} → ${nextState.chat.messages.length}`);
    }
    if (prevState.chat.unreadCount !== nextState.chat.unreadCount) {
      changes.push(`🔔 Unread Count: ${prevState.chat.unreadCount} → ${nextState.chat.unreadCount}`);
    }
  }
  
  // Check user state changes
  if (prevState.user !== nextState.user) {
    if (prevState.user.currentCategory !== nextState.user.currentCategory) {
      changes.push(`👤 User Category: ${prevState.user.currentCategory} → ${nextState.user.currentCategory}`);
    }
  }
  
  if (changes.length > 0) {
    console.log('🔄 State Changes:');
    changes.forEach(change => console.log(`  ${change}`));
  }
};

/**
 * Performance monitoring for async actions
 */
export const performanceMiddleware = (store) => (next) => (action) => {
  if (__DEV__ && action.type.includes('/pending')) {
    const actionName = action.type.replace('/pending', '');
    console.time(`⚡ ${actionName}`);
  }
  
  const result = next(action);
  
  if (__DEV__ && (action.type.includes('/fulfilled') || action.type.includes('/rejected'))) {
    const actionName = action.type.replace('/fulfilled', '').replace('/rejected', '');
    console.timeEnd(`⚡ ${actionName}`);
    
    if (action.type.includes('/rejected')) {
      console.warn(`❌ ${actionName} failed:`, action.payload);
    } else {
      console.log(`✅ ${actionName} completed successfully`);
    }
  }
  
  return result;
};

/**
 * Action analytics for tracking user behavior
 */
export const analyticsMiddleware = (store) => (next) => (action) => {
  // Track important user actions for analytics
  const trackableActions = [
    'auth/login/fulfilled',
    'auth/register/fulfilled',
    'jobs/createJobRequest/fulfilled',
    'jobs/acceptJob/fulfilled',
    'jobs/completeJob/fulfilled',
    'payment/processPayment/fulfilled',
    'chat/sendMessage/fulfilled',
  ];
  
  if (trackableActions.includes(action.type)) {
    // In a real app, you would send this to your analytics service
    console.log('📊 Analytics Event:', {
      action: action.type,
      timestamp: new Date().toISOString(),
      userId: store.getState().auth.user?.id,
      payload: action.payload,
    });
  }
  
  return next(action);
};