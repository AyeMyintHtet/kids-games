import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
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
import { ScoreBadge } from '@/components/ScoreBadge';
import { GameCountdown } from '@/components/GameCountdown';
import { CelebrationEffect } from '@/components/CelebrationEffect';
import { useAppStore } from '@/store/useAppStore';
import { SCREEN_WIDTH, scale, verticalScale } from '@/utils/responsive';

const CORRECT_SOUND = require('@/assets/sounds/correct.mp3');
const WRONG_SOUND = require('@/assets/sounds/wrong.mp3');
const WIN_SOUND = require('@/assets/sounds/bravo.mp3');
const LOSS_SOUND = require('@/assets/sounds/wrong.mp3');
const COW_IMAGE = require('@/assets/images/animal-flashcard/image.png');
const DOG_IMAGE = require('@/assets/images/animal-flashcard/image copy.png');
const PIG_IMAGE = require('@/assets/images/animal-flashcard/image copy 2.png');
const SHEEP_IMAGE = require('@/assets/images/animal-flashcard/image copy 3.png');
const CAT_IMAGE = require('@/assets/images/animal-flashcard/image copy 4.png');
const HORSE_IMAGE = require('@/assets/images/animal-flashcard/image copy 5.png');
const DUCK_IMAGE = require('@/assets/images/animal-flashcard/image copy 6.png');
const DONKEY_IMAGE = require('@/assets/images/animal-flashcard/image copy 7.png');
const CHICKEN_IMAGE = require('@/assets/images/animal-flashcard/image copy 8.png');
const RABBIT_IMAGE = require('@/assets/images/animal-flashcard/image copy 9.png');
const LLAMA_IMAGE = require('@/assets/images/animal-flashcard/image copy 10.png');
const YAK_IMAGE = require('@/assets/images/animal-flashcard/image copy 11.png');
const CAMEL_IMAGE = require('@/assets/images/animal-flashcard/image copy 12.png');
const OX_IMAGE = require('@/assets/images/animal-flashcard/image copy 13.png');
const TURKEY_IMAGE = require('@/assets/images/animal-flashcard/image copy 14.png');

type GamePhase = 'intro' | 'playing';
type RoundResult = 'none' | 'won' | 'lost';
type Level = 'easy' | 'medium' | 'hard';

type LevelConfig = {
  label: string;
  pairs: number;
  columns: number;
  lives: number;
  durationSeconds: number;
  pairPoints: number;
  streakBonus: number;
  completionBonus: number;
};

const LEVEL_CONFIGS: Record<Level, LevelConfig> = {
  easy: {
    label: 'Easy',
    pairs: 4,
    columns: 3,
    lives: 6,
    durationSeconds: 90,
    pairPoints: 15,
    streakBonus: 3,
    completionBonus: 40,
  },
  medium: {
    label: 'Medium',
    pairs: 6,
    columns: 4,
    lives: 5,
    durationSeconds: 75,
    pairPoints: 20,
    streakBonus: 5,
    completionBonus: 60,
  },
  hard: {
    label: 'Hard',
    pairs: 8,
    columns: 4,
    lives: 4,
    durationSeconds: 60,
    pairPoints: 25,
    streakBonus: 8,
    completionBonus: 90,
  },
};

const LEVEL_ANIMAL_IDS: Record<Level, string[]> = {
  easy: ['pig', 'dog', 'horse', 'yak'],
  medium: ['pig', 'dog', 'horse', 'yak', 'cat', 'sheep'],
  hard: ['pig', 'dog', 'horse', 'yak', 'cat', 'sheep', 'cow', 'rabbit'],
};

type Animal = {
  id: string;
  name: string;
  emoji: string;
  cardColor: string;
  imageSource?: number | string;
};

type AnimalCard = Animal & {
  uid: string;
  isFlipped: boolean;
  isMatched: boolean;
  shakeTick: number;
};

