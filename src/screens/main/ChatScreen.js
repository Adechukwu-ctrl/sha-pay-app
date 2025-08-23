import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Avatar, Divider, ActivityIndicator, Surface, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMessages, sendMessage, fetchConversations, createConversation } from '../../store/slices/chatSlice';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import MessageBubble from '../../components/chat/MessageBubble';
import ChatInput from '../../components/chat/ChatInput';
import TypingIndicator from '../../components/chat/TypingIndicator';
import websocketService from '../../services/websocketService';
import { chatUtils } from '../../utils/chatUtils';

const ChatScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { conversations, currentConversation, messages, loading } = useSelector(state => state.chat);
  const { user } = useSelector(state => state.auth);
  
  const [showConversations, setShowConversations] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef({});
  
  useEffect(() => {
    // Load all conversations when component mounts
    dispatch(fetchConversations());
    
    // Initialize WebSocket connection
    if (user?.id) {
      websocketService.connect(user.id, user.authToken);
      
      // Setup WebSocket event listeners
      websocketService.on('connected', () => {
        setIsConnected(true);
      });
      
      websocketService.on('disconnected', () => {
        setIsConnected(false);
      });
      
      websocketService.on('newMessage', (message) => {
        dispatch({
          type: 'chat/receiveMessage',
          payload: message
        });
      });
      
      websocketService.on('userTyping', ({ userId, conversationId, userName }) => {
        if (currentConversation?.id === conversationId && userId !== user.id) {
          setTypingUsers(prev => {
            const existing = prev.find(u => u.id === userId);
            if (!existing) {
              return [...prev, { id: userId, name: userName }];
            }
            return prev;
          });
          
          // Clear existing timeout for this user
          if (typingTimeoutRef.current[userId]) {
            clearTimeout(typingTimeoutRef.current[userId]);
          }
          
          // Set timeout to remove typing indicator
          typingTimeoutRef.current[userId] = setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u.id !== userId));
            delete typingTimeoutRef.current[userId];
          }, 3000);
        }
      });
      
      websocketService.on('userStoppedTyping', ({ userId, conversationId }) => {
        if (currentConversation?.id === conversationId) {
          setTypingUsers(prev => prev.filter(u => u.id !== userId));
          if (typingTimeoutRef.current[userId]) {
            clearTimeout(typingTimeoutRef.current[userId]);
            delete typingTimeoutRef.current[userId];
          }
        }
      });
      
      websocketService.on('messageStatusUpdate', ({ messageId, status }) => {
        dispatch({
          type: 'chat/updateMessageStatus',
          payload: { messageId, status }
        });
      });
    }
    
    return () => {
      // Cleanup WebSocket listeners
      websocketService.off('connected');
      websocketService.off('disconnected');
      websocketService.off('newMessage');
      websocketService.off('userTyping');
      websocketService.off('userStoppedTyping');
      websocketService.off('messageStatusUpdate');
      
      // Clear all typing timeouts
      Object.values(typingTimeoutRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, [dispatch, user, currentConversation]);
  
  useEffect(() => {
    // If a conversation is selected, load its messages
    if (currentConversation) {
      dispatch(fetchMessages(currentConversation.id));
      setShowConversations(false);
    }
  }, [currentConversation, dispatch]);
  
  useEffect(() => {
    // If route params contain a user to chat with, create or open conversation
    if (route.params?.recipientId) {
      const existingConversation = conversations.find(
        conv => conv.participants.some(p => p.id === route.params.recipientId)
      );
      
      if (existingConversation) {
        handleSelectConversation(existingConversation);
      } else {
        // Create new conversation
        dispatch(createConversation({
          recipientId: route.params.recipientId,
          jobId: route.params?.jobId
        }));
      }
    }
  }, [route.params, conversations, dispatch]);
  
  const handleSendMessage = async (messageData) => {
    if (currentConversation) {
      const fullMessageData = {
        ...messageData,
        conversationId: currentConversation.id,
        senderId: user.id,
        timestamp: new Date().toISOString(),
      };
      
      dispatch(sendMessage(fullMessageData));
      
      // Send via WebSocket for real-time delivery
      if (isConnected) {
        websocketService.sendMessage(fullMessageData);
      }
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };
  
  const handleTyping = (isTyping) => {
    if (currentConversation && isConnected) {
      if (isTyping) {
        websocketService.sendTypingIndicator(currentConversation.id, user.name);
      } else {
        websocketService.sendStopTyping(currentConversation.id);
      }
    }
  };
  
  const handleSelectConversation = (conversation) => {
    dispatch({
      type: 'chat/setCurrentConversation',
      payload: conversation
    });
    setShowConversations(false);
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };
  
  const renderConversationItem = ({ item }) => {
    const otherParticipant = item.participants.find(p => p.id !== user.id);
    const lastMessage = item.lastMessage || {};
    const unreadCount = chatUtils.getUnreadCount(item.messages, user.id);
    const preview = chatUtils.getConversationPreview(lastMessage);
    const isOnline = chatUtils.isUserOnline(otherParticipant?.id); // Mock implementation
    
    return (
      <Surface style={styles.conversationItem} onTouchEnd={() => handleSelectConversation(item)}>
        <View style={styles.avatarContainer}>
          <Avatar.Text 
            size={50} 
            label={chatUtils.getUserInitials(otherParticipant?.fullName)}
            style={[styles.avatar, { backgroundColor: chatUtils.getAvatarColor(otherParticipant?.fullName) }]}
          />
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName}>{otherParticipant?.fullName || 'Unknown User'}</Text>
            <Text style={styles.conversationTime}>
              {lastMessage.timestamp ? chatUtils.formatMessageTime(lastMessage.timestamp) : ''}
            </Text>
          </View>
          <View style={styles.conversationFooter}>
            <Text numberOfLines={1} style={styles.conversationPreview}>
              {preview}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </Surface>
    );
  };
  
  const renderMessageItem = ({ item, index }) => {
    const isOwnMessage = item.senderId === user.id;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
    const showDate = index === 0 || 
      new Date(item.timestamp).toDateString() !== new Date(messages[index - 1].timestamp).toDateString();
    
    const showSenderName = chatUtils.shouldShowSenderName(item, previousMessage, isOwnMessage);
    const isGrouped = chatUtils.shouldGroupMessages(item, previousMessage, nextMessage);
    
    return (
      <View>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
          </View>
        )}
        <MessageBubble
          message={item}
          isOwnMessage={isOwnMessage}
          showSenderName={showSenderName}
          isGrouped={isGrouped}
          onRetry={() => handleSendMessage(item)}
          onDelete={(messageId) => {
            // Handle message deletion
            dispatch({
              type: 'chat/deleteMessage',
              payload: { messageId }
            });
          }}
          onEdit={(messageId, newContent) => {
            // Handle message editing
            dispatch({
              type: 'chat/editMessage',
              payload: { messageId, content: newContent }
            });
          }}
          onReply={(message) => {
            // Handle reply functionality
            // This could set a reply context in the chat input
          }}
        />
      </View>
    );
  };
  
  const renderConversationsList = () => (
    <View style={styles.conversationsContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      
      {loading && conversations.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="chat-outline" size={60} color="#CCCCCC" />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>Your messages with service providers and requirers will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={item => item.id}
          ItemSeparatorComponent={() => <Divider />}
          contentContainerStyle={styles.conversationsList}
        />
      )}
    </View>
  );
  
  const renderChatView = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={styles.chatContainer}
      keyboardVerticalOffset={80}
    >
      <View style={styles.chatHeader}>
        <Button 
          icon="arrow-left" 
          onPress={() => setShowConversations(true)}
          style={styles.backButton}
        />
        <View style={styles.chatHeaderContent}>
          <Text style={styles.chatHeaderTitle}>
            {currentConversation?.participants.find(p => p.id !== user.id)?.fullName || 'Chat'}
          </Text>
          <View style={styles.connectionStatus}>
            <View style={[styles.connectionDot, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
            <Text style={styles.connectionText}>
              {isConnected ? 'Connected' : 'Connecting...'}
            </Text>
          </View>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="message-text-outline" size={60} color="#CCCCCC" />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>Start the conversation by sending a message</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          inverted
          onContentSizeChange={() => flatListRef.current?.scrollToOffset({ offset: 0 })}
        />
      )}
      
      {typingUsers.length > 0 && (
        <TypingIndicator users={typingUsers} />
      )}
      
      <ChatInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        placeholder="Type a message..."
        disabled={!isConnected}
      />
    </KeyboardAvoidingView>
  );
  
  return (
    <View style={styles.container}>
      {showConversations ? renderConversationsList() : renderChatView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  conversationsContainer: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  conversationsList: {
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    elevation: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    // Avatar styles will be handled by the component
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  conversationContent: {
    flex: 1,
    marginLeft: 16,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  conversationTime: {
    fontSize: 12,
    color: '#888888',
  },
  conversationPreview: {
    color: '#666666',
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    marginRight: 16,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatHeaderContent: {
    flex: 1,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    color: '#666666',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 80,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    elevation: 1,
  },
  currentUserBubble: {
    backgroundColor: '#DCF8C6',
  },
  otherUserBubble: {
    backgroundColor: '#FFFFFF',
  },
  messageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 10,
    color: '#888888',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    backgroundColor: '#E0E0E0',
    color: '#666666',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    borderRadius: 20,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ChatScreen;