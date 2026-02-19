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
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useAppStore, type GameKey } from '@/store/useAppStore';
import {
  MAX_GAME_LEVEL,
  PROGRESSION_THEMES,
  getRequiredStarsForLevel,
} from '@/features/progression/model/progression';
import {
  isSmallHeightDevice,
  isVerySmallHeightDevice,
  scale,
  verticalScale,
} from '@/utils/responsive';

type ProgressJourneyPopupProps = {
  visible: boolean;
  onClose: () => void;
  onStartGame: (game: GameKey) => void;
};

type JourneyGameMeta = {
  game: GameKey;
  title: string;
  emoji: string;
  buttonColor: string;
  routeLabel: string;
};

const GAME_META: JourneyGameMeta[] = [
  {
    game: 'math',
    title: 'Math Rocket',
    emoji: '🚀',
    buttonColor: '#FF6B6B',
    routeLabel: 'Play Math',
  },
  {
    game: 'alphabet',
    title: 'ABC Master',
    emoji: '🔤',
    buttonColor: Colors.secondary.main,
    routeLabel: 'Play ABC',
  },
  {
    game: 'animals',
    title: 'Animal Memory',
    emoji: '🐾',
    buttonColor: Colors.primary.main,
    routeLabel: 'Play Animals',
  },
];

