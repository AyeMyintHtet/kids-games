import React, { useEffect, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import type { RoundSummary } from '@/store/useAppStore';
import {
  isSmallHeightDevice,
  isVerySmallHeightDevice,
  scale,
  verticalScale,
} from '@/utils/responsive';

type RoundResultPopupProps = {
  visible: boolean;
  summary: RoundSummary | null;
  gameTitle: string;
  onPlayAgain: () => void;
  onPlayNext: () => void;
  onBackHome: () => void;
  onTryRecovery?: (level: number) => void;
};

export const RoundResultPopup: React.FC<RoundResultPopupProps> = ({
  visible,
  summary,
  gameTitle,
  onPlayAgain,
  onPlayNext,
  onBackHome,
  onTryRecovery,
}) => {
  const isCompact = isSmallHeightDevice;
  const isVeryCompact = isVerySmallHeightDevice;
  const cardScale = useSharedValue(0.86);
  const badgeScale = useSharedValue(0.7);
  const starPulse = useSharedValue(1);

  useEffect(() => {
    if (!visible || !summary) return;

    cardScale.value = withSequence(
      withTiming(0.92, { duration: 0 }),
      withSpring(1, { damping: 10, stiffness: 170 })
    );
    badgeScale.value = withDelay(
      160,
      withSequence(
        withTiming(1.15, { duration: 220, easing: Easing.out(Easing.cubic) }),
        withSpring(1, { damping: 8, stiffness: 140 })
      )
    );
    starPulse.value = withSequence(
      withDelay(220, withTiming(1.14, { duration: 260 })),
      withTiming(1, { duration: 240 })
    );
  }, [badgeScale, cardScale, starPulse, summary, visible]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const starsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starPulse.value }],
  }));

  const displayTitle = useMemo(() => {
    if (!summary) return 'Round Complete!';
    if (summary.outcome === 'won') return 'Awesome Round!';
    if (summary.outcome === 'lost') return 'Great Try!';
    return 'Round Ended!';
  }, [summary]);

  if (!visible || !summary) return null;

  const progressPercent = Math.round(summary.levelUnlockProgress * 100);
  const nextUnlockLevel =
    summary.unlockedLevel >= 20 ? null : summary.unlockedLevel + 1;
  const canPlayNext = summary.outcome === 'won' && summary.nextLevel !== null;

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.cardWrap, cardAnimatedStyle]}>
        <LinearGradient
          colors={['#FFF6CC', '#FFE6F4', '#DFF4FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, isCompact && styles.cardCompact]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              isCompact && styles.contentCompact,
            ]}
            bounces={false}
          >
            <Animated.View style={[styles.headerBadge, badgeAnimatedStyle]}>
              <Text style={styles.headerBadgeText}>{gameTitle}</Text>
            </Animated.View>

            <Text style={[styles.title, isCompact && styles.titleCompact]}>
              {displayTitle}
            </Text>

            <Animated.View style={[styles.starsRow, starsAnimatedStyle]}>
              {[0, 1, 2].map((index) => (
                <Text key={index} style={styles.starEmoji}>
                  {index < summary.starsEarned ? '⭐' : '☆'}
                </Text>
              ))}
            </Animated.View>

            <Text style={styles.scoreText}>
              Score {summary.score} · Accuracy {Math.round(summary.accuracy * 100)}%
            </Text>
            {summary.timeMs !== null && (
              <Text style={styles.metaText}>
                Time {Math.max(1, Math.round(summary.timeMs / 1000))}s · Level {summary.level}
              </Text>
            )}

            <View style={styles.criteriaRow}>
              <View style={styles.criteriaChip}>
                <Text style={styles.criteriaText}>
                  Accuracy {summary.breakdown.accuracyStar ? '✅' : '❌'}
                </Text>
              </View>
              <View style={styles.criteriaChip}>
                <Text style={styles.criteriaText}>
                  Speed {summary.breakdown.speedStar ? '✅' : '❌'}
                </Text>
              </View>
              <View style={styles.criteriaChip}>
                <Text style={styles.criteriaText}>
                  No Hint {summary.breakdown.noHintStar ? '✅' : '❌'}
                </Text>
              </View>
            </View>

            {summary.recovery.effortStarAwarded && (
              <Text style={styles.effortText}>💪 Effort Star earned for trying!</Text>
            )}

            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>
                Stars in this game: {summary.totalStarsForGame}
              </Text>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.max(8, progressPercent)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressHint}>
                {nextUnlockLevel
                  ? `Unlock L${nextUnlockLevel}: ${progressPercent}%`
                  : 'All levels unlocked!'}
              </Text>
            </View>

            <View style={styles.goalRow}>
              <Text style={styles.goalText}>
                🎯 Daily Goal: {summary.dailyGoal.earnedStars}/{summary.dailyGoal.targetStars} stars
              </Text>
              <Text style={styles.goalText}>
                🔥 Streak: {summary.streak.current} {summary.streak.shieldAvailable ? '🛡️' : ''}
              </Text>
            </View>

            {summary.milestone && (
              <View style={styles.milestoneCard}>
                <Text style={styles.milestoneTitle}>
                  {summary.milestone.sticker} Milestone L{summary.milestone.level}!
                </Text>
                <Text style={styles.milestoneText}>
                  New Theme: {summary.milestone.themeName} {summary.milestone.icon}
                </Text>
              </View>
            )}

            <View style={[styles.buttonsColumn, isVeryCompact && styles.buttonsColumnCompact]}>
              {canPlayNext && (
                <Pressable style={styles.primaryButton} onPress={onPlayNext}>
                  <Text style={styles.primaryButtonText}>Play Next Level</Text>
                </Pressable>
              )}

              <Pressable style={styles.secondaryButton} onPress={onPlayAgain}>
                <Text style={styles.secondaryButtonText}>Play Again</Text>
              </Pressable>

              {summary.recovery.suggestedLevel !== null && onTryRecovery && (
                <Pressable
                  style={styles.recoveryButton}
                  onPress={() => onTryRecovery(summary.recovery.suggestedLevel as number)}
                >
                  <Text style={styles.recoveryButtonText}>
                    Helper Mode (L{summary.recovery.suggestedLevel})
                  </Text>
                </Pressable>
              )}

              <Pressable style={styles.ghostButton} onPress={onBackHome}>
                <Text style={styles.ghostButtonText}>Back Home</Text>
              </Pressable>
            </View>
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22, 39, 86, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    zIndex: 1000,
  },
  cardWrap: {
    width: '100%',
    maxWidth: scale(380),
    maxHeight: '92%',
  },
  card: {
    borderRadius: scale(26),
    borderWidth: 4,
    borderColor: Colors.white,
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  cardCompact: {
    borderRadius: scale(22),
    paddingVertical: verticalScale(10),
  },
  content: {
    paddingBottom: verticalScale(4),
    gap: verticalScale(8),
  },
  contentCompact: {
    gap: verticalScale(6),
  },
  headerBadge: {
    alignSelf: 'center',
    borderRadius: scale(16),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(5),
    backgroundColor: Colors.secondary.main,
    borderBottomWidth: 3,
    borderBottomColor: Colors.secondary.dark,
  },
  headerBadgeText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(14),
    color: Colors.white,
  },
  title: {
    marginTop: verticalScale(4),
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(28),
    color: Colors.fun.purple,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: scale(24),
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(8),
  },
  starEmoji: {
    fontSize: scale(34),
  },
  scoreText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(16),
    color: Colors.neutral[800],
    textAlign: 'center',
  },
  metaText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(12),
    color: Colors.neutral[600],
    textAlign: 'center',
    marginTop: verticalScale(-2),
  },
  criteriaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: scale(6),
  },
  criteriaChip: {
    borderRadius: scale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
  },
  criteriaText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(11),
    color: Colors.neutral[700],
  },
  effortText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(12),
    color: Colors.secondary.dark,
    textAlign: 'center',
  },
  progressCard: {
    borderRadius: scale(16),
    backgroundColor: 'rgba(255,255,255,0.78)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(8),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  progressTitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(12),
    color: Colors.neutral[700],
  },
  progressBarTrack: {
    marginTop: verticalScale(6),
    width: '100%',
    height: verticalScale(10),
    borderRadius: verticalScale(6),
    backgroundColor: '#E5EEF9',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: verticalScale(6),
    backgroundColor: Colors.accent.main,
  },
  progressHint: {
    marginTop: verticalScale(5),
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(11),
    color: Colors.secondary.dark,
  },
  goalRow: {
    borderRadius: scale(14),
    backgroundColor: 'rgba(255,255,255,0.82)',
    paddingHorizontal: scale(9),
    paddingVertical: verticalScale(6),
    gap: verticalScale(2),
  },
  goalText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(11),
    color: Colors.neutral[700],
    textAlign: 'center',
  },
  milestoneCard: {
    borderRadius: scale(16),
    borderWidth: 2,
    borderColor: Colors.accent.main,
    backgroundColor: 'rgba(249, 225, 4, 0.24)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(7),
    alignItems: 'center',
  },
  milestoneTitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(14),
    color: Colors.secondary.dark,
  },
  milestoneText: {
    marginTop: verticalScale(2),
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(11),
    color: Colors.neutral[700],
  },
  buttonsColumn: {
    marginTop: verticalScale(4),
    gap: verticalScale(7),
  },
  buttonsColumnCompact: {
    gap: verticalScale(6),
  },
  primaryButton: {
    borderRadius: scale(16),
    backgroundColor: Colors.primary.main,
    paddingVertical: verticalScale(11),
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: Colors.primary.dark,
  },
  primaryButtonText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(16),
    color: Colors.white,
  },
  secondaryButton: {
    borderRadius: scale(16),
    backgroundColor: Colors.secondary.main,
    paddingVertical: verticalScale(10),
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: Colors.secondary.dark,
  },
  secondaryButtonText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(15),
    color: Colors.white,
  },
  recoveryButton: {
    borderRadius: scale(16),
    backgroundColor: '#FFB347',
    paddingVertical: verticalScale(10),
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#DE8E2A',
  },
  recoveryButtonText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(14),
    color: Colors.white,
  },
  ghostButton: {
    borderRadius: scale(16),
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingVertical: verticalScale(9),
    alignItems: 'center',
  },
  ghostButtonText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(14),
    color: Colors.secondary.dark,
  },
});

