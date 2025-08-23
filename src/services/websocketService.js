// WebSocket service for real-time chat functionality
class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 1000;
    this.isConnected = false;
    this.messageQueue = [];
    this.listeners = new Map();
    this.heartbeatInterval = null;
    this.userId = null;
  }

  // Connect to WebSocket server
  connect(userId, authToken) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.userId = userId;
    const wsUrl = `wss://your-websocket-server.com/chat?userId=${userId}&token=${authToken}`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.handleReconnect();
    }
  }

  // Setup WebSocket event listeners
  setupEventListeners() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.processMessageQueue();
      this.emit('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.isConnected = false;
      this.stopHeartbeat();
      this.emit('disconnected');
      
      if (event.code !== 1000) { // Not a normal closure
        this.handleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
  }

  // Handle incoming messages
  handleMessage(data) {
    switch (data.type) {
      case 'message':
        this.emit('newMessage', data.payload);
        break;
      case 'messageStatus':
        this.emit('messageStatusUpdate', data.payload);
        break;
      case 'typing':
        this.emit('userTyping', data.payload);
        break;
      case 'stopTyping':
        this.emit('userStoppedTyping', data.payload);
        break;
      case 'userOnline':
        this.emit('userOnline', data.payload);
        break;
      case 'userOffline':
        this.emit('userOffline', data.payload);
        break;
      case 'conversationUpdate':
        this.emit('conversationUpdate', data.payload);
        break;
      case 'pong':
        // Heartbeat response
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  // Send message through WebSocket
  sendMessage(message) {
    const messageData = {
      type: 'message',
      payload: {
        ...message,
        timestamp: new Date().toISOString(),
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    };

    if (this.isConnected) {
      this.ws.send(JSON.stringify(messageData));
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(messageData);
    }

    return messageData.payload;
  }

  // Send typing indicator
  sendTyping(conversationId) {
    if (!this.isConnected) return;

    const typingData = {
      type: 'typing',
      payload: {
        conversationId,
        userId: this.userId,
        timestamp: new Date().toISOString()
      }
    };

    this.ws.send(JSON.stringify(typingData));
  }

  // Send stop typing indicator
  sendStopTyping(conversationId) {
    if (!this.isConnected) return;

    const stopTypingData = {
      type: 'stopTyping',
      payload: {
        conversationId,
        userId: this.userId,
        timestamp: new Date().toISOString()
      }
    };

    this.ws.send(JSON.stringify(stopTypingData));
  }

  // Mark messages as read
  markAsRead(conversationId, messageIds) {
    if (!this.isConnected) return;

    const readData = {
      type: 'markAsRead',
      payload: {
        conversationId,
        messageIds,
        userId: this.userId,
        timestamp: new Date().toISOString()
      }
    };

    this.ws.send(JSON.stringify(readData));
  }

  // Join conversation room
  joinConversation(conversationId) {
    if (!this.isConnected) return;

    const joinData = {
      type: 'joinConversation',
      payload: {
        conversationId,
        userId: this.userId
      }
    };

    this.ws.send(JSON.stringify(joinData));
  }

  // Leave conversation room
  leaveConversation(conversationId) {
    if (!this.isConnected) return;

    const leaveData = {
      type: 'leaveConversation',
      payload: {
        conversationId,
        userId: this.userId
      }
    };

    this.ws.send(JSON.stringify(leaveData));
  }

  // Process queued messages
  processMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      this.ws.send(JSON.stringify(message));
    }
  }

  // Handle reconnection
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId, this.authToken);
      }
    }, delay);
  }

  // Start heartbeat to keep connection alive
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Send ping every 30 seconds
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit event to listeners
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Disconnect WebSocket
  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
    this.isConnected = false;
    this.messageQueue = [];
    this.listeners.clear();
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length
    };
  }

  // Mock WebSocket for development/testing
  enableMockMode() {
    console.log('WebSocket mock mode enabled');
    
    // Simulate connection
    setTimeout(() => {
      this.isConnected = true;
      this.emit('connected');
    }, 1000);

    // Simulate incoming messages
    setInterval(() => {
      if (this.isConnected && Math.random() > 0.8) {
        const mockMessage = {
          id: `mock_${Date.now()}`,
          conversationId: 'conv_1',
          content: 'This is a mock message for testing',
          senderId: 'mock_user',
          senderName: 'Mock User',
          timestamp: new Date().toISOString(),
          type: 'text',
          status: 'delivered'
        };
        this.emit('newMessage', mockMessage);
      }
    }, 10000);
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

// Enable mock mode for development
if (__DEV__) {
  websocketService.enableMockMode();
}

export default websocketService;
export { websocketService };