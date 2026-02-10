import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

/**
 * Animated sparkle decoration for PopBox corners.
 * Creates a magical, whimsical effect children love —
 * sparkles pulse and rotate at PopBox edges.
 */
const SparkleDecor: React.FC<{
  emoji: string;
  delay: number;
  style: object;
}> = ({ emoji, delay, style }) => {
  const sparkleScale = useSharedValue(0.5);
  const sparkleOpacity = useSharedValue(0);
  const sparkleRotate = useSharedValue(0);

  useEffect(() => {
    // Pulsing scale between 0.7 and 1.3
    sparkleScale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.3, { duration: 800, easing: Easing.out(Easing.quad) }),
          withTiming(0.7, { duration: 800, easing: Easing.in(Easing.quad) })
        ),
        -1,
        true
      )
    );

    // Pulsing opacity for twinkle effect
    sparkleOpacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        true
      )
    );

    // Slow continuous rotation for magical feel
    sparkleRotate.value = withRepeat(
      withTiming(360, { duration: 5000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: sparkleScale.value },
      { rotate: `${sparkleRotate.value}deg` },
    ],
    opacity: sparkleOpacity.value,
  }));

  return (
    <Animated.Text
      style={[
        { position: 'absolute', fontSize: 18, zIndex: 20 },
        style,
        animatedStyle,
      ]}
    >
      {emoji}
    </Animated.Text>
  );
};

/**
 * Bouncing colored dot for PopBox header decoration.
 * Small dots bounce in sequence for a playful loading/activity indicator feel.
 */
const BouncingDot: React.FC<{
  color: string;
  size: number;
  delay: number;
}> = ({ color, size, delay }) => {
  const bounceY = useSharedValue(0);

  useEffect(() => {
    bounceY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 300, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          marginHorizontal: 3,
        },
        animatedStyle,
      ]}
    />
  );
};

// ───────────────────────────────────────────────────────────────────────────────
// PopBox Component
// ───────────────────────────────────────────────────────────────────────────────

interface PopBoxProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  variant?: 'blue' | 'green' | 'orange' | 'purple'; // Different themes
  showCloseButton?: boolean;
}

/**
 * PopBox - A kid-friendly, playful modal component.
 *
 * Features:
 * - "Stitched" border design (dashed lines)
 * - Bouncy entrance/exit animations (ZoomIn/ZoomOut)
 * - Animated sparkle decorations at corners
 * - Bouncing dots in header for playful feel
 * - Colorful, themed variants
 * - Tactile close button
 * - Haptic feedback on open/close
 */
export const PopBox: React.FC<PopBoxProps> = ({
  visible,
  onClose,
  title,
  children,
  variant = 'blue',
  showCloseButton = true,
}) => {
  // Theme configuration based on variant
  const themes = {
    blue: {
      bg: Colors.secondary[100],
      border: Colors.secondary[400],
      title: Colors.secondary[700],
      icon: '⚙️',
    },
    green: {
      bg: Colors.primary[100],
      border: Colors.primary[400],
      title: Colors.primary[700],
      icon: '🌟',
    },
    orange: {
      bg: Colors.danger[100],
      border: Colors.danger[400],
      title: Colors.danger[700],
      icon: '🧸',
    },
    purple: {
      bg: '#F3E8FF',
      border: '#A855F7',
      title: '#7E22CE',
      icon: '🎨',
    },
  };

  const theme = themes[variant];

  // Haptic feedback on modal open
  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.backdrop}
        >
          {/* Main PopBox Container */}
          <TouchableWithoutFeedback onPress={() => { }}>
            <Animated.View
              entering={ZoomIn.springify().damping(12)}
              exiting={ZoomOut.duration(200)}
              style={[
                styles.container,
                {
                  backgroundColor: theme.bg,
                  borderColor: theme.border,
                },
              ]}
            >
              {/* ✨ Corner sparkle decorations — magical whimsy for children */}
              <SparkleDecor emoji="✨" delay={0} style={{ top: -10, left: -10 }} />
              <SparkleDecor emoji="⭐" delay={300} style={{ top: -10, right: -10 }} />
              <SparkleDecor emoji="💫" delay={600} style={{ bottom: -10, left: -10 }} />
              <SparkleDecor emoji="✨" delay={900} style={{ bottom: -10, right: -10 }} />

              {/* Decorative "Stitch" Border Layer */}
              <View style={[styles.stitchBorder, { borderColor: theme.border }]} />

              {/* Header with bouncing dots */}
              {(title || showCloseButton) && (
                <View style={styles.header}>
                  {title && (
                    <View style={styles.titleContainer}>
                      <Text style={styles.headerIcon}>{theme.icon}</Text>
                      <Text style={[styles.title, { color: theme.title }]}>
                        {title}
                      </Text>
                    </View>
                  )}

                  {/* Bouncing dots — playful activity indicator between title and close */}
                  <View style={styles.dotsRow}>
                    <BouncingDot color={Colors.candy.pink} size={8} delay={0} />
                    <BouncingDot color={Colors.candy.lemon} size={8} delay={150} />
                    <BouncingDot color={Colors.candy.mint} size={8} delay={300} />
                  </View>

                  {showCloseButton && (
                    <TouchableOpacity
                      onPress={handleClose}
                      style={styles.closeButton}
                      activeOpacity={0.8}
                    >
                      <View style={styles.closeButtonInner}>
                        <Text style={styles.closeIcon}>✕</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Content Area */}
              <View style={styles.content}>
                {children}
              </View>

            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: Math.min(width * 0.9, 400),
    borderRadius: 40, // High curvature for playful look
    borderWidth: 0,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
    overflow: 'visible', // Allow sparkles and close button to extend outside
  },
  stitchBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 4,
    borderRadius: 36,
    borderStyle: 'dashed',
    margin: 6,
    pointerEvents: 'none',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
    zIndex: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerIcon: {
    fontSize: 24,
  },
  title: {
    fontFamily: 'SuperWonder',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.danger.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: '900',
    color: 'white',
    marginTop: -2, // Optical alignment
  },
  content: {
    backgroundColor: Colors.cream,
    borderRadius: 24,
    padding: 20,
    minHeight: 100,
    width: '100%',
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
});
