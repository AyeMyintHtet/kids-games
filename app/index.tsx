import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import {
  useFonts,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';
import * as Haptics from 'expo-haptics';
import { TactileButton } from '../src/components/TactileButton';
import { Colors } from '../src/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Responsive sizing utilities.
 * Scales based on screen size while maintaining minimum touch targets.
 */
const scale = (size: number): number => {
  const baseWidth = 375;
  return (SCREEN_WIDTH / baseWidth) * size;
};

const verticalScale = (size: number): number => {
  const baseHeight = 812;
  return (SCREEN_HEIGHT / baseHeight) * size;
};

/**
 * Floating cloud component for background decoration.
 */
const FloatingCloud: React.FC<{ delay: number; startX: number; top: number }> = ({
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

/**
 * Animated mascot owl component.
 */
const MascotOwl: React.FC = () => {
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
  }, []);

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

/**
 * Full rainbow arc component with gradient colors.
 * Creates a proper semicircle rainbow instead of just an emoji.
 */
const AnimatedRainbow: React.FC = () => {
  const opacity = useSharedValue(0.7);
  const scaleValue = useSharedValue(1);

  useEffect(() => {
    // Pulsing opacity animation
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.7, { duration: 2000 })
      ),
      -1,
      true
    );

    // Subtle scale breathing effect
    scaleValue.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [opacity, scaleValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scaleValue.value }],
  }));

  // Rainbow colors from outside to inside
  const rainbowColors = [
    '#FF0000', // Red
    '#FF7F00', // Orange
    '#FFFF00', // Yellow
    '#00FF00', // Green
    '#0000FF', // Blue
    '#4B0082', // Indigo
    '#9400D3', // Violet
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

/**
 * Score badge component.
 */
const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  return (
    <View style={styles.scoreBadge}>
      <Text style={styles.trophyEmoji}>🏆</Text>
      <Text style={styles.scoreText}>SCORE: {score}</Text>
    </View>
  );
};

/**
 * Settings button (top-left).
 */
const SettingsButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  return (
    <TactileButton
      onPress={onPress}
      color={Colors.fun.purple}
      size="small"
      style={styles.cornerButton}
    >
      <Text style={styles.cornerButtonEmoji}>⚙️</Text>
    </TactileButton>
  );
};

/**
 * Sound toggle button (bottom-left).
 */
const SoundButton: React.FC<{ onPress: () => void; isMuted: boolean }> = ({
  onPress,
  isMuted,
}) => {
  return (
    <TactileButton
      onPress={onPress}
      color={Colors.fun.purple}
      size="small"
      style={styles.cornerButton}
    >
      <Text style={styles.cornerButtonEmoji}>{isMuted ? '🔇' : '🔊'}</Text>
    </TactileButton>
  );
};

/**
 * Parent Gate button (top-right).
 */
const ParentGateButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  return (
    <View style={styles.parentGateContainer}>
      <TactileButton
        onPress={onPress}
        color={Colors.fun.purple}
        size="small"
        style={styles.cornerButton}
      >
        <Text style={styles.cornerButtonEmoji}>ℹ️</Text>
      </TactileButton>
      <Text style={styles.parentGateLabel}>Parent{'\n'}Gate</Text>
    </View>
  );
};

