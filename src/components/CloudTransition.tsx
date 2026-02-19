import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Number of cloud rows to tile vertically.
 * More rows = denser coverage = no gaps visible.
 */
const CLOUD_ROWS = 7;

/**
 * Cloud emojis cycled across rows for visual variety.
 */
const CLOUD_EMOJIS = ['☁️', '🌤️', '☁️', '⛅', '☁️', '🌥️', '☁️'];

type CloudTransitionProps = {
  /** Whether the transition is currently active */
  isActive: boolean;
  /** Called when clouds have fully covered the screen (midpoint) */
  onCovered: () => void;
  /** Called when the exit animation finishes completely */
  onFinished: () => void;
};

/**
 * FullScreen Cloud Transition Overlay.
 *
 * Two walls of clouds (left + right) slide inward to cover the screen,
 * then slide outward to reveal the new route. Runs entirely on the
 * UI thread via reanimated for zero-lag 60fps performance.
 */
export const CloudTransition: React.FC<CloudTransitionProps> = ({
  isActive,
  onCovered,
  onFinished,
}) => {
  // -1 = fully off-screen left/right, 0 = centered (covering screen)
  const leftWallX = useSharedValue(-SCREEN_WIDTH);
  const rightWallX = useSharedValue(SCREEN_WIDTH);
  // Overall opacity so component is invisible when idle
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (!isActive) return;

    // Phase 1: Slide clouds IN (cover screen)
    overlayOpacity.value = 1;
    const slideDuration = 400;

    leftWallX.value = withTiming(0, {
      duration: slideDuration,
      easing: Easing.out(Easing.quad),
    });

    rightWallX.value = withTiming(0, {
      duration: slideDuration,
      easing: Easing.out(Easing.quad),
    }, (finished) => {
      // Midpoint: screen is fully covered → trigger navigation
      if (finished) {
        runOnJS(onCovered)();

        // Phase 2: After a short pause, slide clouds OUT
        // Small delay lets the new screen mount before reveal
        leftWallX.value = withTiming(-SCREEN_WIDTH, {
          duration: slideDuration,
          easing: Easing.in(Easing.quad),
        });

        rightWallX.value = withTiming(SCREEN_WIDTH, {
          duration: slideDuration,
          easing: Easing.in(Easing.quad),
        }, (exitFinished) => {
          if (exitFinished) {
            overlayOpacity.value = 0;
            runOnJS(onFinished)();
          }
        });
      }
    });
  }, [isActive, leftWallX, onCovered, onFinished, overlayOpacity, rightWallX]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    // Use pointerEvents via zIndex trick — when invisible, it won't block touches
    zIndex: overlayOpacity.value > 0 ? 9999 : -1,
  }));

  const leftWallStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftWallX.value }],
  }));

  const rightWallStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightWallX.value }],
  }));

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="none">
      {/* Left cloud wall */}
      <Animated.View style={[styles.cloudWall, styles.leftWall, leftWallStyle]}>
        {Array.from({ length: CLOUD_ROWS }).map((_, i) => (
          <Text key={`l-${i}`} style={styles.cloudRow}>
            {CLOUD_EMOJIS[i % CLOUD_EMOJIS.length]}
            {CLOUD_EMOJIS[(i + 2) % CLOUD_EMOJIS.length]}
            {CLOUD_EMOJIS[(i + 4) % CLOUD_EMOJIS.length]}
          </Text>
        ))}
      </Animated.View>

      {/* Right cloud wall */}
      <Animated.View style={[styles.cloudWall, styles.rightWall, rightWallStyle]}>
        {Array.from({ length: CLOUD_ROWS }).map((_, i) => (
          <Text key={`r-${i}`} style={styles.cloudRow}>
            {CLOUD_EMOJIS[(i + 1) % CLOUD_EMOJIS.length]}
            {CLOUD_EMOJIS[(i + 3) % CLOUD_EMOJIS.length]}
            {CLOUD_EMOJIS[(i + 5) % CLOUD_EMOJIS.length]}
          </Text>
        ))}
      </Animated.View>

      {/* Solid sky-blue background to guarantee no gaps */}
      <View style={styles.solidBackdrop} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // Sits above everything
  },
  solidBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#B0E0E6', // Soft sky blue — matches home screen gradient
  },
  cloudWall: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.6, // Overlap ensures no gap in the middle
    justifyContent: 'space-evenly',
    alignItems: 'center',
    zIndex: 1, // Above the solid backdrop
  },
  leftWall: {
    left: 0,
  },
  rightWall: {
    right: 0,
  },
  cloudRow: {
    fontSize: 70,
    letterSpacing: -8,
  },
});
