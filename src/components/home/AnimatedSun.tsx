import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { scale, verticalScale } from '@/utils/responsive';

/**
 * Animated sun with pulsing glow and slow rotation.
 * Positioned in the sky area for a warm, cheerful atmosphere.
 */
export const AnimatedSun: React.FC = () => {
  const sunRotate = useSharedValue(0);
  const sunScale = useSharedValue(1);

  useEffect(() => {
    // Slow rotation for dynamic feel
    sunRotate.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );

    // Breathing pulse — sun grows/shrinks subtly
    sunScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${sunRotate.value}deg` },
      { scale: sunScale.value },
    ],
  }));

  return (
    <Animated.Text
      style={[
        {
          position: 'absolute',
          top: verticalScale(35),
          right: scale(50),
          fontSize: scale(55),
          zIndex: 5,
        },
        animatedStyle,
      ]}
    >
      ☀️
    </Animated.Text>
  );
};