/**
 * Main HomeScreen Component.
 * 
 * Implements 2026 kid-friendly UI standards:
 * - Minimum 88x88pt buttons
 * - Spring-based animations
 * - Multi-sensory feedback (visual + audio + haptic)
 * - Rounded, friendly typography (Quicksand)
 * - Responsive design for all devices
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [isMuted, setIsMuted] = React.useState(false);
  const [score] = React.useState(125);

  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  // Title animation
  const titleScale = useSharedValue(1);
  useEffect(() => {
    titleScale.value = withRepeat(
      withSequence(
        withSpring(1.02, { damping: 10 }),
        withSpring(1, { damping: 10 })
      ),
      -1,
      true
    );
  }, []);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
  }));

  // Button handlers with haptic feedback
  const handleMathPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    console.log('Math game pressed');
    // TODO: Navigate to math games
  }, []);

  const handleLettersPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    console.log('Letters game pressed');
    // TODO: Navigate to letter games
  }, []);

  const handleVideosPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    console.log('Videos pressed');
    // TODO: Navigate to videos
  }, []);

  const handleSettingsPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Settings pressed');
  }, []);

  const handleSoundToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMuted((prev) => !prev);
  }, []);

  const handleParentGate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Parent gate pressed');
  }, []);

  if (!fontsLoaded) {
    return null; // SplashScreen handles loading
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Sky gradient background */}
      <LinearGradient
        colors={['#87CEEB', '#B0E0E6', '#98D8C8']}
        style={styles.backgroundGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Grass at bottom */}
      <LinearGradient
        colors={['#7CB342', '#558B2F', '#33691E']}
        style={styles.grass}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Floating clouds */}
      <FloatingCloud delay={0} startX={-100} top={verticalScale(60)} />
      <FloatingCloud delay={5000} startX={-150} top={verticalScale(120)} />
      <FloatingCloud delay={8000} startX={-80} top={verticalScale(180)} />

      {/* Rainbow decoration */}
      <AnimatedRainbow />

      {/* Trees on sides */}
      <Text style={[styles.tree, styles.treeLeft]}>🌳</Text>
      <Text style={[styles.tree, styles.treeRight]}>🌳</Text>

      {/* Flowers */}
      <Text style={[styles.flower, { left: scale(20), bottom: verticalScale(80) }]}>🌸</Text>
      <Text style={[styles.flower, { right: scale(30), bottom: verticalScale(90) }]}>�</Text>
      <Text style={[styles.flower, { left: scale(60), bottom: verticalScale(70) }]}>🌷</Text>
      <Text style={[styles.flower, { right: scale(70), bottom: verticalScale(75) }]}>🌻</Text>

      {/* Top controls */}
      <View style={[styles.topControls, { paddingTop: insets.top + 10 }]}>
        <SettingsButton onPress={handleSettingsPress} />
        <ParentGateButton onPress={handleParentGate} />
      </View>

      {/* Main content */}
      <View style={styles.mainContent}>
        {/* Title */}
        <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
          <Text style={styles.title}>LEARNY LAND</Text>
          <Text style={styles.subtitle}>MATH & ADVENTURES</Text>
        </Animated.View>

        {/* Mascot */}
        <MascotOwl />

        {/* Books stack under mascot */}
        <Text style={styles.books}>📚</Text>
      </View>

      {/* Game buttons */}
      <View style={styles.gameButtonsContainer}>
        {/* Math button (red/coral) */}
        <View style={styles.gameButtonWrapper}>
          <TactileButton
            onPress={handleMathPress}
            color="#FF6B6B"
            size="large"
            style={styles.gameButton}
          >
            <Text style={styles.gameButtonText}>1+2=?</Text>
            <Text style={styles.gameButtonEmoji}>🚀</Text>
          </TactileButton>
        </View>

        {/* Letters/ABC button (blue) - Center, slightly lower */}
        <View style={[styles.gameButtonWrapper, styles.centerButton]}>
          <TactileButton
            onPress={handleLettersPress}
            color={Colors.secondary.main}
            size="large"
            style={styles.gameButton}
          >
            <Text style={styles.gameButtonEmoji}>🔤</Text>
            <Text style={styles.abcText}>ABC</Text>
          </TactileButton>
        </View>

        {/* Videos/Play button (green) */}
        <View style={styles.gameButtonWrapper}>
          <TactileButton
            onPress={handleVideosPress}
            color={Colors.primary.main}
            size="large"
            style={styles.gameButton}
          >
            <Text style={styles.playIcon}>▶️</Text>
            <Text style={styles.chestEmoji}>📦</Text>
          </TactileButton>
        </View>
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 10 }]}>
        <SoundButton onPress={handleSoundToggle} isMuted={isMuted} />
        <ScoreBadge score={score} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: SCREEN_HEIGHT * 0.7,
  },
  grass: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.35,
    borderTopLeftRadius: scale(100),
    borderTopRightRadius: scale(100),
  },
  cloud: {
    position: 'absolute',
    fontSize: scale(50),
    opacity: 0.9,
  },
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
  tree: {
    position: 'absolute',
    fontSize: scale(80),
    bottom: verticalScale(200),
  },
  treeLeft: {
    left: -scale(15),
  },
  treeRight: {
    right: -scale(15),
  },
  flower: {
    position: 'absolute',
    fontSize: scale(28),
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    zIndex: 100,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: scale(16),
    zIndex: 100,
  },
  cornerButton: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
  },
  cornerButtonEmoji: {
    fontSize: scale(28),
  },
  parentGateContainer: {
    alignItems: 'center',
  },
  parentGateLabel: {
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: scale(10),
    color: Colors.fun.purple,
    textAlign: 'center',
    marginTop: 4,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: verticalScale(150),
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  title: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: scale(38),
    color: '#FF6B9D',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: scale(16),
    color: Colors.fun.purple,
    marginTop: 4,
    letterSpacing: 1,
  },
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
  books: {
    fontSize: scale(60),
    marginTop: -scale(20),
  },
  gameButtonsContainer: {
    position: 'absolute',
    bottom: verticalScale(100),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: scale(10),
    gap: scale(15),
  },
  gameButtonWrapper: {
    alignItems: 'center',
  },
  centerButton: {
    marginTop: verticalScale(30),
  },
  gameButton: {
    width: scale(120),
    height: scale(120),
  },
  gameButtonText: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: scale(24),
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gameButtonEmoji: {
    fontSize: scale(30),
    marginTop: 4,
  },
  abcText: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: scale(20),
    color: Colors.white,
  },
  playIcon: {
    fontSize: scale(40),
  },
  chestEmoji: {
    fontSize: scale(28),
    marginTop: 4,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.main,
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    borderBottomWidth: 4,
    borderBottomColor: Colors.accent.dark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  trophyEmoji: {
    fontSize: scale(24),
    marginRight: 8,
  },
  scoreText: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: scale(16),
    color: Colors.neutral[800],
  },
});
