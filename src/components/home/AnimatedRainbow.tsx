import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
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
 * Full rainbow arc component with gradient colors.
 */
export const AnimatedRainbow: React.FC = () => {
  const rainbowOpacity = useSharedValue(0.7);
  const rainbowScale = useSharedValue(1);

  useEffect(() => {
    rainbowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.7, { duration: 2000 })
      ),
      -1,
      true
    );

    rainbowScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [rainbowOpacity, rainbowScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: rainbowOpacity.value,
    transform: [{ scale: rainbowScale.value }],
  }));

  const rainbowColors = [
    '#FF0000', '#FF7F00', '#FFFF00', '#00FF00',
    '#0000FF', '#4B0082', '#9400D3',
  ];

  const arcWidth = scale(280);
  const bandWidth = scale(15);

  return (
    <Animated.View style={[styles.rainbowContainer, animatedStyle]}>
      {rainbowColors.map((color, index) => {
        const size = arcWidth - index * bandWidth * 2;
        return (
          <View
            key={index}
            style={[
              styles.rainbowBand,
              {
                width: size,
                height: size / 2,
                borderTopLeftRadius: size / 2,
                borderTopRightRadius: size / 2,
                borderColor: color,
                borderTopWidth: bandWidth,
                borderLeftWidth: bandWidth,
                borderRightWidth: bandWidth,
                borderBottomWidth: 0,
              },
            ]}
          />
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  rainbowContainer: {
    position: 'absolute',
    top: verticalScale(80),
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: scale(280),
    height: scale(140),
    overflow: 'hidden',
  },
  rainbowBand: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
});
