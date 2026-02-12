import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { scale } from '@/utils/responsive';

/**
 * Twinkling sparkle that fades in/out at a fixed position.
 * Adds magical "pixie dust" atmosphere to the scene.
 */
export const TwinklingSparkle: React.FC<{
  x: number;
  y: number;
  delay: number;
  emoji?: string;
}> = ({ x, y, delay, emoji = '✨' }) => {
  const sparkleOpacity = useSharedValue(0);
  const sparkleScale = useSharedValue(0.5);

  useEffect(() => {
    // Twinkle pattern: flash on → fade off → pause → repeat
    sparkleOpacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 }),
          withTiming(0, { duration: 800 }) // Pause between twinkles
        ),
        -1,
        false
      )
    );

    sparkleScale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.3, { duration: 400 }),
          withTiming(0.5, { duration: 400 }),
          withTiming(0.5, { duration: 800 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
    transform: [{ scale: sparkleScale.value }],
  }));

  return (
    <Animated.Text
      style={[
        { position: 'absolute', left: x, top: y, fontSize: scale(18), zIndex: 3 },
        animatedStyle,
      ]}
    >
      {emoji}
    </Animated.Text>
  );
};
