import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

const PLAY_ICON = require('@/assets/images/play.png');
const CLOSE_ICON = require('@/assets/images/close.png');

interface GiveUpModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const GiveUpModal: React.FC<GiveUpModalProps> = ({ onConfirm, onCancel }) => {
  // Animation Values
  const modalScale = useSharedValue(0.85);
  const mascotScale = useSharedValue(1);
  const stickerRotate = useSharedValue(0);
  const playIconScale = useSharedValue(1);
  const closeIconScale = useSharedValue(1);

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
  }));
  const mascotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mascotScale.value }],
  }));
  const stickerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${stickerRotate.value}deg` }],
  }));
  const playIconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playIconScale.value }],
  }));
  const closeIconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: closeIconScale.value }],
  }));

  useEffect(() => {
    // Enter animation
    modalScale.value = withSequence(
      withTiming(0.9, { duration: 0 }),
      withSpring(1, { damping: 10, stiffness: 160 })
    );

    // Mascot pulse
    mascotScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );

    // Sticker rotate
    stickerRotate.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 550, easing: Easing.inOut(Easing.sin) }),
        withTiming(3, { duration: 550, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Bouncing pulse on the play icon
    playIconScale.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.95, { duration: 600, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // Gentle pulse on the close icon
    closeIconScale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.92, { duration: 700, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [closeIconScale, mascotScale, modalScale, playIconScale, stickerRotate]); // Run on mount

  return (
    <View style={styles.modalBackdrop}>
      <Animated.View style={[styles.giveUpModalCard, modalAnimatedStyle]}>
        <LinearGradient
          colors={[...Colors.gradients.modalPastel]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.giveUpModalGradient}
        >
          <View style={styles.modalBubbleOne} />
          <View style={styles.modalBubbleTwo} />
          <View style={styles.modalBubbleThree} />

          <Animated.View style={[styles.giveUpStickerWrap, stickerAnimatedStyle]}>
            <Text style={styles.giveUpStickerText}>🫧 Break Time 🫧</Text>
          </Animated.View>

          <Animated.View style={[styles.giveUpMascotCircle, mascotAnimatedStyle]}>
            <Text style={styles.giveUpMascot}>🐣</Text>
          </Animated.View>

          <Text style={styles.giveUpTitle}>Give Up For Now?</Text>
          <Text style={styles.giveUpMessage}>
            You can come back and play again anytime.
          </Text>

          <View style={styles.giveUpButtonsRow}>
            <Pressable onPress={onConfirm}>
              <Animated.View style={closeIconAnimatedStyle}>
                <Image source={CLOSE_ICON} style={{ width: 60, height: 60 }} contentFit="contain" />
              </Animated.View>
            </Pressable>
            <Pressable onPress={onCancel}>
              <Animated.View style={playIconAnimatedStyle}>
                <Image source={PLAY_ICON} style={{ width: 60, height: 60 }} contentFit="contain" />
              </Animated.View>
            </Pressable>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 34, 72, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 50,
  },
  giveUpModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 30,
    borderWidth: 5,
    borderColor: Colors.accent.main,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  giveUpModalGradient: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
  },
  modalBubbleOne: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.6)',
    top: -20,
    right: -20,
  },
  modalBubbleTwo: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.45)',
    bottom: 24,
    left: -18,
  },
  modalBubbleThree: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.5)',
    top: 86,
    left: 24,
  },
  giveUpStickerWrap: {
    backgroundColor: Colors.accent.main,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  giveUpStickerText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: 18,
    color: Colors.secondary.dark,
  },
  giveUpMascotCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: Colors.white,
    borderWidth: 4,
    borderColor: Colors.candy.skyBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giveUpMascot: {
    fontSize: 40,
  },
  giveUpTitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: 34,
    color: Colors.secondary.dark,
    textAlign: 'center',
  },
  giveUpMessage: {
    marginTop: 8,
    fontFamily: Typography.fontFamily.display,
    fontSize: 22,
    color: Colors.primary.dark,
    textAlign: 'center',
    lineHeight: 30,
  },
  giveUpButtonsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 14,
  },
});
