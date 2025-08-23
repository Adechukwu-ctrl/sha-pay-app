import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Surface } from 'react-native-paper';

const TypingIndicator = ({ typingUsers = [], visible = false }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && typingUsers.length > 0) {
      // Fade in the typing indicator
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Start the dot animation
      startDotAnimation();
    } else {
      // Fade out the typing indicator
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, typingUsers]);

  const startDotAnimation = () => {
    const animateDot = (dotAnim, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Start animations with staggered delays
    Animated.parallel([
      animateDot(dot1Anim, 0),
      animateDot(dot2Anim, 200),
      animateDot(dot3Anim, 400),
    ]).start();
  };

  const getTypingText = () => {
    if (typingUsers.length === 0) return '';
    
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing`;
    } else {
      return `${typingUsers.length} people are typing`;
    }
  };

  if (!visible || typingUsers.length === 0) {
    return null;
  }

  return (
    <Animated.View 
      style={[styles.container, { opacity: fadeAnim }]}
    >
      <Surface style={styles.bubble}>
        <View style={styles.content}>
          <Text style={styles.typingText}>{getTypingText()}</Text>
          <View style={styles.dotsContainer}>
            <Animated.View 
              style={[
                styles.dot, 
                {
                  opacity: dot1Anim,
                  transform: [{
                    scale: dot1Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.2],
                    })
                  }]
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.dot, 
                {
                  opacity: dot2Anim,
                  transform: [{
                    scale: dot2Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.2],
                    })
                  }]
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.dot, 
                {
                  opacity: dot3Anim,
                  transform: [{
                    scale: dot3Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.2],
                    })
                  }]
                }
              ]} 
            />
          </View>
        </View>
      </Surface>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    marginVertical: 4,
    marginHorizontal: 16,
    maxWidth: '80%',
  },
  bubble: {
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    marginRight: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#999999',
    marginHorizontal: 1,
  },
});

export default TypingIndicator;