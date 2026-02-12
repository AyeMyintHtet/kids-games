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
import { scale } from '@/utils/responsive';

/**
 * Dancing butterfly that flutters along a figure-8 path.
 * Adds life and movement to the nature scene.
 */
export const DancingButterfly: React.FC<{
  startX: number;
  startY: number;
  delay: number;
}> = ({ startX, startY, delay }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Horizontal sweep — wider range for visible movement
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(40, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(-40, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    // Vertical bob — offset from horizontal for figure-8 illusion
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
          withTiming(20, { duration: 1500, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.Text
      style={[
        {
          position: 'absolute',
          left: startX,
          top: startY,
          fontSize: scale(28),
          zIndex: 4,
        },
        animatedStyle,
      ]}
    >
      🦋
    </Animated.Text>
  );
};
