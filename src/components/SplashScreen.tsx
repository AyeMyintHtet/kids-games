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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ───────────────────────────────────────────────────────────────────────────────
// Confetti Piece — colored shape that "rains" down from top, swaying side to side
// ───────────────────────────────────────────────────────────────────────────────

interface ConfettiPieceProps {
  color: string;
  startX: number;
  size: number;
  delay: number;
  duration: number;
}

/**
 * A single confetti piece that falls from the top of the screen.
 * Sways horizontally and rotates as it falls for a festive, magical feel.
 */
const ConfettiPiece: React.FC<ConfettiPieceProps> = ({
  color,
  startX,
  size,
  delay,
  duration,
}) => {
  const translateY = useSharedValue(-size);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Fall from top to bottom
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(SCREEN_HEIGHT + size, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );

    // Gentle horizontal sway for natural "floating" motion
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(25, { duration: duration * 0.25, easing: Easing.inOut(Easing.sin) }),
          withTiming(-25, { duration: duration * 0.25, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    // Continuous rotation for tumbling effect
    rotate.value = withRepeat(
      withTiming(360, { duration: 2000 + Math.random() * 1000, easing: Easing.linear }),
      -1,
      false
    );

    // Fade lifecycle: appear quickly, stay visible, fade at bottom
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: duration * 0.1 }),
          withTiming(0.8, { duration: duration * 0.7 }),
          withTiming(0, { duration: duration * 0.2 })
        ),
        -1,
        false
      )
    );
  }, [delay, duration, opacity, rotate, size, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: -size,
          width: size,
          height: size,
          // Mix of circles and rounded squares for visual variety
          borderRadius: size * (Math.random() > 0.5 ? 0.5 : 0.2),
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

// ───────────────────────────────────────────────────────────────────────────────
// Pulsing Ring — expanding/fading ring from center for magical aura effect
// ───────────────────────────────────────────────────────────────────────────────

interface PulsingRingProps {
  delay: number;
  color: string;
  maxScale: number;
}

/**
 * Creates an expanding ring that fades as it grows,
 * producing a "magical aura" emanating from the center.
 */
const PulsingRing: React.FC<PulsingRingProps> = ({ delay, color, maxScale }) => {
  const ringScale = useSharedValue(0.3);
  const ringOpacity = useSharedValue(0.6);

  useEffect(() => {
    ringScale.value = withDelay(
      delay,
      withRepeat(
        withTiming(maxScale, { duration: 3000, easing: Easing.out(Easing.quad) }),
        -1,
        false
      )
    );
    ringOpacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0, { duration: 3000, easing: Easing.out(Easing.quad) }),
        -1,
        false
      )
    );
  }, [delay, maxScale, ringOpacity, ringScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: 100,
          borderWidth: 3,
          borderColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

// ───────────────────────────────────────────────────────────────────────────────
// Bouncing Ball (enhanced with glow shadow)
// ───────────────────────────────────────────────────────────────────────────────

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
    const startAnimation = () => {
      // Bouncing: up and down with quad easing for gravity feel
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
          withTiming(1.15, { duration: 400 }),
          withTiming(0.85, { duration: 400 })
        ),
        -1,
        false
      );
    };

    const timer = setTimeout(startAnimation, delay);
    return () => clearTimeout(timer);
  }, [delay, squash, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scaleY: squash.value },
      { scaleX: 2 - squash.value },
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

// ───────────────────────────────────────────────────────────────────────────────
// Floating Star (enhanced with sparkle)
// ───────────────────────────────────────────────────────────────────────────────

interface FloatingStarProps {
  delay: number;
  startX: number;
  startY: number;
  emoji?: string;
}

