import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, IconButton, Menu } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { chatUtils } from '../../utils/chatUtils';

const ChatInput = ({ 
  onSendMessage, 
  onSendTyping, 
  onStopTyping,
  onAttachFile,
  disabled = false,
  placeholder = "Type a message...",
  maxLength = 1000
}) => {
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);
  
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup typing timeout on unmount
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTextChange = (text) => {
    setMessageText(text);
    
    // Handle typing indicators
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      if (onSendTyping) {
        onSendTyping();
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        if (onStopTyping) {
          onStopTyping();
        }
      }
    }, 2000);
  };

  const handleSendMessage = () => {
    const validation = chatUtils.validateMessage(messageText);
    
    if (!validation.isValid) {
      Alert.alert('Invalid Message', validation.error);
      return;
    }

    if (onSendMessage) {
      onSendMessage(messageText.trim());
    }

    // Clear input and stop typing
    setMessageText('');
    setInputHeight(40);
    
    if (isTyping) {
      setIsTyping(false);
      if (onStopTyping) {
        onStopTyping();
      }
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleContentSizeChange = (event) => {
    const { height } = event.nativeEvent.contentSize;
    const newHeight = Math.min(Math.max(40, height + 20), 120); // Min 40, Max 120
    setInputHeight(newHeight);
  };

  const handleAttachImage = () => {
    setMenuVisible(false);
    if (onAttachFile) {
      onAttachFile('image');
    }
  };

  const handleAttachDocument = () => {
    setMenuVisible(false);
    if (onAttachFile) {
      onAttachFile('document');
    }
  };

  const handleAttachCamera = () => {
    setMenuVisible(false);
    if (onAttachFile) {
      onAttachFile('camera');
    }
  };

  const renderAttachmentMenu = () => {
    return (
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <IconButton
            icon="attachment"
            size={24}
            onPress={() => setMenuVisible(true)}
            disabled={disabled}
          />
        }
        anchorPosition="top"
      >
        <Menu.Item
          onPress={handleAttachCamera}
          title="Camera"
          leadingIcon="camera"
        />
        <Menu.Item
          onPress={handleAttachImage}
          title="Photo"
          leadingIcon="image"
        />
        <Menu.Item
          onPress={handleAttachDocument}
          title="Document"
          leadingIcon="file-document"
        />
      </Menu>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {renderAttachmentMenu()}
        
        <TextInput
          ref={inputRef}
          value={messageText}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          style={[styles.input, { height: inputHeight }]}
          multiline
          maxLength={maxLength}
          editable={!disabled}
          onContentSizeChange={handleContentSizeChange}
          right={
            <TextInput.Icon 
              icon="emoticon-outline" 
              onPress={() => {
                // Handle emoji picker
                Alert.alert('Emoji', 'Emoji picker would open here');
              }}
            />
          }
        />
        
        <Button 
          mode="contained" 
          onPress={handleSendMessage} 
          style={[
            styles.sendButton,
            { height: Math.min(inputHeight, 56) }
          ]}
          disabled={!messageText.trim() || disabled}
          icon="send"
          compact
        >
          Send
        </Button>
      </View>
      
      {messageText.length > 0 && (
        <View style={styles.characterCount}>
          <Icon 
            name={messageText.length > maxLength * 0.9 ? "alert" : "information"} 
            size={12} 
            color={messageText.length > maxLength * 0.9 ? "#FF3B30" : "#666666"} 
          />
          <Text style={[
            styles.characterCountText,
            messageText.length > maxLength * 0.9 && styles.characterCountWarning
          ]}>
            {messageText.length}/{maxLength}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginHorizontal: 8,
    minHeight: 40,
    maxHeight: 120,
  },
  sendButton: {
    borderRadius: 20,
    justifyContent: 'center',
    minWidth: 80,
  },
  characterCount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    marginRight: 16,
  },
  characterCountText: {
    fontSize: 10,
    color: '#666666',
    marginLeft: 2,
  },
  characterCountWarning: {
    color: '#FF3B30',
  },
});

export default ChatInput;