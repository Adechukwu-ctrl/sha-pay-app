import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import {
  ChatHeader,
  ChatInput,
  ThemedText,
  LoadingSpinner,
} from '../components/ui';
import { TypingIndicator, MessageBubble } from '../components/chat';
import { colors, spacing } from '../theme';
import {
  fetchMessages,
  sendMessage,
  markMessagesAsRead,
  selectConversationMessages,
  selectConversationById,
} from '../store/slices/chatSlice';
import { selectUser } from '../store/slices/authSlice';
import { websocketService } from '../services/websocketService';

const ChatScreen = ({ route, navigation }) => {
  const { conversationId, participant } = route.params;
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const messages = useSelector((state) => selectConversationMessages(state, conversationId));
  const conversation = useSelector((state) => selectConversationById(state, conversationId));
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  useEffect(() => {
    loadMessages();
    setupWebSocketListeners();
    
    return () => {
      cleanupWebSocketListeners();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId]);
  
  useEffect(() => {
    // Mark messages as read when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      markAsRead();
    });
    
    return unsubscribe;
  }, [navigation]);
  
  const loadMessages = async () => {
    try {
      setLoading(true);
      await dispatch(fetchMessages(conversationId)).unwrap();
      markAsRead();
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };
  
  const markAsRead = () => {
    if (messages && messages.length > 0) {
      const unreadMessages = messages.filter(
        (msg) => !msg.isRead && msg.senderId !== user.id
      );
      
      if (unreadMessages.length > 0) {
        dispatch(markMessagesAsRead({
          conversationId,
          messageIds: unreadMessages.map(msg => msg.id),
        }));
      }
    }
  };
  
  const setupWebSocketListeners = () => {
    // Listen for new messages
    websocketService.on('message_received', handleMessageReceived);
    
    // Listen for typing indicators
    websocketService.on('user_typing', handleUserTyping);
    websocketService.on('user_stopped_typing', handleUserStoppedTyping);
    
    // Listen for message status updates
    websocketService.on('message_status_updated', handleMessageStatusUpdate);
    
    // Join conversation room
    websocketService.emit('join_conversation', { conversationId });
  };
  
  const cleanupWebSocketListeners = () => {
    websocketService.off('message_received', handleMessageReceived);
    websocketService.off('user_typing', handleUserTyping);
    websocketService.off('user_stopped_typing', handleUserStoppedTyping);
    websocketService.off('message_status_updated', handleMessageStatusUpdate);
    
    // Leave conversation room
    websocketService.emit('leave_conversation', { conversationId });
  };
  
  const handleMessageReceived = (message) => {
    if (message.conversationId === conversationId) {
      // Message will be added to store via WebSocket listener in chatSlice
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      // Mark as read if screen is focused
      if (message.senderId !== user.id) {
        dispatch(markMessagesAsRead({
          conversationId,
          messageIds: [message.id],
        }));
      }
    }
  };
  
  const handleUserTyping = ({ userId, conversationId: msgConversationId }) => {
    if (msgConversationId === conversationId && userId !== user.id) {
      setTypingUsers(prev => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });
    }
  };
  
  const handleUserStoppedTyping = ({ userId, conversationId: msgConversationId }) => {
    if (msgConversationId === conversationId) {
      setTypingUsers(prev => prev.filter(id => id !== userId));
    }
  };
  
  const handleMessageStatusUpdate = ({ messageId, status }) => {
    // Message status will be updated in store via WebSocket listener in chatSlice
  };
  
  const handleSendMessage = async (messageData) => {
    try {
      setSending(true);
      
      const messagePayload = {
        conversationId,
        senderId: user.id,
        recipientId: participant.id,
        content: messageData.text,
        type: messageData.type || 'text',
        attachments: messageData.attachments || [],
      };
      
      await dispatch(sendMessage(messagePayload)).unwrap();
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };
  
  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      websocketService.emit('typing_start', {
        conversationId,
        userId: user.id,
      });
    }
    
    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000); // Stop typing after 3 seconds of inactivity
  };
  
  const handleTypingStop = () => {
    if (isTyping) {
      setIsTyping(false);
      websocketService.emit('typing_stop', {
        conversationId,
        userId: user.id,
      });
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };
  
  const handleBackPress = () => {
    navigation.goBack();
  };
  
  const handleCallPress = () => {
    // Implement voice call functionality
    Alert.alert('Voice Call', 'Voice call functionality will be implemented');
  };
  
  const handleVideoPress = () => {
    // Implement video call functionality
    Alert.alert('Video Call', 'Video call functionality will be implemented');
  };
  
  const handleInfoPress = () => {
    navigation.navigate('ChatInfo', {
      conversationId,
      participant,
    });
  };
  
  const renderMessage = ({ item: message, index }) => {
    const isOwnMessage = message.senderId === user.id;
    const showAvatar = !isOwnMessage && (
      index === messages.length - 1 ||
      messages[index + 1]?.senderId !== message.senderId
    );
    const showTimestamp = (
      index === messages.length - 1 ||
      messages[index + 1]?.senderId !== message.senderId ||
      (new Date(messages[index + 1]?.createdAt) - new Date(message.createdAt)) > 300000 // 5 minutes
    );
    
    return (
      <MessageBubble
        message={message}
        isOwnMessage={isOwnMessage}
        showAvatar={showAvatar}
        showTimestamp={showTimestamp}
        participant={participant}
        onPress={() => {
          // Handle message press (e.g., show message options)
        }}
        onLongPress={() => {
          // Handle message long press (e.g., show message actions)
          Alert.alert(
            'Message Options',
            'Choose an action',
            [
              { text: 'Copy', onPress: () => console.log('Copy message') },
              { text: 'Delete', onPress: () => console.log('Delete message') },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }}
      />
    );
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <ThemedText variant="h6" style={{ textAlign: 'center', marginBottom: spacing[2] }}>
        Start the conversation
      </ThemedText>
      <ThemedText variant="body2" style={{ textAlign: 'center', color: colors.text.secondary }}>
        Send a message to {participant?.name}
      </ThemedText>
    </View>
  );
  
  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    return (
      <TypingIndicator
        users={typingUsers.map(userId => ({ id: userId, name: participant?.name }))}
        style={styles.typingIndicator}
      />
    );
  };
  
  if (loading) {
    return (
      <View style={styles.container}>
        <ChatHeader
          participant={participant}
          onBackPress={handleBackPress}
        />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
        </View>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ChatHeader
        participant={participant}
        onBackPress={handleBackPress}
        onCallPress={handleCallPress}
        onVideoPress={handleVideoPress}
        onInfoPress={handleInfoPress}
      />
      
      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={{
            paddingVertical: spacing[3],
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            // Auto-scroll to bottom when new messages arrive
            if (messages && messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
          ListEmptyComponent={renderEmptyState}
          inverted={false}
        />
        
        {renderTypingIndicator()}
      </View>
      
      <ChatInput
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        disabled={sending}
        placeholder={`Message ${participant?.name}...`}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: spacing[3],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  typingIndicator: {
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[2],
  },
});

export default ChatScreen;