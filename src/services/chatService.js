import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import httpClient from './httpClient';
import { API_ENDPOINTS, buildUrl, STORAGE_KEYS } from '../config/api';

class ChatService {
  // Fetch all conversations for a user
  async fetchConversations(userId) {
    try {
      const response = await httpClient.get(buildUrl(API_ENDPOINTS.CHAT.CONVERSATIONS, { userId }));
      const data = response.data;
      
      // Store locally for offline access
      await AsyncStorage.setItem(`conversations_${userId}`, JSON.stringify(data));
      
      return data;
    } catch (error) {
      // Return cached data or mock data
      const cachedConversations = await AsyncStorage.getItem(`conversations_${userId}`);
      if (cachedConversations) {
        return JSON.parse(cachedConversations);
      }
      
      // Mock conversations
      return [
        {
          id: 'conv_1',
          jobId: 'job_1',
          participants: [
            {
              id: 'user_123',
              name: 'John Doe',
              avatar: null,
              role: 'provider',
            },
            {
              id: 'user_456',
              name: 'Jane Smith',
              avatar: null,
              role: 'requirer',
            },
          ],
          lastMessage: {
            id: 'msg_3',
            text: 'Great! I can start working on this tomorrow.',
            senderId: 'user_123',
            timestamp: '2024-01-15T14:30:00Z',
            type: 'text',
          },
          unreadCount: 0,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T14:30:00Z',
          jobTitle: 'Website Development',
          status: 'active',
        },
        {
          id: 'conv_2',
          jobId: 'job_2',
          participants: [
            {
              id: 'user_123',
              name: 'John Doe',
              avatar: null,
              role: 'provider',
            },
            {
              id: 'user_789',
              name: 'Mike Johnson',
              avatar: null,
              role: 'requirer',
            },
          ],
          lastMessage: {
            id: 'msg_6',
            text: 'When can you deliver the final design?',
            senderId: 'user_789',
            timestamp: '2024-01-14T16:45:00Z',
            type: 'text',
          },
          unreadCount: 2,
          createdAt: '2024-01-14T09:00:00Z',
          updatedAt: '2024-01-14T16:45:00Z',
          jobTitle: 'Mobile App UI Design',
          status: 'active',
        },
      ];
    }
  }

