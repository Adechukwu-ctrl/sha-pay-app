import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Surface, Menu, Divider } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import MessageStatus from './MessageStatus';
import { chatUtils } from '../../utils/chatUtils';

const MessageBubble = ({ 
  message, 
  isCurrentUser, 
  showSenderName = false,
  onRetry,
  onDelete,
  onEdit,
  onReply
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleLongPress = () => {
    if (isCurrentUser || message.status === 'failed') {
      setMenuVisible(true);
    }
  };

  const handleRetry = () => {
    setMenuVisible(false);
    if (onRetry) {
      onRetry(message.id);
    }
  };

  const handleDelete = () => {
    setMenuVisible(false);
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => onDelete && onDelete(message.id) 
        }
      ]
    );
  };

  const handleEdit = () => {
    setMenuVisible(false);
    if (onEdit) {
      onEdit(message.id, message.content);
    }
  };

  const handleReply = () => {
    setMenuVisible(false);
    if (onReply) {
      onReply(message);
    }
  };

  const formatTime = (timestamp) => {
    return chatUtils.formatMessageTime(timestamp);
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText
          ]}>
            {message.content}
          </Text>
        );
      case 'image':
        return (
          <View>
            {/* Image component would go here */}
            <Text style={styles.placeholderText}>📷 Image</Text>
          </View>
        );
      case 'file':
        return (
          <View style={styles.fileContainer}>
            <Icon name="file-document-outline" size={20} color="#666666" />
            <Text style={styles.fileName}>{message.fileName || 'File'}</Text>
          </View>
        );
      default:
        return (
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText
          ]}>
            {message.content}
          </Text>
        );
    }
  };

  const renderMenu = () => {
    const menuItems = [];

    if (message.status === 'failed' && isCurrentUser) {
      menuItems.push(
        <Menu.Item
          key="retry"
          onPress={handleRetry}
          title="Retry"
          leadingIcon="refresh"
        />
      );
    }

    if (isCurrentUser && message.status !== 'failed') {
      menuItems.push(
        <Menu.Item
          key="edit"
          onPress={handleEdit}
          title="Edit"
          leadingIcon="pencil"
        />
      );
    }

    menuItems.push(
      <Menu.Item
        key="reply"
        onPress={handleReply}
        title="Reply"
        leadingIcon="reply"
      />
    );

    if (isCurrentUser) {
      if (menuItems.length > 0) {
        menuItems.push(<Divider key="divider" />);
      }
      menuItems.push(
        <Menu.Item
          key="delete"
          onPress={handleDelete}
          title="Delete"
          leadingIcon="delete"
          titleStyle={{ color: '#FF3B30' }}
        />
      );
    }

    return menuItems;
  };

  return (
    <View style={[
      styles.messageContainer,
      isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
    ]}>
      {showSenderName && !isCurrentUser && (
        <Text style={styles.senderName}>{message.senderName}</Text>
      )}
      
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <TouchableOpacity
            onLongPress={handleLongPress}
            activeOpacity={0.8}
          >
            <Surface style={[
              styles.messageBubble,
              isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
              message.status === 'failed' && styles.failedMessage
            ]}>
              {renderMessageContent()}
              
              <View style={styles.messageFooter}>
                <Text style={[
                  styles.messageTime,
                  isCurrentUser ? styles.currentUserTime : styles.otherUserTime
                ]}>
                  {formatTime(message.timestamp)}
                </Text>
                
                {message.edited && (
                  <Text style={styles.editedText}>edited</Text>
                )}
                
                <MessageStatus 
                  status={message.status}
                  timestamp={message.timestamp}
                  isCurrentUser={isCurrentUser}
                />
              </View>
            </Surface>
          </TouchableOpacity>
        }
      >
        {renderMenu()}
      </Menu>
      
      {message.status === 'failed' && (
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={handleRetry}
        >
          <Icon name="refresh" size={16} color="#FF3B30" />
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 2,
    maxWidth: '80%',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
    marginLeft: 12,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    elevation: 1,
    minWidth: 60,
  },
  currentUserBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  failedMessage: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#000000',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
    marginRight: 4,
  },
  currentUserTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherUserTime: {
    color: '#888888',
  },
  editedText: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#888888',
    marginRight: 4,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  retryText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 4,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
  },
  fileName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333333',
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 8,
  },
});

export default MessageBubble;