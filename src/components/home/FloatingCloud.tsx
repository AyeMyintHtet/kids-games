import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { scale, SCREEN_WIDTH } from '@/utils/responsive';

/**
 * Floating cloud component for background decoration.
 */
export const FloatingCloud: React.FC<{ delay: number; startX: number; top: number }> = ({
  delay,
  startX,
  top,
}) => {
  const translateX = useSharedValue(startX);

  useEffect(() => {
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(SCREEN_WIDTH + 100, { duration: 15000, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.Text style={[styles.cloud, { top }, animatedStyle]}>☁️</Animated.Text>
  );
};

const styles = StyleSheet.create({
  cloud: {
    position: 'absolute',
    fontSize: scale(50),
    opacity: 0.9,
  },
});
