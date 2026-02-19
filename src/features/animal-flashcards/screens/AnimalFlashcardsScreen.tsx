import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useCloudTransition } from '@/hooks/useCloudTransition';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { ScoreBadge } from '@/components/ScoreBadge';
import { GameCountdown } from '@/components/GameCountdown';
import { CelebrationEffect } from '@/components/CelebrationEffect';
import { RoundResultPopup } from '@/components/RoundResultPopup';
import { useAppStore, type RoundSummary } from '@/store/useAppStore';
import {
  isSmallHeightDevice,
  isVerySmallHeightDevice,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  scale,
  verticalScale,
} from '@/utils/responsive';
import {
  buildDeck,
  type AnimalCard,
  type GamePhase,
  type Level,
  type RoundResult,
} from '@/features/animal-flashcards/model/memory';
import {
  applyScoreFormula,
  getComboBonus,
  getSpeedBonus,
  toAccuracy,
} from '@/features/score/model/scoring';
import { getAnimalLevelConfig } from '@/features/progression/model/progression';

const CORRECT_SOUND = require('@/assets/sounds/correct.mp3');
const WRONG_SOUND = require('@/assets/sounds/wrong.mp3');
const WIN_SOUND = require('@/assets/sounds/bravo.mp3');
const LOSS_SOUND = require('@/assets/sounds/wrong.mp3');

type AquariumBubbleProps = {
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
};

const AquariumBubble = ({ left, top, size, delay, duration }: AquariumBubbleProps) => {
  const y = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-verticalScale(22), { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, [delay, duration, y]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          left,
          top,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
};

type MemoryCardProps = {
  card: AnimalCard;
  disabled: boolean;
  onPress: (card: AnimalCard) => void;
  cardWidth: number;
  cardHeight: number;
};

const MemoryCard = ({ card, disabled, onPress, cardWidth, cardHeight }: MemoryCardProps) => {
  const flipProgress = useSharedValue(card.isFlipped || card.isMatched ? 1 : 0);
  const scaleValue = useSharedValue(1);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    flipProgress.value = withTiming(card.isFlipped || card.isMatched ? 1 : 0, {
      duration: 340,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [card.isFlipped, card.isMatched, flipProgress]);

  useEffect(() => {
    if (!card.isMatched) return;
    scaleValue.value = withSequence(
      withSpring(1.08, { damping: 9, stiffness: 220 }),
      withSpring(1, { damping: 11, stiffness: 200 })
    );
  }, [card.isMatched, scaleValue]);

  useEffect(() => {
    if (card.shakeTick === 0) return;
    shakeX.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 45 }),
      withTiming(6, { duration: 45 }),
      withTiming(0, { duration: 45 })
    );
  }, [card.shakeTick, shakeX]);

  const shellAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateY: `${flipProgress.value * 180}deg` },
      { scale: scaleValue.value },
      { translateX: shakeX.value },
    ],
  }));

  const backFaceAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flipProgress.value, [0, 0.45, 1], [1, 0, 0]),
  }));

  const frontFaceAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flipProgress.value, [0, 0.55, 1], [0, 0, 1]),
  }));

  return (
    <Pressable
      disabled={disabled || card.isMatched || card.isFlipped}
      onPress={() => onPress(card)}
      style={[styles.cardPressable, { width: cardWidth, height: cardHeight }]}
    >
      <Animated.View style={[styles.cardShell, shellAnimatedStyle]}>
        <Animated.View style={[styles.cardFace, backFaceAnimatedStyle, { borderRadius: cardWidth * 0.18 }]}>
          <LinearGradient
            colors={['#2D8EEB', '#4EC4FF']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={[styles.cardBackGradient, { borderRadius: cardWidth * 0.18 }]}
          >
            <Text style={[styles.cardBackIcon, { fontSize: cardWidth * 0.3 }]}>🐠</Text>
            <Text style={[styles.cardBackQuestion, { fontSize: cardWidth * 0.26 }]}>?</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.cardFace, styles.cardFront, frontFaceAnimatedStyle, { backgroundColor: card.cardColor, borderRadius: cardWidth * 0.18 }]}>
          {card.imageSource ? (
            <Image
              source={card.imageSource}
              style={{ width: cardWidth * 0.72, height: cardHeight * 0.5 }}
              contentFit="contain"
            />
          ) : (
            <Text style={[styles.cardAnimalEmoji, { fontSize: cardWidth * 0.34 }]}>{card.emoji}</Text>
          )}
          <Text style={[styles.cardAnimalName, { fontSize: Math.max(11, cardWidth * 0.16) }]}>{card.name}</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

