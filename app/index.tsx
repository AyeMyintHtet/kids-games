import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  BounceIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { TactileButton } from '../src/components/TactileButton';
import { PopBox } from '../src/components/PopBox';
import { ScoreBadge } from '../src/components/ScoreBadge';
import { Colors } from '../src/constants/colors';
import { useCloudTransition } from '../src/hooks/useCloudTransition';
import { useMusic } from './_layout'; // keep existing relative import

// Utils
import { scale, verticalScale, SCREEN_WIDTH, SCREEN_HEIGHT } from '../src/utils/responsive';

// Home Feature Components
import { FloatingCloud } from '../src/components/home/FloatingCloud';
import { FloatingBubble } from '../src/components/home/FloatingBubble';
import { AnimatedSun } from '../src/components/home/AnimatedSun';
import { TwinklingSparkle } from '../src/components/home/TwinklingSparkle';
import { DancingButterfly } from '../src/components/home/DancingButterfly';
import { MascotOwl } from '../src/components/home/MascotOwl';
import { AnimatedRainbow } from '../src/components/home/AnimatedRainbow';
import { SettingsButton } from '../src/components/home/HomeButtons';
import { WavyDivider } from '../src/components/home/WavyDivider';
import { LanguageDropdown } from '../src/components/home/LanguageDropdown';

/**
 * Main HomeScreen Component.
 *
 * Implements 2026 kid-friendly UI standards:
 * - Floating bubbles + sparkles for magical atmosphere
 * - Animated sun, butterflies, and nature elements
 * - Staggered bouncy entrance animations for game buttons
 * - Spring-based animations throughout
 * - Multi-sensory feedback (visual + haptic)
 * - Rounded, friendly typography (SuperWonder)
 * - Responsive design for all devices
 */
