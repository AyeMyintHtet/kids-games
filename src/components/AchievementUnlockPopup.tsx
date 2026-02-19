import React, { useEffect, useMemo } from 'react';
import {
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useAppStore } from '@/store/useAppStore';
import { getAchievementById } from '@/features/achievements/model/achievements';
import { scale, verticalScale } from '@/utils/responsive';

const AUTO_HIDE_MS = 4200;

export const AchievementUnlockPopup: React.FC = () => {
  const achievementId = useAppStore((state) => state.achievements.lastUnlockedId);
  const clearLastUnlockedAchievement = useAppStore(
    (state) => state.clearLastUnlockedAchievement
  );
  const achievement = useMemo(
    () => (achievementId ? getAchievementById(achievementId) : undefined),
    [achievementId]
  );

  const cardScale = useSharedValue(0.85);
  const floatY = useSharedValue(0);
  const shimmerX = useSharedValue(-180);

  useEffect(() => {
    if (!achievement) return;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    cardScale.value = withSequence(
      withTiming(0.92, { duration: 0 }),
      withSpring(1, { damping: 12, stiffness: 180 })
    );
    floatY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    shimmerX.value = withRepeat(
      withTiming(320, { duration: 1800, easing: Easing.out(Easing.quad) }),
      -1,
      false
    );

    const timeoutId = setTimeout(() => {
      clearLastUnlockedAchievement();
    }, AUTO_HIDE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    achievement,
    cardScale,
    clearLastUnlockedAchievement,
    floatY,
    shimmerX,
  ]);

  const popupAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }, { translateY: floatY.value }],
    opacity: achievement ? 1 : 0,
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }, { rotate: '-20deg' }],
  }));

  if (!achievement) return null;

  const topOffset =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { top: topOffset }]}>
      <Animated.View style={[styles.cardShadow, popupAnimatedStyle]}>
        <LinearGradient
          colors={['#FFF8C6', '#FFEBA8', '#FFD77A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Animated.View style={[styles.shimmer, shimmerAnimatedStyle]} />

          <View style={styles.titleRow}>
            <Text style={styles.partyEmoji}>🎉</Text>
            <Text style={styles.title}>New Badge Unlocked!</Text>
            <Text style={styles.partyEmoji}>🌟</Text>
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.iconBubble}>
              <Text style={styles.badgeEmoji}>{achievement.emoji}</Text>
            </View>
            <View style={styles.textColumn}>
              <Text style={styles.badgeTitle}>{achievement.title}</Text>
              <Text style={styles.badgeDescription}>{achievement.description}</Text>
            </View>
          </View>

          <Pressable
            style={styles.ctaButton}
            onPress={clearLastUnlockedAchievement}
          >
            <Text style={styles.ctaText}>Awesome!</Text>
          </Pressable>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: scale(12),
    right: scale(12),
    zIndex: 10001,
    alignItems: 'center',
  },
  cardShadow: {
    width: '100%',
    maxWidth: scale(360),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 10,
  },
  card: {
    borderRadius: scale(22),
    borderWidth: 3,
    borderColor: '#FFFDF2',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: -20,
    left: -80,
    width: 70,
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
  },
  partyEmoji: {
    fontSize: scale(16),
  },
  title: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(18),
    color: Colors.secondary.dark,
    textAlign: 'center',
  },
  badgeRow: {
    marginTop: verticalScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  iconBubble: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 2,
    borderColor: Colors.accent.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: {
    fontSize: scale(26),
  },
  textColumn: {
    flex: 1,
  },
  badgeTitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(16),
    color: Colors.neutral[800],
  },
  badgeDescription: {
    marginTop: verticalScale(2),
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(11),
    color: Colors.neutral[700],
  },
  ctaButton: {
    alignSelf: 'center',
    marginTop: verticalScale(10),
    backgroundColor: Colors.secondary.main,
    borderRadius: scale(16),
    borderBottomWidth: 3,
    borderBottomColor: Colors.secondary.dark,
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(6),
  },
  ctaText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(14),
    color: Colors.white,
  },
});

