import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

/**
 * Colorful bouncing ball component for the loading animation.
 */
interface BouncingBallProps {
  color: string;
  delay: number;
  size: number;
  startX: number;
}

const BouncingBall: React.FC<BouncingBallProps> = ({ color, delay, size, startX }) => {
  const translateY = useSharedValue(0);
  const squash = useSharedValue(1);

  useEffect(() => {
    // Start bouncing animation after delay
    const startAnimation = () => {
      // Bouncing: up and down
      translateY.value = withRepeat(
        withSequence(
          withTiming(-80, { duration: 400, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      );

      // Squash effect: compress at bottom, stretch at top
      squash.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 400 }), // Stretch going up
          withTiming(0.85, { duration: 400 })  // Squash at bottom
        ),
        -1,
        false
      );
    };

    // Delay start using setTimeout to avoid dependency issues
    const timer = setTimeout(startAnimation, delay);
    return () => clearTimeout(timer);
  }, []);

  // Keep animation calculations simple for native thread performance
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scaleY: squash.value },
      { scaleX: 2 - squash.value }, // Inverse: squash horizontally when stretching vertically
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.ball,
        animatedStyle,
        {
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: size / 2,
          left: startX,
        },
      ]}
    />
  );
};

/**
 * Floating star component for magical effect.
 */
interface FloatingStarProps {
  delay: number;
  startX: number;
  startY: number;
}

const FloatingStar: React.FC<FloatingStarProps> = ({ delay, startX, startY }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0, { duration: 600 })
        ),
        -1,
        false
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600 }),
          withTiming(0.5, { duration: 600 })
        ),
        -1,
        false
      )
    );

    rotate.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.Text
      style={[
        styles.star,
        animatedStyle,
        { left: startX, top: startY },
      ]}
    >
      ⭐
    </Animated.Text>
  );
};

/**
 * Animated loading text with wave effect.
 */
const LoadingText: React.FC = () => {
  const letters = ['L', 'o', 'a', 'd', 'i', 'n', 'g', '.', '.', '.'];

  return (
    <View style={styles.loadingTextContainer}>
      {letters.map((letter, index) => (
        <AnimatedLetter key={index} letter={letter} index={index} />
      ))}
    </View>
  );
};

interface AnimatedLetterProps {
  letter: string;
  index: number;
}

const AnimatedLetter: React.FC<AnimatedLetterProps> = ({ letter, index }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      index * 100,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 300, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Cycle through rainbow colors
  const colors = [
    Colors.primary[500],
    Colors.secondary[500],
    Colors.accent[500],
    Colors.success,
    Colors.warning,
  ];

  return (
    <Animated.Text
      style={[
        styles.loadingLetter,
        animatedStyle,
        { color: colors[index % colors.length] },
      ]}
    >
      {letter}
    </Animated.Text>
  );
};

/**
 * Attractive Splash Screen for Kids
 * Features colorful bouncing balls, floating stars, and animated text.
 */
export const SplashScreen: React.FC = () => {
  const bgRotate = useSharedValue(0);

  useEffect(() => {
    // Subtle background rotation for dynamic feel
    bgRotate.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const bgAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${bgRotate.value}deg` }],
  }));

  // Ball configurations
  const balls = [
    { color: Colors.primary[500], delay: 0, size: 50, startX: width * 0.2 },
    { color: Colors.secondary[500], delay: 150, size: 40, startX: width * 0.4 },
    { color: Colors.accent[500], delay: 300, size: 55, startX: width * 0.6 },
    { color: Colors.success, delay: 450, size: 35, startX: width * 0.8 },
  ];

  // Star configurations
  const stars = [
    { delay: 0, startX: width * 0.1, startY: 100 },
    { delay: 400, startX: width * 0.85, startY: 150 },
    { delay: 800, startX: width * 0.15, startY: 250 },
    { delay: 1200, startX: width * 0.75, startY: 300 },
    { delay: 600, startX: width * 0.5, startY: 80 },
    { delay: 1000, startX: width * 0.3, startY: 350 },
  ];

  return (
    <View style={styles.container}>
      {/* Animated background gradient circle */}
      <Animated.View style={[styles.bgCircle, bgAnimatedStyle]} />

      {/* Floating stars */}
      {stars.map((star, index) => (
        <FloatingStar
          key={index}
          delay={star.delay}
          startX={star.startX}
          startY={star.startY}
        />
      ))}

      {/* App title */}
      <View style={styles.titleContainer}>
        <Text style={styles.emoji}>🎮</Text>
        <Text style={styles.title}>Learny Land</Text>
        <Text style={styles.subtitle}>Fun Learning Adventures!</Text>
      </View>

      {/* Bouncing balls */}
      <View style={styles.ballsContainer}>
        {balls.map((ball, index) => (
          <BouncingBall
            key={index}
            color={ball.color}
            delay={ball.delay}
            size={ball.size}
            startX={ball.startX - ball.size / 2}
          />
        ))}
      </View>

      {/* Loading text */}
      <LoadingText />

      {/* Fun decorative emojis */}
      <View style={styles.emojiRow}>
        <Text style={styles.decorEmoji}>🌈</Text>
        <Text style={styles.decorEmoji}>🎨</Text>
        <Text style={styles.decorEmoji}>📚</Text>
        <Text style={styles.decorEmoji}>🎵</Text>
        <Text style={styles.decorEmoji}>🚀</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9E6', // Warm cream background
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute',
    width: width * 2,
    height: width * 2,
    borderRadius: width,
    backgroundColor: 'transparent',
    borderWidth: 60,
    borderColor: 'rgba(255, 200, 100, 0.15)',
    top: -width * 0.5,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.primary[600],
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.secondary[600],
    marginTop: 8,
    fontWeight: '600',
  },
  ballsContainer: {
    height: 120,
    width: '100%',
    position: 'relative',
    marginBottom: 40,
  },
  ball: {
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  star: {
    position: 'absolute',
    fontSize: 24,
  },
  loadingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  loadingLetter: {
    fontSize: 28,
    fontWeight: '700',
    marginHorizontal: 2,
  },
  emojiRow: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 60,
    gap: 20,
  },
  decorEmoji: {
    fontSize: 32,
  },
});

export default SplashScreen;