const FloatingStar: React.FC<FloatingStarProps> = ({
  delay,
  startX,
  startY,
  emoji = '⭐',
}) => {
  const starOpacity = useSharedValue(0);
  const starScale = useSharedValue(0);
  const starRotate = useSharedValue(0);

  useEffect(() => {
    starOpacity.value = withDelay(
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

    starScale.value = withDelay(
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

    starRotate.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, [delay, starOpacity, starRotate, starScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: starOpacity.value,
    transform: [
      { scale: starScale.value },
      { rotate: `${starRotate.value}deg` },
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
      {emoji}
    </Animated.Text>
  );
};

// ───────────────────────────────────────────────────────────────────────────────
// Animated Loading Text with rainbow wave
// ───────────────────────────────────────────────────────────────────────────────

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
  const letterScale = useSharedValue(1);

  useEffect(() => {
    // Wave bounce effect — each letter bounces with a staggered delay
    translateY.value = withDelay(
      index * 100,
      withRepeat(
        withSequence(
          withTiming(-12, { duration: 300, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      )
    );

    // Subtle scale pulse synchronized with bounce
    letterScale.value = withDelay(
      index * 100,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        -1,
        false
      )
    );
  }, [index, letterScale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: letterScale.value },
    ],
  }));

  // Candy rainbow color cycle
  const colors = [
    Colors.candy.pink,
    Colors.candy.bubblegum,
    Colors.secondary[500],
    Colors.candy.lavender,
    Colors.candy.mint,
    Colors.primary[500],
    Colors.candy.lemon,
    Colors.accent[500],
    Colors.candy.peach,
    Colors.danger[500],
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

// ───────────────────────────────────────────────────────────────────────────────
// Main SplashScreen Component
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Attractive Splash Screen for Kids.
 *
 * Features:
 * - Confetti rain with candy colors
 * - Pulsing magical aura rings
 * - Bouncing balls with squash & stretch
 * - Floating stars and sparkles
 * - Rainbow wave loading text
 * - Warm, inviting background
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
  }, [bgRotate]);

  const bgAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${bgRotate.value}deg` }],
  }));

  // Ball configurations — using candy colors for vibrancy
  const balls = [
    { color: Colors.candy.pink, delay: 0, size: 50, startX: SCREEN_WIDTH * 0.2 },
    { color: Colors.candy.skyBlue, delay: 150, size: 40, startX: SCREEN_WIDTH * 0.4 },
    { color: Colors.candy.lemon, delay: 300, size: 55, startX: SCREEN_WIDTH * 0.6 },
    { color: Colors.candy.mint, delay: 450, size: 35, startX: SCREEN_WIDTH * 0.8 },
  ];

  // Star configurations — scattered across screen for magical atmosphere
  const stars: FloatingStarProps[] = [
    { delay: 0, startX: SCREEN_WIDTH * 0.1, startY: 100, emoji: '⭐' },
    { delay: 400, startX: SCREEN_WIDTH * 0.85, startY: 150, emoji: '✨' },
    { delay: 800, startX: SCREEN_WIDTH * 0.15, startY: 250, emoji: '💫' },
    { delay: 1200, startX: SCREEN_WIDTH * 0.75, startY: 300, emoji: '⭐' },
    { delay: 600, startX: SCREEN_WIDTH * 0.5, startY: 80, emoji: '✨' },
    { delay: 1000, startX: SCREEN_WIDTH * 0.3, startY: 350, emoji: '🌟' },
    { delay: 200, startX: SCREEN_WIDTH * 0.65, startY: 400, emoji: '💫' },
    { delay: 1400, startX: SCREEN_WIDTH * 0.9, startY: 450, emoji: '✨' },
  ];

  // Confetti configurations — 12 pieces raining candy colors
  const confettiColors = [
    Colors.candy.pink, Colors.candy.bubblegum, Colors.candy.mint,
    Colors.candy.lavender, Colors.candy.peach, Colors.candy.lemon,
    Colors.candy.skyBlue, Colors.candy.lilac, Colors.candy.coral,
    Colors.candy.seafoam, Colors.candy.pink, Colors.candy.lemon,
  ];

  const confetti = confettiColors.map((color, i) => ({
    color,
    startX: (SCREEN_WIDTH / confettiColors.length) * i + Math.random() * 20,
    size: 8 + Math.random() * 8, // 8-16pt pieces
    delay: i * 300,
    duration: 3000 + Math.random() * 2000, // 3-5s fall time
  }));

  return (
    <View style={styles.container}>
      {/* Animated background gradient circle — slow rotation for dynamic feel */}
      <Animated.View style={[styles.bgCircle, bgAnimatedStyle]} />

      {/* Pulsing magical aura rings emanating from center */}
      <PulsingRing delay={0} color={Colors.candy.pink} maxScale={2.5} />
      <PulsingRing delay={1000} color={Colors.candy.lavender} maxScale={3.0} />
      <PulsingRing delay={2000} color={Colors.candy.mint} maxScale={2.0} />

      {/* Confetti rain ☔🎉 */}
      {confetti.map((piece, index) => (
        <ConfettiPiece
          key={`confetti-${index}`}
          color={piece.color}
          startX={piece.startX}
          size={piece.size}
          delay={piece.delay}
          duration={piece.duration}
        />
      ))}

      {/* Floating stars and sparkles */}
      {stars.map((star, index) => (
        <FloatingStar
          key={index}
          delay={star.delay}
          startX={star.startX}
          startY={star.startY}
          emoji={star.emoji}
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

      {/* Loading text with rainbow wave */}
      <LoadingText />

      {/* Fun decorative emojis at bottom */}
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
    backgroundColor: '#FFF0F5', // Warm lavender-pink instead of cream — more magical
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute',
    width: SCREEN_WIDTH * 2,
    height: SCREEN_WIDTH * 2,
    borderRadius: SCREEN_WIDTH,
    backgroundColor: 'transparent',
    borderWidth: 60,
    borderColor: 'rgba(255, 150, 200, 0.12)', // Warm pink tint
    top: -SCREEN_WIDTH * 0.5,
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
    fontFamily: 'SuperWonder',
    fontSize: 42,
    fontWeight: '800',
    color: Colors.candy.bubblegum, // Vibrant bubblegum pink
    textShadowColor: 'rgba(255, 64, 129, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontFamily: 'SuperWonder',
    fontSize: 18,
    color: Colors.candy.lavender, // Lavender purple
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
    // Enhanced shadow for candy-like glow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    fontFamily: 'SuperWonder',
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