export default function HomeScreen() {
  const { navigateTo } = useCloudTransition();
  const insets = useSafeAreaInsets();
  const { isMuted, toggleMute } = useMusic();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  // Title Animation
  const titleScale = useSharedValue(1);
  const titleRotate = useSharedValue(0);

  useEffect(() => {
    // Pulse animation for title
    titleScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // Subtle rotation for title (wobble)
    titleRotate.value = withRepeat(
      withSequence(
        withTiming(2, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(-2, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: titleScale.value },
      { rotate: `${titleRotate.value}deg` },
    ],
  }));

  // Button handlers with haptic feedback
  const handleMathPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigateTo('/math-game');
  }, [navigateTo]);

  const handleLettersPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigateTo('/alphabet');
  }, [navigateTo]);

  const handleVideosPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigateTo('/animal-flashcards');
  }, [navigateTo]);

  // Bubble configurations — candy colors floating upward
  const bubbles = [
    { color: Colors.candy.pink, size: 30, startX: SCREEN_WIDTH * 0.1, delay: 0, duration: 8000 },
    { color: Colors.candy.lavender, size: 22, startX: SCREEN_WIDTH * 0.3, delay: 2000, duration: 10000 },
    { color: Colors.candy.mint, size: 35, startX: SCREEN_WIDTH * 0.55, delay: 4000, duration: 9000 },
    { color: Colors.candy.lemon, size: 18, startX: SCREEN_WIDTH * 0.75, delay: 1000, duration: 11000 },
    { color: Colors.candy.skyBlue, size: 26, startX: SCREEN_WIDTH * 0.9, delay: 3000, duration: 7000 },
    { color: Colors.candy.peach, size: 20, startX: SCREEN_WIDTH * 0.45, delay: 5000, duration: 12000 },
  ];

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

      {/* ☀️ Animated sun with pulsing glow */}
      <AnimatedSun />

      {/* Floating clouds */}
      <FloatingCloud delay={0} startX={-100} top={verticalScale(60)} />
      <FloatingCloud delay={5000} startX={-150} top={verticalScale(120)} />
      <FloatingCloud delay={8000} startX={-60} top={verticalScale(180)} />
      <FloatingCloud delay={7000} startX={-40} top={verticalScale(150)} />
      <FloatingCloud delay={9000} startX={-20} top={verticalScale(120)} />
      <FloatingCloud delay={3000} startX={-40} top={verticalScale(90)} />
      <FloatingCloud delay={5000} startX={-70} top={verticalScale(60)} />
      <FloatingCloud delay={6000} startX={-90} top={verticalScale(30)} />

      {/* 🫧 Floating translucent bubbles — magical atmosphere */}
      {bubbles.map((bubble, index) => (
        <FloatingBubble
          key={`bubble-${index}`}
          color={bubble.color}
          size={bubble.size}
          startX={bubble.startX}
          delay={bubble.delay}
          duration={bubble.duration}
        />
      ))}

      {/* ✨ Twinkling sparkles scattered across the sky */}
      <TwinklingSparkle x={scale(30)} y={verticalScale(100)} delay={0} emoji="✨" />
      <TwinklingSparkle x={scale(280)} y={verticalScale(70)} delay={500} emoji="⭐" />
      <TwinklingSparkle x={scale(180)} y={verticalScale(150)} delay={1200} emoji="💫" />
      <TwinklingSparkle x={scale(60)} y={verticalScale(200)} delay={800} emoji="✨" />
      <TwinklingSparkle x={scale(320)} y={verticalScale(130)} delay={1500} emoji="🌟" />

      {/* 🦋 Dancing butterflies */}
      <DancingButterfly startX={scale(50)} startY={verticalScale(250)} delay={0} />
      <DancingButterfly startX={scale(280)} startY={verticalScale(300)} delay={1500} />

      {/* Rainbow decoration */}
      <AnimatedRainbow />

      {/* Trees on sides */}
      <Text style={[styles.tree, styles.treeLeft]}>🌳</Text>
      <Text style={[styles.tree, styles.treeRight]}>🌳</Text>

      {/* Flowers — more for a lush garden feel */}
      <Text style={[styles.flower, { left: scale(20), bottom: verticalScale(80) }]}>🌸</Text>
      <Text style={[styles.flower, { right: scale(30), bottom: verticalScale(90) }]}></Text>
      <Text style={[styles.flower, { left: scale(60), bottom: verticalScale(70) }]}>🌷</Text>
      <Text style={[styles.flower, { right: scale(70), bottom: verticalScale(75) }]}>🌻</Text>
      <Text style={[styles.flower, { left: scale(100), bottom: verticalScale(85) }]}>🌼</Text>
      <Text style={[styles.flower, { right: scale(10), bottom: verticalScale(65) }]}>🌺</Text>

      {/* 🐝 Buzzing bee near flowers */}
      <DancingButterfly startX={scale(120)} startY={verticalScale(600)} delay={800} />

      {/* Top controls */}
      <View style={styles.topControls}>
        <SettingsButton onPress={() => setIsSettingsOpen(true)} />
        {/* <ParentGateButton onPress={() => console.log('Parent Gate')} /> */}
      </View>

      {/* Main content */}
      <View style={styles.mainContent}>
        {/* Enhanced title with wobble animation */}
        <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
          <Text style={styles.title}>LEARNY LAND</Text>
          <Text style={styles.subtitle}>MATH & ADVENTURES</Text>
        </Animated.View>

        {/* Mascot */}
        <MascotOwl />

        {/* Books stack under mascot */}
        <Text style={styles.books}>📚</Text>
      </View>

      {/* Game buttons with staggered bouncy entrance 🎯 */}
      <View style={styles.gameButtonsContainer}>
        {/* Math button — bounces in first (300ms delay) */}
        <Animated.View
          entering={BounceIn.delay(300).springify()}
          style={[styles.gameButtonWrapper, { marginBottom: scale(50) }]}
        >
          <TactileButton
            onPress={handleMathPress}
            color="#FF6B6B"
            size="large"
            style={styles.gameButton}
          >
            <Text style={styles.gameButtonText}>1+2=?</Text>
            <Text style={styles.gameButtonEmoji}>🚀</Text>
          </TactileButton>
        </Animated.View>

        {/* Letters/ABC button — bounces in second (600ms delay) */}
        <Animated.View
          entering={BounceIn.delay(600).springify()}
          style={[styles.gameButtonWrapper, styles.centerButton]}
        >
          <TactileButton
            onPress={handleLettersPress}
            color={Colors.secondary.main}
            size="large"
            style={styles.gameButton}
          >
            <Text style={styles.gameButtonEmoji}>🔤</Text>
            <Text style={styles.abcText}>ABC</Text>
          </TactileButton>
        </Animated.View>

        {/* Animal flashcards button — bounces in third (900ms delay) */}
        <Animated.View
          entering={BounceIn.delay(900).springify()}
          style={[styles.gameButtonWrapper, { marginBottom: scale(50) }]}
        >
          <TactileButton
            onPress={handleVideosPress}
            color={Colors.primary.main}
            size="large"
            style={styles.gameButton}
          >
            <Text style={styles.playIcon}>🐾</Text>
            <Text style={styles.abcText}>ANIMALS</Text>
          </TactileButton>
        </Animated.View>
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 10 }]}>
        {/* <SoundButton onPress={handleSoundToggle} isMuted={isMuted} /> */}
        <ScoreBadge />
      </View>

      {/* Settings PopBox */}
      <PopBox
        visible={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Settings"
        variant="blue"
      >
        <View style={styles.settingsRow}>
          <Text style={styles.settingLabel}>Music 🎵</Text>
          <Switch
            value={!isMuted}
            onValueChange={() => {
              toggleMute();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            trackColor={{ false: Colors.neutral[300], true: Colors.success }}
            thumbColor={Colors.white}
          />
        </View>

        <View style={styles.settingsDivider} />

        <LanguageDropdown
          selected={language}
          onSelect={setLanguage}
        />

        <WavyDivider />

        <View style={styles.settingsButtonsRow}>
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: Colors.primary.main }]}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setIsSettingsOpen(false);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.settingsButtonText}>⭐️ Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: Colors.fun.purple }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.settingsButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </PopBox>
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
    top: 50,
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
    fontFamily: 'SuperWonder',
    fontSize: scale(38),
    color: '#FF6B9D',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'SuperWonder',
    fontSize: scale(16),
    color: Colors.fun.purple,
    marginTop: 4,
    letterSpacing: 1,
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
    fontFamily: 'SuperWonder',
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
    fontFamily: 'SuperWonder',
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
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontFamily: 'SuperWonder',
    fontSize: 18,
    color: Colors.secondary[900],
  },
  settingsDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 16,
  },
  settingsButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  settingsButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  settingsButtonText: {
    fontFamily: 'SuperWonder',
    fontSize: 18,
    color: Colors.white,
  },
  versionText: {
    fontFamily: 'SuperWonder',
    fontSize: 12,
    color: Colors.neutral[400],
    textAlign: 'center',
    marginTop: 12,
  },
});
