import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

const MAX_MODAL_WIDTH = 400;
const BACKDROP_HORIZONTAL_PADDING = 20;
const BACKDROP_VERTICAL_PADDING = 16;
const CLOSE_BUTTON_HIT_SLOP = {
  top: 10,
  bottom: 10,
  left: 10,
  right: 10,
} as const;

type PopBoxVariant = 'blue' | 'green' | 'orange' | 'purple';

const POPBOX_THEMES: Record<
  PopBoxVariant,
  {
    bg: string;
    border: string;
    title: string;
    icon: string;
  }
> = {
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
  }, [delay, sparkleOpacity, sparkleRotate, sparkleScale]);

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
  }, [bounceY, delay]);

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
  variant?: PopBoxVariant; // Different themes
  animationMode?: 'playful' | 'subtle';
  showCloseButton?: boolean;
  dismissible?: boolean;
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
  animationMode = 'playful',
  showCloseButton = true,
  dismissible = true,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const theme = POPBOX_THEMES[variant];
  const isSubtle = animationMode === 'subtle';

  const modalWidth = Math.min(
    screenWidth - BACKDROP_HORIZONTAL_PADDING * 2,
    MAX_MODAL_WIDTH
  );
  const modalMaxHeight = Math.max(
    260,
    screenHeight - insets.top - insets.bottom - BACKDROP_VERTICAL_PADDING * 2
  );

  // Haptic feedback on modal open
  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    if (!dismissible) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  }, [dismissible, onClose]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View
        // entering={FadeIn.duration(50)}
        // exiting={FadeOut.duration(100)}
        style={[
          styles.backdrop,
          {
            paddingTop: insets.top + BACKDROP_VERTICAL_PADDING,
            paddingBottom: insets.bottom + BACKDROP_VERTICAL_PADDING,
          },
        ]}
      >
        {dismissible && (
          <Pressable
            onPress={handleClose}
            style={styles.backdropDismissArea}
            accessibilityLabel="Close popup"
          />
        )}

        {/* Main PopBox Container */}
        <Animated.View
          entering={
            isSubtle
              ? ZoomIn.duration(170).easing(Easing.out(Easing.cubic))
              : ZoomIn.springify().damping(12)
          }
          exiting={ZoomOut.duration(isSubtle ? 140 : 200)}
          style={[
            styles.container,
            {
              backgroundColor: theme.bg,
              borderColor: theme.border,
              width: modalWidth,
              maxHeight: modalMaxHeight,
            },
          ]}
        >
          {!isSubtle && (
            <>
              {/* ✨ Corner sparkle decorations — magical whimsy for children */}
              <SparkleDecor emoji="✨" delay={0} style={{ top: -10, left: -10 }} />
              <SparkleDecor emoji="⭐" delay={300} style={{ top: -10, right: -10 }} />
              <SparkleDecor emoji="💫" delay={600} style={{ bottom: -10, left: -10 }} />
              <SparkleDecor emoji="✨" delay={900} style={{ bottom: -10, right: -10 }} />
            </>
          )}

          {/* Decorative "Stitch" Border Layer */}
          <View style={[styles.stitchBorder, { borderColor: theme.border }]} />

          {showCloseButton && (
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [
                styles.closeButtonFloating,
                pressed && styles.closeButtonPressed,
              ]}
              hitSlop={CLOSE_BUTTON_HIT_SLOP}
            >
              <View style={styles.closeButtonInner}>
                <Text style={styles.closeIcon}>✕</Text>
              </View>
            </Pressable>
          )}

          {/* Header with bouncing dots */}
          {title && (
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.headerIcon}>{theme.icon}</Text>
                <Text style={[styles.title, { color: theme.title }]}>
                  {title}
                </Text>
              </View>

              {!isSubtle && (
                <View style={styles.dotsRow}>
                  <BouncingDot color={Colors.candy.pink} size={8} delay={0} />
                  <BouncingDot color={Colors.candy.lemon} size={8} delay={150} />
                  <BouncingDot color={Colors.candy.mint} size={8} delay={300} />
                </View>
              )}
            </View>
          )}

          {/* Content Area */}
          <View style={styles.content}>
            {children}
          </View>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: BACKDROP_HORIZONTAL_PADDING,
  },
  backdropDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
    minHeight: 44,
    gap: 8,
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
    flexShrink: 1,
    maxWidth: '100%',
  },
  headerIcon: {
    fontSize: 24,
  },
  title: {
    fontFamily: 'SuperWonder',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButtonFloating: {
    position: 'absolute',
    left: 12,
    top: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  closeButtonPressed: {
    transform: [{ scale: 0.95 }],
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
    flexShrink: 1,
    width: '100%',
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
});