const ANIMALS: Animal[] = [
  { id: 'pig', name: 'Pig', emoji: '🐷', cardColor: '#FFD1DC', imageSource: PIG_IMAGE },
  { id: 'dog', name: 'Dog', emoji: '🐶', cardColor: '#DBEAFE', imageSource: DOG_IMAGE },
  { id: 'horse', name: 'Horse', emoji: '🐴', cardColor: '#FDE4CF', imageSource: HORSE_IMAGE },
  { id: 'yak', name: 'Yak', emoji: '🐂', cardColor: '#FAE0C8', imageSource: YAK_IMAGE },
  { id: 'cat', name: 'Cat', emoji: '🐱', cardColor: '#FFF1B7', imageSource: CAT_IMAGE },
  { id: 'sheep', name: 'Sheep', emoji: '🐑', cardColor: '#E7F9EF', imageSource: SHEEP_IMAGE },
  { id: 'cow', name: 'Cow', emoji: '🐮', cardColor: '#E9E7FF', imageSource: COW_IMAGE },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰', cardColor: '#FFE2EE', imageSource: RABBIT_IMAGE },
  { id: 'duck', name: 'Duck', emoji: '🦆', cardColor: '#E6F7FF', imageSource: DUCK_IMAGE },
  { id: 'donkey', name: 'Donkey', emoji: '🫏', cardColor: '#DFE9F7', imageSource: DONKEY_IMAGE },
  { id: 'chicken', name: 'Chicken', emoji: '🐔', cardColor: '#FBE7C7', imageSource: CHICKEN_IMAGE },
  { id: 'llama', name: 'Llama', emoji: '🦙', cardColor: '#FEE2C6', imageSource: LLAMA_IMAGE },
  { id: 'camel', name: 'Camel', emoji: '🐫', cardColor: '#F6DDB7', imageSource: CAMEL_IMAGE },
  { id: 'ox', name: 'Ox', emoji: '🐂', cardColor: '#E5D0D0', imageSource: OX_IMAGE },
  { id: 'turkey', name: 'Turkey', emoji: '🦃', cardColor: '#F5D5D5', imageSource: TURKEY_IMAGE },
];

const shuffle = <T,>(items: T[]) => {
  const cloned = [...items];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
};

const buildDeck = (level: Level, pairCount: number) => {
  const configuredIds = LEVEL_ANIMAL_IDS[level];
  const selectedFromConfig = configuredIds
    .map((id) => ANIMALS.find((animal) => animal.id === id))
    .filter(Boolean) as Animal[];

  let selectedAnimals = selectedFromConfig.slice(0, pairCount);
  if (selectedAnimals.length < pairCount) {
    const existingIds = new Set(selectedAnimals.map((animal) => animal.id));
    const extras = shuffle(ANIMALS.filter((animal) => !existingIds.has(animal.id)))
      .slice(0, pairCount - selectedAnimals.length);
    selectedAnimals = [...selectedAnimals, ...extras];
  }
  const duplicated = selectedAnimals.flatMap((animal) => [
    {
      ...animal,
      uid: `${animal.id}-A`,
      isFlipped: false,
      isMatched: false,
      shakeTick: 0,
    },
    {
      ...animal,
      uid: `${animal.id}-B`,
      isFlipped: false,
      isMatched: false,
      shakeTick: 0,
    },
  ]);

  return shuffle(duplicated);
};

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
  const rotateY = useSharedValue(card.isFlipped || card.isMatched ? 180 : 0);
  const scaleValue = useSharedValue(1);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    rotateY.value = withTiming(card.isFlipped || card.isMatched ? 180 : 0, {
      duration: 340,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [card.isFlipped, card.isMatched, rotateY]);

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
      { rotateY: `${rotateY.value}deg` },
      { scale: scaleValue.value },
      { translateX: shakeX.value },
    ],
  }));

  return (
    <Pressable
      disabled={disabled || card.isMatched || card.isFlipped}
      onPress={() => onPress(card)}
      style={[styles.cardPressable, { width: cardWidth, height: cardHeight }]}
    >
      <Animated.View style={[styles.cardShell, shellAnimatedStyle]}>
        <LinearGradient
          colors={['#2D8EEB', '#4EC4FF']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[styles.cardFace, { borderRadius: cardWidth * 0.18 }]}
        >
          <Text style={[styles.cardBackIcon, { fontSize: cardWidth * 0.3 }]}>🐠</Text>
          <Text style={[styles.cardBackQuestion, { fontSize: cardWidth * 0.26 }]}>?</Text>
        </LinearGradient>

        <View style={[styles.cardFace, styles.cardFront, { backgroundColor: card.cardColor, borderRadius: cardWidth * 0.18 }]}>
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
        </View>
      </Animated.View>
    </Pressable>
  );
};

