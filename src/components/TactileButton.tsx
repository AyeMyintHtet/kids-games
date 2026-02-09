import React, { useCallback } from 'react';
import { StyleSheet, Dimensions, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Colors } from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Responsive sizing based on screen dimensions.
 * Ensures buttons meet minimum 88x88 pt requirement for kids.
 */
const getResponsiveSize = (baseSize: number): number => {
  const minDimension = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);
  const scaleFactor = minDimension / 375; // Base on iPhone SE width
  return Math.max(baseSize * scaleFactor, 88); // Minimum 88pt for fat fingers
};

/**
 * Spring configuration for squash & stretch effect.
 * Makes UI feel like a toy rather than a computer.
 */
const SPRING_CONFIG = {
  damping: 8,
  stiffness: 300,
  mass: 0.5,
};

interface TactileButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  color: string;
  shadowColor?: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  emoji?: string;
  label?: string;
  playSound?: boolean;
}

/**
 * TactileButton - Kid-friendly button with multi-sensory feedback.
 * 
 * Features:
 * - Spring-based squash & stretch animations
 * - Haptic feedback on press
 * - Optional audio feedback
 * - Minimum 88x88 pt touch target
 * - Obvious visual press state
 */
export const TactileButton: React.FC<TactileButtonProps> = ({
  onPress,
  children,
  color,
  shadowColor,
  size = 'large',
  style,
  textStyle,
  disabled = false,
  emoji,
  label,
  playSound = true,
}) => {
  const scale = useSharedValue(1);
  const pressed = useSharedValue(false);

  // Button sizes based on 2026 kid-friendly standards
  const buttonSizes = {
    small: getResponsiveSize(88),
    medium: getResponsiveSize(110),
    large: getResponsiveSize(140),
  };

  const buttonSize = buttonSizes[size];

  /**
   * Play tap sound for audio feedback.
   * Children need immediate confirmation that their tap "worked."
   */
  const playTapSound = useCallback(async () => {
    if (!playSound) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        // Using a built-in system sound fallback
        { uri: 'https://cdn.freesound.org/previews/614/614088_5674468-lq.mp3' },
        { shouldPlay: true, volume: 0.3 }
      );
      // Unload after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch {
      // Silently fail if audio cannot play
    }
  }, [playSound]);

  /**
   * Trigger haptic + audio + visual feedback.
   */
  const triggerFeedback = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playTapSound();
    onPress();
  }, [onPress, playTapSound]);

  /**
   * Gesture handler for press detection.
   * Uses spring animations for squash & stretch effect.
   */
  const gesture = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      pressed.value = true;
      // Squash effect - scales down and slightly widens
      scale.value = withSpring(0.85, SPRING_CONFIG);
    })
    .onFinalize(() => {
      pressed.value = false;
      // Stretch/bounce back with spring physics
      scale.value = withSpring(1, {
        ...SPRING_CONFIG,
        damping: 6, // More bouncy on release
      });
      runOnJS(triggerFeedback)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      // Subtle squash effect - wider when pressed
      { scaleX: pressed.value ? 1.1 : 1 },
    ],
  }));

  const effectiveShadowColor = shadowColor || darkenColor(color, 30);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.button,
          {
            width: buttonSize,
            height: buttonSize,
            backgroundColor: color,
            borderRadius: buttonSize / 2,
            // 3D effect shadow
            shadowColor: effectiveShadowColor,
            borderBottomColor: effectiveShadowColor,
          },
          animatedStyle,
          disabled && styles.disabled,
          style,
        ]}
      >
        {emoji && <Animated.Text style={styles.emoji}>{emoji}</Animated.Text>}
        {label && (
          <Animated.Text style={[styles.label, textStyle]}>{label}</Animated.Text>
        )}
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

/**
 * Utility to darken a hex color for shadow effects.
 */
const darkenColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max(((num >> 8) & 0x00ff) - amt, 0);
  const B = Math.max((num & 0x0000ff) - amt, 0);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    // 3D effect with bottom border
    borderBottomWidth: 6,
    // Soft shadow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    // Inner padding
    padding: 12,
  },
  emoji: {
    fontSize: getResponsiveSize(48),
    textAlign: 'center',
  },
  label: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: getResponsiveSize(16),
    color: Colors.white,
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default TactileButton;
