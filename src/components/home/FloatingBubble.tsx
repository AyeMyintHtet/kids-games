import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { SCREEN_HEIGHT } from '@/utils/responsive';

/**
 * Floating translucent bubble that rises from the bottom.
 * Creates a magical, underwater-like atmosphere that children love.
 * Each bubble has a unique size, color, speed, and sway pattern.
 */
export const FloatingBubble: React.FC<{
  color: string;
  size: number;
  startX: number;
  delay: number;
  duration: number;
}> = ({ color, size, startX, delay, duration }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const bubbleOpacity = useSharedValue(0);

  useEffect(() => {
    // Float upward continuously from bottom to top
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-SCREEN_HEIGHT * 0.8, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );

    // Gentle horizontal sway — sine wave for organic motion
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(20, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(-20, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    // Fade lifecycle: appear → stay visible → fade near top
    bubbleOpacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.5, { duration: duration * 0.15 }),
          withTiming(0.4, { duration: duration * 0.6 }),
          withTiming(0, { duration: duration * 0.25 })
        ),
        -1,
        false
      )
    );
  }, [bubbleOpacity, delay, duration, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
    opacity: bubbleOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: -size,
          left: startX,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          // Glossy highlight effect
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.4)',
        },
        animatedStyle,
      ]}
    />
  );
};