  // Fetch messages for a specific conversation
  async fetchMessages(conversationId, page = 1, limit = 50) {
    try {
      const response = await httpClient.get(buildUrl(API_ENDPOINTS.CHAT.MESSAGES, { conversationId }), {
        params: { page, limit }
      });
      const data = response.data;
      
      // Store locally for offline access
      await AsyncStorage.setItem(`messages_${conversationId}`, JSON.stringify(data));
      
      return data;
    } catch (error) {
      // Return cached data or mock data
      const cachedMessages = await AsyncStorage.getItem(`messages_${conversationId}`);
      if (cachedMessages) {
        return JSON.parse(cachedMessages);
      }
      
      // Mock messages
      return {
        messages: [
          {
            id: 'msg_1',
            conversationId: conversationId,
            text: 'Hi! I\'m interested in your job posting for website development.',
            senderId: 'user_123',
            senderName: 'John Doe',
            timestamp: '2024-01-15T10:00:00Z',
            type: 'text',
            status: 'delivered',
            edited: false,
          },
          {
            id: 'msg_2',
            conversationId: conversationId,
            text: 'Hello John! Thanks for your interest. Can you tell me about your experience with React?',
            senderId: 'user_456',
            senderName: 'Jane Smith',
            timestamp: '2024-01-15T10:15:00Z',
            type: 'text',
            status: 'read',
            edited: false,
          },
          {
            id: 'msg_3',
            conversationId: conversationId,
            text: 'I have 3 years of experience with React and have built several e-commerce websites. I can show you my portfolio.',
            senderId: 'user_123',
            senderName: 'John Doe',
            timestamp: '2024-01-15T10:30:00Z',
            type: 'text',
            status: 'read',
            edited: false,
          },
          {
            id: 'msg_4',
            conversationId: conversationId,
            text: 'That sounds perfect! What\'s your estimated timeline for completion?',
            senderId: 'user_456',
            senderName: 'Jane Smith',
            timestamp: '2024-01-15T11:00:00Z',
            type: 'text',
            status: 'read',
            edited: false,
          },
          {
            id: 'msg_5',
            conversationId: conversationId,
            text: 'I can complete the project within 2 weeks. Would you like to discuss the requirements in detail?',
            senderId: 'user_123',
            senderName: 'John Doe',
            timestamp: '2024-01-15T14:30:00Z',
            type: 'text',
            status: 'delivered',
            edited: false,
          },
        ],
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalMessages: 5,
          hasMore: false,
        },
      };
    }
  }

  // Send a new message
  async sendMessage(messageData) {
    try {
      const response = await httpClient.post(buildUrl(API_ENDPOINTS.CHAT.SEND_MESSAGE, { conversationId: messageData.conversationId }), messageData);
      const data = response.data;
      
      // Update local storage
      await this.updateLocalMessages(messageData.conversationId, data);
      
      return data;
    } catch (error) {
      // Mock implementation
      const mockMessage = {
        id: `msg_${Date.now()}`,
        conversationId: messageData.conversationId,
        text: messageData.text,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        timestamp: new Date().toISOString(),
        type: messageData.type || 'text',
        status: 'sent',
        edited: false,
        attachments: messageData.attachments || [],
      };
      
      // Update local storage
      await this.updateLocalMessages(messageData.conversationId, mockMessage);
      
      return mockMessage;
    }
  }

  // Create a new conversation
  async createConversation(conversationData) {
    try {
      const response = await httpClient.post(API_ENDPOINTS.CHAT.CREATE_CONVERSATION, conversationData);
      const data = response.data;
      return data;
    } catch (error) {
      // Mock implementation
      const mockConversation = {
        id: `conv_${Date.now()}`,
        jobId: conversationData.jobId,
        participants: conversationData.participants,
        lastMessage: null,
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        jobTitle: conversationData.jobTitle,
        status: 'active',
      };
      
      return mockConversation;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId, messageIds) {
    try {
      const response = await httpClient.put(buildUrl(API_ENDPOINTS.CHAT.MARK_READ, { conversationId }), { messageIds });
      const data = response.data;
      return data;
    } catch (error) {
      // Mock implementation
      return {
        conversationId,
        markedAsRead: messageIds,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Delete a message
  async deleteMessage(messageId) {
    try {
      const response = await httpClient.delete(buildUrl(API_ENDPOINTS.CHAT.DELETE_MESSAGE, { messageId }));
      const data = response.data;
      return data;
    } catch (error) {
      // Mock implementation
      return {
        messageId,
        deleted: true,
        deletedAt: new Date().toISOString(),
      };
    }
  }

  // Edit a message
  async editMessage(messageId, newText) {
    try {
      const response = await httpClient.put(buildUrl(API_ENDPOINTS.CHAT.EDIT_MESSAGE, { messageId }), { text: newText });
      const data = response.data;
      return data;
    } catch (error) {
      // Mock implementation
      return {
        id: messageId,
        text: newText,
        edited: true,
        editedAt: new Date().toISOString(),
      };
    }
  }

  // Upload file/image for chat
  async uploadChatFile(fileData) {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: fileData.uri,
        type: fileData.type,
        name: fileData.fileName,
      });

      const response = await httpClient.upload(API_ENDPOINTS.CHAT.UPLOAD_FILE, formData);
      const data = response.data;
      return data;
    } catch (error) {
      // Mock implementation
      return {
        fileUrl: fileData.uri,
        fileName: fileData.fileName,
        fileType: fileData.type,
        fileSize: fileData.size,
        uploadedAt: new Date().toISOString(),
      };
    }
  }

  // Get unread message count
  async getUnreadCount(userId) {
    try {
      const response = await httpClient.get(buildUrl(API_ENDPOINTS.CHAT.UNREAD_COUNT, { userId }));
      const data = response.data;
      return data;
    } catch (error) {
      // Mock implementation
      return {
        totalUnread: 3,
        conversationCounts: {
          'conv_1': 0,
          'conv_2': 2,
          'conv_3': 1,
        },
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

  // Update local messages cache
  async updateLocalMessages(conversationId, newMessage) {
    try {
      const cachedMessages = await AsyncStorage.getItem(`messages_${conversationId}`);
      if (cachedMessages) {
        const messagesData = JSON.parse(cachedMessages);
        messagesData.messages.push(newMessage);
        await AsyncStorage.setItem(`messages_${conversationId}`, JSON.stringify(messagesData));
      }
    } catch (error) {
      console.error('Failed to update local messages:', error);
    }
  }

  // Search messages
  async searchMessages(query, conversationId = null) {
    try {
      const endpoint = conversationId 
        ? buildUrl(API_ENDPOINTS.CHAT.SEARCH_MESSAGES, { conversationId })
        : API_ENDPOINTS.CHAT.SEARCH;
        
      const response = await httpClient.get(endpoint, {
        params: { q: query }
      });
      const data = response.data;
      return data;
    } catch (error) {
      // Mock implementation
      return {
        results: [],
        totalResults: 0,
        query: query,
      };
    }
  }
}

export default new ChatService();