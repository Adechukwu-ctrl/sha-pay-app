import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Surface, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import websocketService from '../../services/websocketService';
import { chatUtils } from '../../utils/chatUtils';
import { createConversation } from '../../store/slices/chatSlice';

/**
 * ChatIntegration component provides a quick way to start conversations
 * from other parts of the app (e.g., job details, user profiles)
 */
const ChatIntegration = ({ 
  recipientId, 
  recipientName, 
  jobId = null, 
  onConversationCreated = null,
  style = {} 
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { conversations, loading } = useSelector(state => state.chat);
  
  const [isConnected, setIsConnected] = useState(false);
  const [existingConversation, setExistingConversation] = useState(null);

  useEffect(() => {
    // Check if conversation already exists
    const existing = conversations.find(conv => 
      conv.participants.some(p => p.id === recipientId)
    );
    setExistingConversation(existing);
  }, [conversations, recipientId]);

  useEffect(() => {
    // Monitor WebSocket connection status
    const handleConnection = () => setIsConnected(true);
    const handleDisconnection = () => setIsConnected(false);

    websocketService.on('connected', handleConnection);
    websocketService.on('disconnected', handleDisconnection);

    return () => {
      websocketService.off('connected', handleConnection);
      websocketService.off('disconnected', handleDisconnection);
    };
  }, []);

  const handleStartChat = async () => {
    if (!user?.id || !recipientId) {
      Alert.alert('Error', 'Unable to start chat. Please try again.');
      return;
    }

    if (existingConversation) {
      // Navigate to existing conversation
      if (onConversationCreated) {
        onConversationCreated(existingConversation);
      }
      return;
    }

    try {
      const conversationData = {
        participants: [
          { id: user.id, name: user.name || user.fullName },
          { id: recipientId, name: recipientName }
        ],
        jobId,
        type: jobId ? 'job_related' : 'general'
      };

      const result = await dispatch(createConversation(conversationData)).unwrap();
      
      if (onConversationCreated) {
        onConversationCreated(result);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    }
  };

  const getButtonText = () => {
    if (loading) return 'Starting...';
    if (existingConversation) return 'Continue Chat';
    return 'Start Chat';
  };

  const getStatusText = () => {
    if (!isConnected) return 'Connecting to chat...';
    if (existingConversation) {
      const unreadCount = chatUtils.getUnreadCount(existingConversation.messages, user.id);
      if (unreadCount > 0) {
        return `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`;
      }
      const lastMessage = existingConversation.lastMessage;
      if (lastMessage) {
        return `Last: ${chatUtils.formatMessageTime(lastMessage.timestamp)}`;
      }
    }
    return `Chat with ${recipientName}`;
  };

  return (
    <Surface style={[styles.container, style]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Chat</Text>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }
            ]} />
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>
        
        <Button
          mode="contained"
          onPress={handleStartChat}
          disabled={loading || !isConnected}
          style={styles.chatButton}
          icon={existingConversation ? 'chat' : 'chat-plus'}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            getButtonText()
          )}
        </Button>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 8,
    elevation: 2,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666666',
  },
  chatButton: {
    borderRadius: 6,
  },
});

export default ChatIntegration;