import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { Colors } from '@/constants/colors';

// Countdown sound asset — played once when the 3..2..1 phase begins
const COUNTDOWN_SOUND = require('@/assets/sounds/countdown.mp3');

/**
 * The three sequential phases every game intro goes through.
 * - intro   : Shows the "Ready for …?" message
 * - countdown: Displays 3 → 2 → 1 with animated scale
 * - playing  : Fires onComplete — the parent takes over
 */
export type GamePhase = 'intro' | 'countdown' | 'playing';

type GameCountdownProps = {
  /** Text shown during the intro phase, e.g. "Ready for Math?" */
  introText: string;
  /** Fired when the countdown finishes — parent should switch to playing state */
  onComplete: () => void;
  /** How long (ms) to hold the intro text before starting countdown. Default: 1000 */
  introDurationMs?: number;
};

/**
 * Reusable Game Countdown Component.
 *
 * Encapsulates the "Ready?" → 3 → 2 → 1 → GO! sequence that both
 * MathGameScreen and AlphabetGameScreen share. Plays a countdown
 * sound effect and animates each number with a pop-in scale.
 *
 * Usage:
 * ```tsx
 * {phase !== 'playing' && (
 *   <GameCountdown
 *     introText="Ready for Math?"
 *     onComplete={() => setPhase('playing')}
 *   />
 * )}
 * ```
 */
export const GameCountdown: React.FC<GameCountdownProps> = ({
  introText,
  onComplete,
  introDurationMs = 1000,
}) => {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [count, setCount] = useState(3);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Scale animation for each countdown number (pop-in effect)
  const numberScale = useSharedValue(0);

  const numberAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numberScale.value }],
  }));

  // Intro text fade-in
  const introOpacity = useSharedValue(0);

  const introAnimatedStyle = useAnimatedStyle(() => ({
    opacity: introOpacity.value,
    transform: [{ scale: 0.8 + introOpacity.value * 0.2 }],
  }));

  useEffect(() => {
    // Fade in the intro text
    introOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
  }, []);

  // Cleanup sound on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  /**
   * Plays the countdown.mp3 sound effect.
   * Non-blocking — errors are silently logged (audio should never crash the game).
   */
  const playCountdownSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(COUNTDOWN_SOUND);
      soundRef.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.log('Error playing countdown sound:', error);
    }
  };

  // Main sequence: intro → countdown → onComplete
  useEffect(() => {
    let isMounted = true;

    const runSequence = async () => {
      // Phase 1: Hold the "Ready for …?" text
      await new Promise(resolve => setTimeout(resolve, introDurationMs));
      if (!isMounted) return;

      // Phase 2: Start countdown (3..2..1)
      setPhase('countdown');
      playCountdownSound();

      for (let i = 3; i >= 1; i--) {
        setCount(i);

        // Pop-in animation for each number: 0 → overshoot → 1
        numberScale.value = 0;
        numberScale.value = withSequence(
          withSpring(1.2, { damping: 6, stiffness: 200 }),
          withSpring(1, { damping: 10, stiffness: 150 }),
        );

        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!isMounted) return;
      }

      // Phase 3: Done — hand control back to parent
      onComplete();
    };

    runSequence();
    return () => {
      isMounted = false;
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps — intentional one-shot

  return (
    <View style={styles.container}>
      {phase === 'intro' && (
        <Animated.Text style={[styles.introText, introAnimatedStyle]}>
          {introText}
        </Animated.Text>
      )}

      {phase === 'countdown' && (
        <Animated.Text style={[styles.countdownText, numberAnimatedStyle]}>
          {count}
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  introText: {
    fontFamily: 'SuperWonder',
    fontSize: 42,
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    textAlign: 'center',
  },
  countdownText: {
    fontFamily: 'SuperWonder',
    fontSize: 120,
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 8,
  },
});
