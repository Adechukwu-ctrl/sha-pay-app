import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import chatService from '../../services/chatService';

// Async thunks for chat functionality
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      return await chatService.fetchConversations();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId, { rejectWithValue }) => {
    try {
      return await chatService.fetchMessages(conversationId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (messageData, { rejectWithValue }) => {
    try {
      return await chatService.sendMessage(messageData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async (conversationData, { rejectWithValue }) => {
    try {
      return await chatService.createConversation(conversationData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create conversation');
    }
  }
);

export const markMessagesAsRead = createAsyncThunk(
  'chat/markMessagesAsRead',
  async ({ conversationId, messageIds }, { rejectWithValue }) => {
    try {
      return await chatService.markMessagesAsRead(conversationId, messageIds);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark messages as read');
    }
  }
);

const initialState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
  unreadCount: 0,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
    },
    clearChatError: (state) => {
      state.error = null;
    },
    receiveMessage: (state, action) => {
      const message = action.payload;
      
      // Add message to messages if it belongs to current conversation
      if (state.currentConversation && message.conversationId === state.currentConversation.id) {
        state.messages.push(message);
      }
      
      // Update conversation with latest message
      const conversationIndex = state.conversations.findIndex(
        conv => conv.id === message.conversationId
      );
      
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].lastMessage = message;
        
        // If not current conversation, increment unread count
        if (!state.currentConversation || state.currentConversation.id !== message.conversationId) {
          state.conversations[conversationIndex].unreadCount += 1;
          state.unreadCount += 1;
        }
      }
    },
    markConversationAsRead: (state, action) => {
      const conversationId = action.payload;
      const conversationIndex = state.conversations.findIndex(
        conv => conv.id === conversationId
      );
      
      if (conversationIndex !== -1) {
        const unreadCount = state.conversations[conversationIndex].unreadCount;
        state.conversations[conversationIndex].unreadCount = 0;
        state.unreadCount -= unreadCount;
      }
    },
    updateMessageStatus: (state, action) => {
      const { messageId, status } = action.payload;
      const messageIndex = state.messages.findIndex(msg => msg.id === messageId);
      
      if (messageIndex !== -1) {
        state.messages[messageIndex].status = status;
      }
    },
    deleteMessage: (state, action) => {
      const { messageId } = action.payload;
      state.messages = state.messages.filter(msg => msg.id !== messageId);
    },
    editMessage: (state, action) => {
      const { messageId, content } = action.payload;
      const messageIndex = state.messages.findIndex(msg => msg.id === messageId);
      
      if (messageIndex !== -1) {
        state.messages[messageIndex].content = content;
        state.messages[messageIndex].edited = true;
        state.messages[messageIndex].editedAt = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
        state.unreadCount = action.payload.reduce(
          (count, conv) => count + (conv.unreadCount || 0), 0
        );
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push(action.payload);
        
        // Update conversation with latest message
        const conversationIndex = state.conversations.findIndex(
          conv => conv.id === action.payload.conversationId
        );
        
        if (conversationIndex !== -1) {
          state.conversations[conversationIndex].lastMessage = action.payload;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Conversation
      .addCase(createConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations.unshift(action.payload);
        state.currentConversation = action.payload;
        state.messages = [];
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark Messages as Read
      .addCase(markMessagesAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        state.loading = false;
        const { conversationId, messageIds } = action.meta.arg;
        
        // Mark messages as read in current conversation
        if (state.currentConversation && state.currentConversation.id === conversationId) {
          state.messages.forEach(message => {
            if (messageIds.includes(message.id)) {
              message.read = true;
            }
          });
        }
        
        // Update conversation unread count
        const conversationIndex = state.conversations.findIndex(
          conv => conv.id === conversationId
        );
        
        if (conversationIndex !== -1) {
          const unreadCount = state.conversations[conversationIndex].unreadCount;
          state.conversations[conversationIndex].unreadCount = Math.max(0, unreadCount - messageIds.length);
          state.unreadCount = Math.max(0, state.unreadCount - messageIds.length);
        }
      })
      .addCase(markMessagesAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  setCurrentConversation, 
  clearChatError, 
  receiveMessage, 
  markConversationAsRead,
  updateMessageStatus,
  deleteMessage,
  editMessage
} = chatSlice.actions;

// Selectors
export const selectConversationById = (state, conversationId) => 
  state.chat.conversations.find(conversation => conversation.id === conversationId);

export const selectConversationMessages = (state, conversationId) => 
  state.chat.currentConversation?.id === conversationId ? state.chat.messages : [];

export default chatSlice.reducer;