export const ProgressJourneyPopup: React.FC<ProgressJourneyPopupProps> = ({
  visible,
  onClose,
  onStartGame,
}) => {
  const progression = useAppStore((state) => state.progression);
  const setCurrentGameLevel = useAppStore((state) => state.setCurrentGameLevel);
  const isCompact = isSmallHeightDevice;
  const isVeryCompact = isVerySmallHeightDevice;
  const cardHeight = isVeryCompact ? '96%' : isCompact ? '92%' : '88%';
  const cardScale = useSharedValue(0.84);
  const sparkleRotate = useSharedValue(0);
  const theme = useMemo(
    () =>
      PROGRESSION_THEMES.find((item) => item.id === progression.activeThemeId) ??
      PROGRESSION_THEMES[0],
    [progression.activeThemeId]
  );

  useEffect(() => {
    if (!visible) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cardScale.value = withSequence(
      withTiming(0.92, { duration: 0 }),
      withSpring(1, { damping: 9, stiffness: 180 })
    );
    sparkleRotate.value = withRepeat(
      withSequence(
        withTiming(7, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        withTiming(-7, { duration: 1000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [cardScale, sparkleRotate, visible]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotate.value}deg` }],
  }));

  const parentInsights = useMemo(() => {
    const rows = GAME_META.map(({ game, title, emoji }) => {
      const gameState = progression.games[game];
      const totalRounds = gameState.roundsWon + gameState.roundsLost;
      const avgAccuracy =
        totalRounds > 0
          ? Math.round((gameState.totalAccuracy / totalRounds) * 100)
          : 0;
      return {
        game,
        label: `${emoji} ${title}`,
        avgAccuracy,
        rounds: totalRounds,
      };
    });

    const sorted = [...rows].sort((a, b) => b.avgAccuracy - a.avgAccuracy);
    return {
      strongest: sorted[0],
      needsPractice: sorted[sorted.length - 1],
      totalRounds: rows.reduce((sum, row) => sum + row.rounds, 0),
    };
  }, [progression.games]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View
        style={[
          styles.cardWrap,
          { height: cardHeight },
          cardAnimatedStyle,
        ]}
      >
          <LinearGradient
            colors={['#E7F8FF', '#FFF2C7', '#FFE6F5']}
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
              style={styles.verticalScroll}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              directionalLockEnabled
              bounces={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={[styles.title, isCompact && styles.titleCompact]}>
                Journey Map
              </Text>
              <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>
                Pick levels, win stars, and unlock colorful worlds!
              </Text>

              <View style={styles.themeChip}>
                <Text style={styles.themeChipText}>
                  Theme: {theme.icon} {theme.name}
                </Text>
              </View>

              {GAME_META.map((meta) => {
                const gameState = progression.games[meta.game];
                const unlockedLevel = gameState.unlockedLevel;
                const currentLevel = gameState.currentLevel;
                const nextUnlockLevel =
                  unlockedLevel >= MAX_GAME_LEVEL ? null : unlockedLevel + 1;
                const starsNeeded = nextUnlockLevel
                  ? Math.max(
                    0,
                    getRequiredStarsForLevel(nextUnlockLevel) - gameState.totalStars
                  )
                  : 0;

                return (
                  <View key={meta.game} style={styles.gameSection}>
                    <View style={styles.gameHeader}>
                      <Text style={styles.gameTitle}>
                        {meta.emoji} {meta.title}
                      </Text>
                      <Text style={styles.gameMeta}>
                        Stars {gameState.totalStars} · Current L{currentLevel}
                      </Text>
                    </View>

                    <ScrollView
                      horizontal
                      nestedScrollEnabled
                      directionalLockEnabled
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.levelRow}
                    >
                      {gameState.levels.map((levelState) => {
                        const isLocked = levelState.level > unlockedLevel;
                        const isCurrent = levelState.level === currentLevel;
                        const isComplete = levelState.completed;

                        return (
                          <Pressable
                            key={`${meta.game}-${levelState.level}`}
                            disabled={isLocked}
                            onPress={() => {
                              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setCurrentGameLevel(meta.game, levelState.level);
                            }}
                            style={[
                              styles.levelNode,
                              isLocked && styles.levelNodeLocked,
                              isComplete && styles.levelNodeComplete,
                              isCurrent && styles.levelNodeCurrent,
                            ]}
                          >
                            <Text style={styles.levelLabel}>L{levelState.level}</Text>
                            <Text style={styles.levelStars}>⭐{levelState.stars}</Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>

                    <View style={styles.gameFooter}>
                      <Text style={styles.unlockText}>
                        {nextUnlockLevel
                          ? `${starsNeeded} star(s) to unlock L${nextUnlockLevel}`
                          : 'All levels unlocked 🎉'}
                      </Text>
                      <Pressable
                        style={[styles.playButton, { backgroundColor: meta.buttonColor }]}
                        onPress={() => onStartGame(meta.game)}
                      >
                        <Text style={styles.playButtonText}>{meta.routeLabel}</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}

              <View style={styles.dailyGoalCard}>
                <Text style={styles.dailyGoalTitle}>🎯 Daily Goal + Streak</Text>
                <Text style={styles.dailyGoalText}>
                  {progression.dailyGoal.earnedStars}/{progression.dailyGoal.targetStars} stars today
                </Text>
                <Text style={styles.dailyGoalText}>
                  🔥 Streak {progression.streak.current} days · Best {progression.streak.best}
                </Text>
                <Text style={styles.dailyGoalText}>
                  Shield {progression.streak.shieldAvailable ? 'Ready 🛡️' : 'Used'}
                </Text>
              </View>

              <View style={styles.parentCard}>
                <Text style={styles.parentTitle}>👨‍👩‍👧 Parent Snapshot</Text>
                <Text style={styles.parentText}>
                  Total rounds played: {parentInsights.totalRounds}
                </Text>
                <Text style={styles.parentText}>
                  Strongest: {parentInsights.strongest.label} ({parentInsights.strongest.avgAccuracy}%)
                </Text>
                <Text style={styles.parentText}>
                  Needs practice: {parentInsights.needsPractice.label} ({parentInsights.needsPractice.avgAccuracy}%)
                </Text>
              </View>
            </ScrollView>

            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Let’s Play!</Text>
            </Pressable>
          </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 34, 72, 0.54)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    zIndex: 210,
  },
  cardWrap: {
    width: '100%',
    maxWidth: scale(390),
    maxHeight: '96%',
  },
  card: {
    flex: 1,
    borderRadius: scale(30),
    borderWidth: 4,
    borderColor: Colors.white,
    paddingHorizontal: scale(12),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(10),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 11,
  },
  cardCompact: {
    borderRadius: scale(24),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(8),
  },
  cardVeryCompact: {
    maxHeight: '100%',
  },
  verticalScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: verticalScale(6),
    gap: verticalScale(8),
  },
  sparkle: {
    position: 'absolute',
    top: verticalScale(8),
  },
  sparkleLeft: {
    left: scale(8),
  },
  sparkleRight: {
    right: scale(8),
  },
  sparkleText: {
    fontSize: scale(18),
  },
  title: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(30),
    color: Colors.secondary.dark,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: scale(25),
  },
  subtitle: {
    marginTop: verticalScale(2),
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(12),
    color: Colors.fun.purple,
    textAlign: 'center',
  },
  subtitleCompact: {
    fontSize: scale(11),
  },
  themeChip: {
    alignSelf: 'center',
    marginTop: verticalScale(2),
    borderRadius: scale(14),
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
  },
  themeChipText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(11),
    color: Colors.neutral[700],
  },
  gameSection: {
    borderRadius: scale(16),
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: scale(9),
    paddingVertical: verticalScale(8),
    gap: verticalScale(6),
  },
  gameHeader: {
    gap: verticalScale(1),
  },
  gameTitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(16),
    color: Colors.neutral[800],
  },
  gameMeta: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(10),
    color: Colors.neutral[600],
  },
  levelRow: {
    gap: scale(6),
    paddingVertical: verticalScale(2),
  },
  levelNode: {
    width: scale(58),
    height: scale(58),
    borderRadius: scale(16),
    backgroundColor: '#8BD0FF',
    borderWidth: 2,
    borderColor: '#56A7E6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: verticalScale(4),
  },
  levelNodeLocked: {
    backgroundColor: '#D7D7D7',
    borderColor: '#B7B7B7',
    opacity: 0.8,
  },
  levelNodeComplete: {
    backgroundColor: '#FFE58A',
    borderColor: '#F5C84A',
  },
  levelNodeCurrent: {
    borderColor: '#FF6B9D',
    borderWidth: 3,
  },
  levelLabel: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(12),
    color: Colors.neutral[800],
  },
  levelStars: {
    marginTop: verticalScale(1),
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(10),
    color: Colors.neutral[700],
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: scale(8),
  },
  unlockText: {
    flex: 1,
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(10),
    color: Colors.neutral[600],
  },
  playButton: {
    borderRadius: scale(14),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(7),
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(0,0,0,0.24)',
  },
  playButtonText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(11),
    color: Colors.white,
  },
  dailyGoalCard: {
    borderRadius: scale(16),
    backgroundColor: 'rgba(249,225,4,0.18)',
    borderWidth: 2,
    borderColor: Colors.accent.main,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(7),
    gap: verticalScale(2),
  },
  dailyGoalTitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(14),
    color: Colors.secondary.dark,
  },
  dailyGoalText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(11),
    color: Colors.neutral[700],
  },
  parentCard: {
    borderRadius: scale(16),
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(8),
    gap: verticalScale(2),
  },
  parentTitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(14),
    color: Colors.fun.purple,
  },
  parentText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(11),
    color: Colors.neutral[700],
  },
  closeButton: {
    alignSelf: 'center',
    marginTop: verticalScale(8),
    borderRadius: scale(16),
    backgroundColor: Colors.candy.pink,
    borderBottomWidth: 3,
    borderBottomColor: '#D95D89',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(7),
  },
  closeButtonText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(14),
    color: Colors.white,
  },
});
