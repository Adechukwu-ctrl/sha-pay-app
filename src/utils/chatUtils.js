import { Alert } from 'react-native';

// Chat utility functions
export const chatUtils = {
  // Format message timestamp
  formatMessageTime: (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  },

  // Format conversation time
  formatConversationTime: (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  },

  // Get message status icon
  getMessageStatusIcon: (status) => {
    switch (status) {
      case 'sending':
        return 'clock-outline';
      case 'sent':
        return 'check';
      case 'delivered':
        return 'check-all';
      case 'read':
        return 'check-all';
      case 'failed':
        return 'alert-circle-outline';
      default:
        return 'clock-outline';
    }
  },

  // Get message status color
  getMessageStatusColor: (status) => {
    switch (status) {
      case 'sending':
        return '#999999';
      case 'sent':
        return '#999999';
      case 'delivered':
        return '#007AFF';
      case 'read':
        return '#007AFF';
      case 'failed':
        return '#FF3B30';
      default:
        return '#999999';
    }
  },

  // Validate message content
  validateMessage: (content) => {
    if (!content || content.trim().length === 0) {
      return { isValid: false, error: 'Message cannot be empty' };
    }
    if (content.length > 1000) {
      return { isValid: false, error: 'Message is too long (max 1000 characters)' };
    }
    return { isValid: true };
  },

  // Generate conversation preview
  generateConversationPreview: (lastMessage, maxLength = 50) => {
    if (!lastMessage || !lastMessage.content) {
      return 'No messages yet';
    }

    const content = lastMessage.content.trim();
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  },

  // Check if user is online (mock implementation)
  isUserOnline: (userId) => {
    // This would typically check against a real-time presence system
    return Math.random() > 0.3; // Mock: 70% chance user is online
  },

  // Get user initials for avatar
  getUserInitials: (fullName) => {
    if (!fullName) return '??';
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  },

  // Generate avatar color based on user ID
  getAvatarColor: (userId) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  },

  // Sort conversations by last message time
  sortConversationsByTime: (conversations) => {
    return conversations.sort((a, b) => {
      const timeA = a.lastMessage?.timestamp || a.updatedAt;
      const timeB = b.lastMessage?.timestamp || b.updatedAt;
      return new Date(timeB) - new Date(timeA);
    });
  },

  // Filter conversations by search query
  filterConversations: (conversations, query) => {
    if (!query || query.trim().length === 0) {
      return conversations;
    }

    const searchTerm = query.toLowerCase().trim();
    return conversations.filter(conversation => {
      // Search in participant names
      const participantMatch = conversation.participants.some(participant =>
        participant.fullName?.toLowerCase().includes(searchTerm)
      );

      // Search in job title
      const jobTitleMatch = conversation.jobTitle?.toLowerCase().includes(searchTerm);

      // Search in last message
      const messageMatch = conversation.lastMessage?.content?.toLowerCase().includes(searchTerm);

      return participantMatch || jobTitleMatch || messageMatch;
    });
  },

  // Group messages by date
  groupMessagesByDate: (messages) => {
    const grouped = {};
    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(message);
    });
    return grouped;
  },

  // Check if message should show sender name
  shouldShowSenderName: (message, previousMessage, isGroupChat = false) => {
    if (!isGroupChat) return false;
    if (!previousMessage) return true;
    return previousMessage.senderId !== message.senderId;
  },

  // Check if messages should be grouped together
  shouldGroupMessages: (currentMessage, previousMessage, timeThreshold = 5) => {
    if (!previousMessage) return false;
    if (currentMessage.senderId !== previousMessage.senderId) return false;

    const timeDiff = new Date(currentMessage.timestamp) - new Date(previousMessage.timestamp);
    const minutesDiff = timeDiff / (1000 * 60);

    return minutesDiff <= timeThreshold;
  },

  // Handle message retry
  retryFailedMessage: (messageId, retryCallback) => {
    Alert.alert(
      'Retry Message',
      'Do you want to retry sending this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: () => retryCallback(messageId) }
      ]
    );
  },

  // Handle message deletion
  confirmDeleteMessage: (messageId, deleteCallback) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteCallback(messageId) }
      ]
    );
  },

  // Generate typing indicator text
  getTypingIndicatorText: (typingUsers) => {
    if (!typingUsers || typingUsers.length === 0) {
      return '';
    }

    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`;
    } else {
      return `${typingUsers.length} people are typing...`;
    }
  },

  // Calculate unread count for conversations
  calculateTotalUnreadCount: (conversations) => {
    return conversations.reduce((total, conversation) => {
      return total + (conversation.unreadCount || 0);
    }, 0);
  },

  // Check if conversation has unread messages
  hasUnreadMessages: (conversation) => {
    return conversation.unreadCount && conversation.unreadCount > 0;
  },

  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Validate file for chat
  validateChatFile: (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];

    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 10MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'File type not supported' };
    }

    return { isValid: true };
  }
};

export default chatUtils;