export const AnimalFlashcardsScreen = () => {
  const { goBack } = useCloudTransition();
  const addScore = useAppStore((state) => state.addScore);
  const recordGameResult = useAppStore((state) => state.recordGameResult);
  const currentLevel = useAppStore((state) => state.progression.games.animals.currentLevel);
  const unlockedLevel = useAppStore((state) => state.progression.games.animals.unlockedLevel);
  const totalAnimalStars = useAppStore((state) => state.progression.games.animals.totalStars);
  const setCurrentGameLevel = useAppStore((state) => state.setCurrentGameLevel);
  const activateRecoveryMode = useAppStore((state) => state.activateRecoveryMode);
  const activeLevel = useMemo(() => getAnimalLevelConfig(currentLevel), [currentLevel]);
  const difficultyBand = activeLevel.band as Level;
  const isCompact = isSmallHeightDevice;
  const isVeryCompact = isVerySmallHeightDevice;
  const boardHeight = isVeryCompact
    ? SCREEN_HEIGHT * 0.36
    : isCompact
      ? SCREEN_HEIGHT * 0.43
      : verticalScale(410);
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [cards, setCards] = useState<AnimalCard[]>(() =>
    buildDeck(difficultyBand, activeLevel.pairs)
  );
  const [openedCardIds, setOpenedCardIds] = useState<string[]>([]);
  const [isResolvingPair, setIsResolvingPair] = useState(false);
  const [moves, setMoves] = useState(0);
  const [lives, setLives] = useState(activeLevel.lives);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [remainingTime, setRemainingTime] = useState(activeLevel.durationSeconds);
  const [roundStartedAt, setRoundStartedAt] = useState<number | null>(null);
  const [firstCardOpenedAt, setFirstCardOpenedAt] = useState<number | null>(null);
  const [result, setResult] = useState<RoundResult>('none');
  const [feedbackLabel, setFeedbackLabel] = useState('Find the same animals!');
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);
  const [roundSummary, setRoundSummary] = useState<RoundSummary | null>(null);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const wrongFlashOpacity = useSharedValue(0);
  const winBonusAwardedRef = useRef(false);
  const resultRecordedRef = useRef(false);
  const roundScoreRef = useRef(0);
  const bestStreakRef = useRef(0);
  const [boardLayout, setBoardLayout] = useState({
    width: SCREEN_WIDTH - scale(20),
    height: boardHeight,
  });

  const matchedPairs = useMemo(() => cards.filter((card) => card.isMatched).length / 2, [cards]);
  const totalCards = activeLevel.pairs * 2;
  const totalRows = Math.ceil(totalCards / activeLevel.columns);

  const totalPairs = activeLevel.pairs;
  const gridGap = useMemo(
    () => scale(activeLevel.columns === 4 ? 4 : 8),
    [activeLevel.columns]
  );
  const gridHorizontalPadding = useMemo(
    () => scale(activeLevel.columns >= 4 ? 6 : 12),
    [activeLevel.columns]
  );
  const gridVerticalPadding = useMemo(
    () => scale(activeLevel.columns >= 4 ? 8 : 12),
    [activeLevel.columns]
  );
  const cardWidth = useMemo(
    () => {
      const ratio = activeLevel.columns >= 4 ? 1.02 : 1.1;
      const widthSpace =
        (boardLayout.width - gridHorizontalPadding * 2 - gridGap * (activeLevel.columns - 1)) /
        activeLevel.columns;
      const heightPerCard =
        (boardLayout.height - gridVerticalPadding * 2 - gridGap * (totalRows - 1)) / totalRows;
      const maxWidthFromHeight = heightPerCard / ratio;
      return Math.floor(Math.max(42, Math.min(widthSpace, maxWidthFromHeight)));
    },
    [
      activeLevel.columns,
      boardLayout.height,
      boardLayout.width,
      gridGap,
      gridHorizontalPadding,
      gridVerticalPadding,
      totalRows,
    ]
  );
  const cardHeight = useMemo(() => {
    const ratio = activeLevel.columns >= 4 ? 1.02 : 1.1;
    return Math.floor(cardWidth * ratio);
  }, [activeLevel.columns, cardWidth]);

  const bubbleConfig = useMemo(
    () => [
      { left: scale(20), top: verticalScale(150), size: scale(16), delay: 0, duration: 1600 },
      { left: scale(65), top: verticalScale(240), size: scale(12), delay: 700, duration: 1800 },
      { left: scale(285), top: verticalScale(170), size: scale(18), delay: 400, duration: 2000 },
      { left: scale(325), top: verticalScale(280), size: scale(14), delay: 1200, duration: 2100 },
      { left: scale(130), top: verticalScale(110), size: scale(10), delay: 900, duration: 1900 },
    ],
    []
  );
  const activeBubbles = isVeryCompact ? bubbleConfig.slice(0, 3) : bubbleConfig;

  const addRoundScore = useCallback(
    (points: number) => {
      const safePoints = Math.max(0, Math.round(points));
      if (safePoints <= 0) return;
      roundScoreRef.current += safePoints;
      setRoundScore(roundScoreRef.current);
      addScore('animals', safePoints);
    },
    [addScore]
  );

  const cleanupSound = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    } catch {
      soundRef.current = null;
    }
  }, []);

  const playSound = useCallback(
    async (source: number) => {
      try {
        await cleanupSound();
        const { sound } = await Audio.Sound.createAsync(source);
        soundRef.current = sound;
        await sound.playAsync();
      } catch {
        // Audio failures should never block gameplay.
      }
    },
    [cleanupSound]
  );

  useEffect(() => {
    return () => {
      cleanupSound();
    };
  }, [cleanupSound]);

  useEffect(() => {
    if (phase !== 'playing' || result !== 'none') return;
    if (remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime((previous) => Math.max(previous - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, result, remainingTime]);

  useEffect(() => {
    if (phase !== 'playing' || result !== 'none') return;

    if (matchedPairs === totalPairs) {
      setResult('won');
      setFeedbackLabel('Amazing memory!');
      setCelebrationTrigger((previous) => previous + 1);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void playSound(WIN_SOUND);

      if (!winBonusAwardedRef.current) {
        const elapsedRoundMs = Math.max(0, (activeLevel.durationSeconds - remainingTime) * 1000);
        const completionSpeedBonus = getSpeedBonus(
          elapsedRoundMs,
          {
            fastMs: Math.floor(activeLevel.durationSeconds * 400),
            mediumMs: Math.floor(activeLevel.durationSeconds * 750),
            fastBonus: 10,
            mediumBonus: 5,
            slowBonus: 0,
          }
        );
        const completionBonus = applyScoreFormula({
          basePoints: activeLevel.completionBonus,
          speedBonus: completionSpeedBonus,
          comboBonus: getComboBonus(bestStreakRef.current, {
            startAt: 3,
            maxBonus: 6,
          }),
          difficulty: difficultyBand,
        });
        addRoundScore(completionBonus);
        winBonusAwardedRef.current = true;
      }

      if (!resultRecordedRef.current) {
        resultRecordedRef.current = true;
        const summary = recordGameResult({
          game: 'animals',
          score: roundScoreRef.current,
          timeMs: roundStartedAt ? Date.now() - roundStartedAt : null,
          accuracy: toAccuracy(matchedPairs, Math.max(0, moves - matchedPairs)),
          streak: bestStreakRef.current,
          level: currentLevel,
          hintsUsed: moves > matchedPairs,
          outcome: 'won',
        });
        setRoundSummary(summary);
        setShowRoundResult(true);
      }
      return;
    }

    if (lives === 0 || remainingTime === 0) {
      setResult('lost');
      setFeedbackLabel(remainingTime === 0 ? "Time's up! Try again!" : 'Try again. You can do it!');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      void playSound(LOSS_SOUND);
      if (!resultRecordedRef.current) {
        resultRecordedRef.current = true;
        const summary = recordGameResult({
          game: 'animals',
          score: roundScoreRef.current,
          timeMs: roundStartedAt ? Date.now() - roundStartedAt : null,
          accuracy: toAccuracy(matchedPairs, Math.max(0, moves - matchedPairs)),
          streak: bestStreakRef.current,
          level: currentLevel,
          hintsUsed: true,
          outcome: 'lost',
        });
        setRoundSummary(summary);
        setShowRoundResult(true);
      }
    }
  }, [
    addRoundScore,
    activeLevel.completionBonus,
    activeLevel.durationSeconds,
    currentLevel,
    difficultyBand,
    phase,
    result,
    matchedPairs,
    totalPairs,
    lives,
    moves,
    remainingTime,
    playSound,
    recordGameResult,
    roundStartedAt,
  ]);

  const wrongFlashAnimatedStyle = useAnimatedStyle(() => ({
    opacity: wrongFlashOpacity.value,
  }));

  const handleCountdownComplete = useCallback(() => {
    setRoundStartedAt(Date.now());
    setFirstCardOpenedAt(null);
    resultRecordedRef.current = false;
    setPhase('playing');
  }, []);

  const startNewGame = useCallback((nextProgressLevel?: number) => {
    const selectedProgressLevel = nextProgressLevel ?? currentLevel;
    const config = getAnimalLevelConfig(selectedProgressLevel);
    const nextDifficultyBand = config.band as Level;

    if (nextProgressLevel && nextProgressLevel !== currentLevel) {
      setCurrentGameLevel('animals', nextProgressLevel);
    }

    setCards(buildDeck(nextDifficultyBand, config.pairs));
    setOpenedCardIds([]);
    setIsResolvingPair(false);
    setMoves(0);
    setLives(config.lives);
    setStreak(0);
    setBestStreak(0);
    setRoundScore(0);
    setRemainingTime(config.durationSeconds);
    setRoundStartedAt(null);
    setFirstCardOpenedAt(null);
    setResult('none');
    setRoundSummary(null);
    setShowRoundResult(false);
    setFeedbackLabel(`Find the same animals! (L${selectedProgressLevel})`);
    setPhase('intro');
    roundScoreRef.current = 0;
    bestStreakRef.current = 0;
    winBonusAwardedRef.current = false;
    resultRecordedRef.current = false;
  }, [currentLevel, setCurrentGameLevel]);

  useEffect(() => {
    startNewGame(currentLevel);
  }, [currentLevel, startNewGame]);

  const handleCardPress = useCallback(
    (selectedCard: AnimalCard) => {
      if (phase !== 'playing' || result !== 'none' || isResolvingPair) {
        return;
      }

      if (selectedCard.isMatched || selectedCard.isFlipped) {
        return;
      }

      if (openedCardIds.includes(selectedCard.uid)) {
        return;
      }

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const nextOpenIds = [...openedCardIds, selectedCard.uid];
      setCards((previousCards) =>
        previousCards.map((card) =>
          card.uid === selectedCard.uid ? { ...card, isFlipped: true } : card
        )
      );

      if (nextOpenIds.length < 2) {
        setOpenedCardIds(nextOpenIds);
        setFirstCardOpenedAt(Date.now());
        return;
      }

      setOpenedCardIds(nextOpenIds);
      setIsResolvingPair(true);
      setMoves((previous) => previous + 1);
      const pairResponseMs = firstCardOpenedAt
        ? Date.now() - firstCardOpenedAt
        : Number.POSITIVE_INFINITY;
      setFirstCardOpenedAt(null);

      const firstSelected = cards.find((card) => card.uid === nextOpenIds[0]);
      const secondSelected = cards.find((card) => card.uid === nextOpenIds[1]);

      if (!firstSelected || !secondSelected) {
        setOpenedCardIds([]);
        setIsResolvingPair(false);
        return;
      }

      const isMatch = firstSelected.id === secondSelected.id;

      if (isMatch) {
        const updatedStreak = streak + 1;
        bestStreakRef.current = Math.max(bestStreakRef.current, updatedStreak);
        const earnedPoints = applyScoreFormula({
          basePoints: activeLevel.pairPoints,
          speedBonus: getSpeedBonus(pairResponseMs, {
            fastMs: 1600,
            mediumMs: 3000,
            fastBonus: 4,
            mediumBonus: 2,
            slowBonus: 0,
          }),
          comboBonus: getComboBonus(updatedStreak, {
            startAt: 2,
            maxBonus: activeLevel.streakBonus,
          }),
          difficulty: difficultyBand,
        });

        setStreak(updatedStreak);
        setBestStreak(bestStreakRef.current);
        addRoundScore(earnedPoints);
        setFeedbackLabel('Great match!');
        setCelebrationTrigger((previous) => previous + 1);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        void playSound(CORRECT_SOUND);

        setTimeout(() => {
          setCards((previousCards) =>
            previousCards.map((card) =>
              nextOpenIds.includes(card.uid) ? { ...card, isMatched: true } : card
            )
          );
          setOpenedCardIds([]);
          setIsResolvingPair(false);
        }, 350);

        return;
      }

      setFeedbackLabel('Oops, wrong pair!');
      setStreak(0);
      setLives((previous) => Math.max(previous - 1, 0));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      void playSound(WRONG_SOUND);

      wrongFlashOpacity.value = withSequence(
        withTiming(0.18, { duration: 120 }),
        withTiming(0, { duration: 240 })
      );

      setCards((previousCards) =>
        previousCards.map((card) =>
          nextOpenIds.includes(card.uid) ? { ...card, shakeTick: card.shakeTick + 1 } : card
        )
      );

      setTimeout(() => {
        setCards((previousCards) =>
          previousCards.map((card) =>
            nextOpenIds.includes(card.uid) ? { ...card, isFlipped: false } : card
          )
        );
        setOpenedCardIds([]);
        setIsResolvingPair(false);
      }, 900);
    },
    [
      activeLevel.pairPoints,
      activeLevel.streakBonus,
      addRoundScore,
      cards,
      difficultyBand,
      firstCardOpenedAt,
      isResolvingPair,
      openedCardIds,
      phase,
      playSound,
      result,
      streak,
      wrongFlashOpacity,
    ]
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <LinearGradient
        colors={[...Colors.gradients.animalOcean]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
      />

      {activeBubbles.map((bubble, index) => (
        <AquariumBubble
          key={`bubble-${index}`}
          left={bubble.left}
          top={bubble.top}
          size={bubble.size}
          delay={bubble.delay}
          duration={bubble.duration}
        />
      ))}

      {!isVeryCompact && (
        <View style={styles.coralRow} pointerEvents="none">
          <Text style={styles.coralText}>🪸 🪸 🐚</Text>
          <Text style={styles.coralText}>🐠 🪸 🌊</Text>
        </View>
      )}

      <Animated.View pointerEvents="none" style={[styles.wrongFlashLayer, wrongFlashAnimatedStyle]} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            isCompact && styles.scrollContentCompact,
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEnabled={isCompact}
        >
          <View style={styles.headerRow}>
            <Pressable style={styles.backButton} onPress={goBack}>
              <Text style={styles.backButtonText}>◀</Text>
            </Pressable>

            <View style={styles.titleChip}>
              <Text style={[styles.titleText, isCompact && styles.titleTextCompact]}>
                ANIMAL FLASHCARDS
              </Text>
            </View>
          </View>

          <View style={styles.scoreRow}>
            <ScoreBadge game="animals" />
          </View>

          <View style={[styles.levelRow, isCompact && styles.levelRowCompact]}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>
                Level {currentLevel}/{20}
              </Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>
                Unlocked: {unlockedLevel}
              </Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>
                Stars: {totalAnimalStars}
              </Text>
            </View>
          </View>

          <View style={[styles.infoRow, isCompact && styles.infoRowCompact]}>
            <View style={styles.infoBadge}>
              <Text style={styles.infoLabel}>Moves</Text>
              <Text style={styles.infoValue}>{moves}</Text>
            </View>
            <View style={styles.infoBadge}>
              <Text style={styles.infoLabel}>Pairs</Text>
              <Text style={styles.infoValue}>{matchedPairs}/{totalPairs}</Text>
            </View>
            <View style={styles.infoBadge}>
              <Text style={styles.infoLabel}>Lives</Text>
              <Text style={styles.infoValue}>{lives > 0 ? '❤️'.repeat(lives) : '0'}</Text>
            </View>
            <View style={styles.infoBadge}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={[styles.infoValue, remainingTime <= 10 && styles.infoValueDanger]}>
                {remainingTime}s
              </Text>
            </View>
          </View>

          <View style={[styles.feedbackBanner, isCompact && styles.feedbackBannerCompact]}>
            <Text style={[styles.feedbackText, isCompact && styles.feedbackTextCompact]}>
              {feedbackLabel}
            </Text>
            <Text style={[styles.feedbackSubText, isCompact && styles.feedbackSubTextCompact]}>
              Level L{currentLevel} · Round Score: {roundScore}
            </Text>
          </View>

          <View
            style={[
              styles.boardWrapper,
              isCompact && styles.boardWrapperCompact,
              {
                paddingHorizontal: gridHorizontalPadding,
                paddingVertical: gridVerticalPadding,
                height: boardHeight,
                flex: isCompact ? 0 : 1,
              },
            ]}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setBoardLayout((previous) => {
                const roundedWidth = Math.round(width);
                const roundedHeight = Math.round(height);
                if (roundedWidth === Math.round(previous.width) && roundedHeight === Math.round(previous.height)) {
                  return previous;
                }
                return { width, height };
              });
            }}
          >
            <CelebrationEffect trigger={celebrationTrigger} />

            {phase !== 'playing' && (
              <GameCountdown
                introText={`Memory Level ${currentLevel}!`}
                onComplete={handleCountdownComplete}
              />
            )}

            {phase === 'playing' && (
              <View style={[styles.grid, { rowGap: gridGap, columnGap: gridGap }]}>
                {cards.map((card) => (
                  <MemoryCard
                    key={card.uid}
                    card={card}
                    disabled={isResolvingPair || result !== 'none'}
                    onPress={handleCardPress}
                    cardWidth={cardWidth}
                    cardHeight={cardHeight}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={[styles.footerRow, isCompact && styles.footerRowCompact]}>
            <Text style={[styles.streakText, isCompact && styles.streakTextCompact]}>
              Streak: {streak} · Best: {bestStreak}
            </Text>
            <Pressable
              style={[styles.restartButton, isCompact && styles.restartButtonCompact]}
              onPress={() => startNewGame()}
            >
              <Text style={styles.restartButtonText}>Restart</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      <RoundResultPopup
        visible={showRoundResult}
        summary={roundSummary}
        gameTitle="Animal Memory"
        onPlayAgain={() => startNewGame(currentLevel)}
        onPlayNext={() => {
          const nextLevel = roundSummary?.nextLevel ?? null;
          if (nextLevel) {
            setCurrentGameLevel('animals', nextLevel);
            startNewGame(nextLevel);
            return;
          }
          startNewGame(currentLevel);
        }}
        onBackHome={goBack}
        onTryRecovery={(suggestedLevel) => {
          activateRecoveryMode('animals', suggestedLevel);
          startNewGame(suggestedLevel);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: scale(10),
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentCompact: {
    paddingBottom: verticalScale(10),
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  coralRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scale(18),
    paddingBottom: verticalScale(12),
  },
  coralText: {
    fontSize: scale(26),
    opacity: 0.9,
  },
  wrongFlashLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF6B7B',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: scale(8),
  },
  scoreRow: {
    marginTop: verticalScale(8),
    alignItems: 'flex-end',
  },
  levelRow: {
    marginTop: verticalScale(10),
    flexDirection: 'row',
    gap: scale(8),
  },
  levelRowCompact: {
    marginTop: verticalScale(8),
    gap: scale(6),
  },
  levelBadge: {
    flex: 1,
    minHeight: verticalScale(36),
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: scale(6),
  },
  levelBadgeText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(11),
    color: Colors.white,
    textAlign: 'center',
  },
  levelButton: {
    flex: 1,
    minHeight: verticalScale(36),
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  levelButtonActive: {
    backgroundColor: '#FFF6A2',
    borderColor: '#FFD95E',
  },
  levelButtonText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(12),
    color: Colors.white,
  },
  levelButtonTextActive: {
    color: '#A26100',
  },
  backButton: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    backgroundColor: '#5CB7FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  backButtonText: {
    fontSize: scale(20),
    color: Colors.white,
    fontFamily: Typography.fontFamily.display,
  },
  titleChip: {
    flex: 1,
    minHeight: scale(44),
    borderRadius: scale(24),
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(10),
  },
  titleText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(16),
    color: Colors.white,
    textAlign: 'center',
  },
  titleTextCompact: {
    fontSize: scale(14),
  },
  infoRow: {
    marginTop: verticalScale(12),
    flexDirection: 'row',
    gap: scale(8),
  },
  infoRowCompact: {
    marginTop: verticalScale(8),
    gap: scale(6),
  },
  infoBadge: {
    flex: 1,
    borderRadius: scale(16),
    paddingVertical: verticalScale(8),
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
  },
  infoLabel: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(11),
    color: '#DDF4FF',
  },
  infoValue: {
    marginTop: verticalScale(3),
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(16),
    color: Colors.white,
    textAlign: 'center',
  },
  infoValueDanger: {
    color: '#FFE67A',
  },
  feedbackBanner: {
    marginTop: verticalScale(12),
    borderRadius: scale(18),
    paddingVertical: verticalScale(8),
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
  },
  feedbackBannerCompact: {
    marginTop: verticalScale(8),
    paddingVertical: verticalScale(6),
  },
  feedbackText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(16),
    color: '#2279D5',
  },
  feedbackTextCompact: {
    fontSize: scale(14),
  },
  feedbackSubText: {
    marginTop: verticalScale(2),
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(12),
    color: '#4B9CF3',
  },
  feedbackSubTextCompact: {
    fontSize: scale(10),
  },
  boardWrapper: {
    flex: 1,
    marginTop: verticalScale(10),
    borderRadius: scale(24),
    backgroundColor: 'rgba(8, 102, 185, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  boardWrapperCompact: {
    marginTop: verticalScale(8),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    columnGap: scale(8),
  },
  cardPressable: {
    minWidth: 0,
    minHeight: 0,
  },
  cardShell: {
    width: '100%',
    height: '100%',
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: scale(18),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#022F5F',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 5,
  },
  cardBackIcon: {
    fontSize: scale(24),
  },
  cardBackGradient: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBackQuestion: {
    marginTop: verticalScale(6),
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(26),
    color: Colors.white,
  },
  cardFront: {
    transform: [{ rotateY: '180deg' }],
    paddingHorizontal: scale(5),
  },
  cardAnimalEmoji: {
    fontSize: scale(36),
  },
  cardAnimalName: {
    marginTop: verticalScale(8),
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(16),
    color: '#2F2F2F',
  },
  footerRow: {
    marginTop: verticalScale(12),
    marginBottom: verticalScale(8),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerRowCompact: {
    marginTop: verticalScale(8),
  },
  streakText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(17),
    color: Colors.white,
  },
  streakTextCompact: {
    fontSize: scale(14),
  },
  restartButton: {
    minWidth: scale(120),
    borderRadius: scale(18),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(18),
    backgroundColor: '#FF7E87',
    borderBottomWidth: 4,
    borderBottomColor: '#D45760',
    alignItems: 'center',
  },
  restartButtonCompact: {
    minWidth: scale(104),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(14),
  },
  restartButtonText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(16),
    color: Colors.white,
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(24),
  },
  resultCard: {
    width: '100%',
    borderRadius: scale(26),
    backgroundColor: '#F7FBFF',
    paddingVertical: verticalScale(24),
    paddingHorizontal: scale(18),
    alignItems: 'center',
  },
  resultEmoji: {
    fontSize: scale(58),
  },
  resultTitle: {
    marginTop: verticalScale(8),
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(30),
    color: '#2A80D4',
  },
  resultDescription: {
    marginTop: verticalScale(10),
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(15),
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: verticalScale(22),
  },
  resultButtonsRow: {
    width: '100%',
    marginTop: verticalScale(18),
    gap: verticalScale(10),
  },
  resultButtonPrimary: {
    width: '100%',
    borderRadius: scale(16),
    backgroundColor: '#4AB3FF',
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#2587D1',
  },
  resultButtonPrimaryText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(17),
    color: Colors.white,
  },
  resultButtonGhost: {
    width: '100%',
    borderRadius: scale(16),
    backgroundColor: '#E8F4FF',
    paddingVertical: verticalScale(12),
    alignItems: 'center',
  },
  resultButtonGhostText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(16),
    color: '#267FD3',
  },
});
