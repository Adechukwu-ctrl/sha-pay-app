import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { chatUtils } from '../../utils/chatUtils';

const MessageStatus = ({ status, timestamp, isCurrentUser = false }) => {
  if (!isCurrentUser) {
    return null; // Only show status for current user's messages
  }

  const getStatusIcon = () => {
    return chatUtils.getMessageStatusIcon(status);
  };

  const getStatusColor = () => {
    return chatUtils.getMessageStatusColor(status);
  };

  const renderStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <Icon 
            name="clock-outline" 
            size={12} 
            color="#999999" 
            style={styles.icon}
          />
        );
      case 'sent':
        return (
          <Icon 
            name="check" 
            size={12} 
            color="#999999" 
            style={styles.icon}
          />
        );
      case 'delivered':
        return (
          <Icon 
            name="check-all" 
            size={12} 
            color="#007AFF" 
            style={styles.icon}
          />
        );
      case 'read':
        return (
          <Icon 
            name="check-all" 
            size={12} 
            color="#007AFF" 
            style={[styles.icon, styles.readIcon]}
          />
        );
      case 'failed':
        return (
          <Icon 
            name="alert-circle-outline" 
            size={12} 
            color="#FF3B30" 
            style={styles.icon}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderStatusIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  icon: {
    marginLeft: 2,
  },
  readIcon: {
    // Additional styling for read status if needed
  },
});

export default MessageStatus;