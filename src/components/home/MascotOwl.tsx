import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { scale } from '@/utils/responsive';

/**
 * Animated mascot owl component.
 */
export const MascotOwl: React.FC = () => {
  const bounce = useSharedValue(0);

  useEffect(() => {
    // Gentle bouncing
    bounce.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [bounce]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  return (
    <Animated.View style={[styles.mascotContainer, animatedStyle]}>
      <Text style={styles.mascot}>🦉</Text>
      <View style={styles.graduationCap}>
        <Text style={styles.capEmoji}>🎓</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  mascotContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  mascot: {
    fontSize: scale(100),
  },
  graduationCap: {
    position: 'absolute',
    top: -scale(15),
    left: scale(25),
  },
  capEmoji: {
    fontSize: scale(40),
    transform: [{ rotate: '-15deg' }],
  },
});