export const AnimalFlashcardsScreen = () => {
  const { goBack } = useCloudTransition();
  const { incrementScore, recordGamePlayed } = useAppStore();
  const [level, setLevel] = useState<Level>('easy');
  const activeLevel = LEVEL_CONFIGS[level];
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [cards, setCards] = useState<AnimalCard[]>(() => buildDeck('easy', LEVEL_CONFIGS.easy.pairs));
  const [openedCardIds, setOpenedCardIds] = useState<string[]>([]);
  const [isResolvingPair, setIsResolvingPair] = useState(false);
  const [moves, setMoves] = useState(0);
  const [lives, setLives] = useState(LEVEL_CONFIGS.easy.lives);
  const [streak, setStreak] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [remainingTime, setRemainingTime] = useState(LEVEL_CONFIGS.easy.durationSeconds);
  const [result, setResult] = useState<RoundResult>('none');
  const [feedbackLabel, setFeedbackLabel] = useState('Find the same animals!');
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const resultAnimatedScale = useSharedValue(0.7);
  const resultEmojiFloat = useSharedValue(0);
  const wrongFlashOpacity = useSharedValue(0);
  const winBonusAwardedRef = useRef(false);
  const [boardLayout, setBoardLayout] = useState({
    width: SCREEN_WIDTH - scale(20),
    height: verticalScale(410),
  });

  const matchedPairs = useMemo(() => cards.filter((card) => card.isMatched).length / 2, [cards]);
  const totalCards = activeLevel.pairs * 2;
  const totalRows = Math.ceil(totalCards / activeLevel.columns);

  const totalPairs = activeLevel.pairs;
  const gridGap = useMemo(
    () => scale(activeLevel.columns === 4 ? 6 : 10),
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
    if (result === 'none') return;

    resultAnimatedScale.value = withSequence(
      withTiming(1.07, { duration: 220, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 12, stiffness: 160 })
    );

    resultEmojiFloat.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [result, resultAnimatedScale, resultEmojiFloat]);

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
        const completionBonus = activeLevel.completionBonus;
        setRoundScore((previous) => previous + completionBonus);
        incrementScore(completionBonus);
        winBonusAwardedRef.current = true;
      }

      recordGamePlayed();
      return;
    }

    if (lives === 0 || remainingTime === 0) {
      setResult('lost');
      setFeedbackLabel(remainingTime === 0 ? "Time's up! Try again!" : 'Try again. You can do it!');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      void playSound(LOSS_SOUND);
      recordGamePlayed();
    }
  }, [
    activeLevel.completionBonus,
    phase,
    result,
    matchedPairs,
    totalPairs,
    lives,
    remainingTime,
    incrementScore,
    playSound,
    recordGamePlayed,
  ]);

  const resultCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultAnimatedScale.value }],
  }));

  const resultEmojiAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: resultEmojiFloat.value }],
  }));

  const wrongFlashAnimatedStyle = useAnimatedStyle(() => ({
    opacity: wrongFlashOpacity.value,
  }));

  const handleCountdownComplete = useCallback(() => {
    setPhase('playing');
  }, []);

  const startNewGame = useCallback((nextLevel?: Level) => {
    const selectedLevel = nextLevel ?? level;
    const config = LEVEL_CONFIGS[selectedLevel];

    if (nextLevel && nextLevel !== level) {
      setLevel(nextLevel);
    }

    setCards(buildDeck(selectedLevel, config.pairs));
    setOpenedCardIds([]);
    setIsResolvingPair(false);
    setMoves(0);
    setLives(config.lives);
    setStreak(0);
    setRoundScore(0);
    setRemainingTime(config.durationSeconds);
    setResult('none');
    setFeedbackLabel(`Find the same animals! (${config.label})`);
    setPhase('intro');
    winBonusAwardedRef.current = false;
  }, [level]);

  const handleLevelSelect = useCallback(
    (nextLevel: Level) => {
      if (nextLevel === level) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      startNewGame(nextLevel);
    },
    [level, startNewGame]
  );

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
        return;
      }

      setOpenedCardIds(nextOpenIds);
      setIsResolvingPair(true);
      setMoves((previous) => previous + 1);

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
        const earnedPoints =
          activeLevel.pairPoints + (updatedStreak >= 2 ? activeLevel.streakBonus : 0);

        setStreak(updatedStreak);
        setRoundScore((previous) => previous + earnedPoints);
        incrementScore(earnedPoints);
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
      cards,
      incrementScore,
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
        colors={['#83D9FF', '#4EBEFF', '#2D86E0']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
      />

      {bubbleConfig.map((bubble, index) => (
        <AquariumBubble
          key={`bubble-${index}`}
          left={bubble.left}
          top={bubble.top}
          size={bubble.size}
          delay={bubble.delay}
          duration={bubble.duration}
        />
      ))}

      <View style={styles.coralRow} pointerEvents="none">
        <Text style={styles.coralText}>🪸 🪸 🐚</Text>
        <Text style={styles.coralText}>🐠 🪸 🌊</Text>
      </View>

      <Animated.View pointerEvents="none" style={[styles.wrongFlashLayer, wrongFlashAnimatedStyle]} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>◀</Text>
          </Pressable>

          <View style={styles.titleChip}>
            <Text style={styles.titleText}>ANIMAL FLASHCARDS</Text>
          </View>
        </View>

        <View style={styles.scoreRow}>
          <ScoreBadge />
        </View>

        <View style={styles.levelRow}>
          {(Object.keys(LEVEL_CONFIGS) as Level[]).map((levelKey) => {
            const isActive = level === levelKey;
            return (
              <Pressable
                key={levelKey}
                onPress={() => handleLevelSelect(levelKey)}
                style={[styles.levelButton, isActive && styles.levelButtonActive]}
              >
                <Text style={[styles.levelButtonText, isActive && styles.levelButtonTextActive]}>
                  {LEVEL_CONFIGS[levelKey].label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.infoRow}>
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

        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>{feedbackLabel}</Text>
          <Text style={styles.feedbackSubText}>
            Level: {activeLevel.label} · Round Score: {roundScore}
          </Text>
        </View>

        <View
          style={[
            styles.boardWrapper,
            {
              paddingHorizontal: gridHorizontalPadding,
              paddingVertical: gridVerticalPadding,
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
              introText={`${activeLevel.label} Level!`}
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

        <View style={styles.footerRow}>
          <Text style={styles.streakText}>Streak: {streak}</Text>
          <Pressable
            style={styles.restartButton}
            onPress={() => startNewGame()}
          >
            <Text style={styles.restartButtonText}>Restart</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {result !== 'none' && (
        <View style={styles.resultOverlay}>
          <Animated.View style={[styles.resultCard, resultCardAnimatedStyle]}>
            <Animated.Text style={[styles.resultEmoji, resultEmojiAnimatedStyle]}>
              {result === 'won' ? '🏆' : '😵'}
            </Animated.Text>
            <Text style={styles.resultTitle}>
              {result === 'won' ? 'You Won!' : remainingTime === 0 ? "Time's Up!" : 'Out Of Lives'}
            </Text>
            <Text style={styles.resultDescription}>
              {result === 'won'
                ? `Super job! You matched all ${totalPairs} pairs.`
                : remainingTime === 0
                  ? 'You ran out of time. Try again and move faster!'
                  : 'Keep practicing and your memory will get stronger.'}
            </Text>

            <View style={styles.resultButtonsRow}>
              <Pressable style={styles.resultButtonPrimary} onPress={() => startNewGame()}>
                <Text style={styles.resultButtonPrimaryText}>Play Again</Text>
              </Pressable>
              <Pressable style={styles.resultButtonGhost} onPress={goBack}>
                <Text style={styles.resultButtonGhostText}>Back Home</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      )}
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
    fontFamily: 'SuperWonder',
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
    fontFamily: 'SuperWonder',
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
    fontFamily: 'SuperWonder',
    fontSize: scale(16),
    color: Colors.white,
    textAlign: 'center',
  },
  infoRow: {
    marginTop: verticalScale(12),
    flexDirection: 'row',
    gap: scale(8),
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
    fontFamily: 'SuperWonder',
    fontSize: scale(11),
    color: '#DDF4FF',
  },
  infoValue: {
    marginTop: verticalScale(3),
    fontFamily: 'SuperWonder',
    fontSize: scale(16),
    color: Colors.white,
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
  feedbackText: {
    fontFamily: 'SuperWonder',
    fontSize: scale(16),
    color: '#2279D5',
  },
  feedbackSubText: {
    marginTop: verticalScale(2),
    fontFamily: 'SuperWonder',
    fontSize: scale(12),
    color: '#4B9CF3',
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
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
    backfaceVisibility: 'hidden',
    shadowColor: '#022F5F',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 5,
  },
  cardBackIcon: {
    fontSize: scale(24),
  },
  cardBackQuestion: {
    marginTop: verticalScale(6),
    fontFamily: 'SuperWonder',
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
    fontFamily: 'SuperWonder',
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
  streakText: {
    fontFamily: 'SuperWonder',
    fontSize: scale(17),
    color: Colors.white,
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
  restartButtonText: {
    fontFamily: 'SuperWonder',
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
    fontFamily: 'SuperWonder',
    fontSize: scale(30),
    color: '#2A80D4',
  },
  resultDescription: {
    marginTop: verticalScale(10),
    fontFamily: 'SuperWonder',
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
    fontFamily: 'SuperWonder',
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
    fontFamily: 'SuperWonder',
    fontSize: scale(16),
    color: '#267FD3',
  },
});
