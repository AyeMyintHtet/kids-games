import React, { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
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
import { ACHIEVEMENTS } from '@/features/achievements/model/achievements';
import { useAppStore } from '@/store/useAppStore';
import {
  isSmallHeightDevice,
  isVerySmallHeightDevice,
  scale,
  verticalScale,
} from '@/utils/responsive';

type AchievementsPopupProps = {
  visible: boolean;
  onClose: () => void;
};

export const AchievementsPopup: React.FC<AchievementsPopupProps> = ({
  visible,
  onClose,
}) => {
  const unlocked = useAppStore((state) => state.achievements.unlocked);
  const unlockedSet = new Set(unlocked);
  const isCompact = isSmallHeightDevice;
  const isVeryCompact = isVerySmallHeightDevice;

  const jellyScaleX = useSharedValue(1);
  const jellyScaleY = useSharedValue(1);
  const sparkleRotate = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    jellyScaleX.value = withSequence(
      withTiming(1.2, { duration: 100 }),
      withTiming(0.86, { duration: 100 }),
      withTiming(1.06, { duration: 90 }),
      withSpring(1, { damping: 8, stiffness: 170 })
    );
    jellyScaleY.value = withSequence(
      withTiming(0.85, { duration: 100 }),
      withTiming(1.14, { duration: 100 }),
      withTiming(0.97, { duration: 90 }),
      withSpring(1, { damping: 8, stiffness: 170 })
    );
    sparkleRotate.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(-8, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [visible, jellyScaleX, jellyScaleY, sparkleRotate]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: jellyScaleX.value }, { scaleY: jellyScaleY.value }],
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotate.value}deg` }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <TouchableWithoutFeedback>
        <Animated.View style={[styles.cardWrap, cardAnimatedStyle]}>
          <LinearGradient
            colors={['#FEEFE5', '#FFE8FA', '#E8F5FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.card,
              isCompact && styles.cardCompact,
              isVeryCompact && styles.cardVeryCompact,
            ]}
          >
            <Animated.View style={[styles.sparkle, styles.sparkleLeft, sparkleAnimatedStyle]}>
              <Text style={styles.sparkleText}>✨</Text>
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkleRight, sparkleAnimatedStyle]}>
              <Text style={styles.sparkleText}>🌟</Text>
            </Animated.View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              bounces={false}
            >
              <Text style={[styles.title, isCompact && styles.titleCompact]}>
                My Achievement Badges
              </Text>
              <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>
                Tap games and collect all badges!
              </Text>

              <View style={styles.badgesColumn}>
                {ACHIEVEMENTS.map((achievement) => {
                  const isUnlocked = unlockedSet.has(achievement.id);
                  return (
                    <View
                      key={achievement.id}
                      style={[
                        styles.badgeRow,
                        isUnlocked ? styles.badgeRowUnlocked : styles.badgeRowLocked,
                      ]}
                    >
                      <View style={styles.badgeIconWrap}>
                        <Text style={styles.badgeIcon}>
                          {isUnlocked ? achievement.emoji : '🔒'}
                        </Text>
                      </View>
                      <View style={styles.badgeTextWrap}>
                        <Text style={styles.badgeTitle}>{achievement.title}</Text>
                        <Text style={styles.badgeDesc}>{achievement.description}</Text>
                      </View>
                      <Text
                        style={[
                          styles.statusPill,
                          isUnlocked ? styles.statusPillOn : styles.statusPillOff,
                        ]}
                      >
                        {isUnlocked ? 'Done' : 'Locked'}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <Text style={styles.progressText}>
                {unlocked.length}/{ACHIEVEMENTS.length} badges unlocked
              </Text>
            </ScrollView>

            <Pressable style={[styles.closeButton, isCompact && styles.closeButtonCompact]} onPress={onClose}>
              <Text style={styles.closeText}>Yay!</Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 26, 64, 0.46)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    zIndex: 200,
  },
  cardWrap: {
    width: '100%',
    maxWidth: scale(380),
    maxHeight: '88%',
  },
  card: {
    borderRadius: scale(30),
    borderWidth: 4,
    borderColor: Colors.white,
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(14),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
  },
  cardCompact: {
    borderRadius: scale(24),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(10),
  },
  cardVeryCompact: {
    maxHeight: '94%',
  },
  scrollContent: {
    paddingBottom: verticalScale(6),
  },
  sparkle: {
    position: 'absolute',
    top: verticalScale(8),
  },
  sparkleLeft: {
    left: scale(10),
  },
  sparkleRight: {
    right: scale(10),
  },
  sparkleText: {
    fontSize: scale(20),
  },
  title: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(28),
    color: Colors.secondary.dark,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: scale(24),
  },
  subtitle: {
    marginTop: verticalScale(4),
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(14),
    color: Colors.fun.purple,
    textAlign: 'center',
  },
  subtitleCompact: {
    fontSize: scale(12),
  },
  badgesColumn: {
    marginTop: verticalScale(12),
    gap: verticalScale(8),
  },
  badgeRow: {
    borderRadius: scale(16),
    borderWidth: 2,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  badgeRowUnlocked: {
    backgroundColor: 'rgba(249, 225, 4, 0.18)',
    borderColor: Colors.accent.main,
  },
  badgeRowLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
    borderColor: Colors.neutral[300],
  },
  badgeIconWrap: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral[200],
  },
  badgeIcon: {
    fontSize: scale(22),
  },
  badgeTextWrap: {
    flex: 1,
  },
  badgeTitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(15),
    color: Colors.neutral[800],
  },
  badgeDesc: {
    marginTop: verticalScale(1),
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(10),
    color: Colors.neutral[600],
  },
  statusPill: {
    minWidth: scale(52),
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(4),
    borderRadius: scale(10),
    textAlign: 'center',
    overflow: 'hidden',
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(10),
  },
  statusPillOn: {
    backgroundColor: Colors.primary.main,
    color: Colors.white,
  },
  statusPillOff: {
    backgroundColor: Colors.neutral[300],
    color: Colors.neutral[600],
  },
  progressText: {
    marginTop: verticalScale(10),
    textAlign: 'center',
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(12),
    color: Colors.secondary.dark,
  },
  closeButton: {
    alignSelf: 'center',
    marginTop: verticalScale(10),
    backgroundColor: Colors.candy.pink,
    borderRadius: scale(16),
    borderBottomWidth: 3,
    borderBottomColor: '#D95D89',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(6),
  },
  closeButtonCompact: {
    marginTop: verticalScale(6),
  },
  closeText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(14),
    color: Colors.white,
  },
});
