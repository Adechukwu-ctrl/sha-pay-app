import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, borderRadius } from '../../theme';

const ChatInput = ({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  placeholder = 'Type a message...',
  disabled = false,
  style,
}) => {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleTextChange = (text) => {
    setMessage(text);
    
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      onTypingStart?.();
    } else if (text.length === 0 && isTyping) {
      setIsTyping(false);
      onTypingStop?.();
    }
  };

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage?.(message.trim());
      setMessage('');
      setIsTyping(false);
      onTypingStop?.();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      backgroundColor: colors.background.paper,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      ...style,
    },
    inputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.surface,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
      marginRight: spacing[2],
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text.primary,
      maxHeight: 100,
    },
    sendButton: {
      backgroundColor: colors.primary.main,
      borderRadius: borderRadius.lg,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: colors.text.disabled,
    },
    typingIndicator: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[1],
    },
    typingText: {
      fontStyle: 'italic',
      color: colors.text.secondary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          editable={!disabled}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
      </View>
      <TouchableOpacity
        style={[
          styles.sendButton,
          { backgroundColor: message.trim() ? colors.primary.main : colors.text.disabled },
        ]}
        onPress={handleSend}
        disabled={!message.trim() || disabled}
        activeOpacity={0.7}
      >
        <Icon
          name="send"
          size={20}
          color={colors.background.paper}
        />
      </TouchableOpacity>
    </View>
  );
};

export default ChatInput;