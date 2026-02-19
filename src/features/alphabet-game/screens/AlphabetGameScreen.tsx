import { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Platform, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useCloudTransition } from '@/hooks/useCloudTransition';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, withRepeat } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { TactileButton } from '@/components/TactileButton';
import { GameCountdown } from '@/components/GameCountdown';
import { GiveUpModal } from '@/components/GiveUpModal';
import { RoundResultPopup } from '@/components/RoundResultPopup';
import { ScoreBadge } from '@/components/ScoreBadge';
import { useAppStore } from '@/store/useAppStore';
import {
  ALPHABET,
  BACKGROUNDS,
  CHILD_COLORS,
  getLetterColor,
  shuffleLetters,
} from '@/features/alphabet-game/model/alphabet';
import {
  applyScoreFormula,
  getComboBonus,
  getSpeedBonus,
  toAccuracy,
} from '@/features/score/model/scoring';
import { getAlphabetLevelConfig } from '@/features/progression/model/progression';
import {
  isSmallHeightDevice,
  isVerySmallHeightDevice,
  SCREEN_HEIGHT,
  scale,
  verticalScale,
} from '@/utils/responsive';
import type { RoundSummary } from '@/store/useAppStore';

const PAUSE_ICON = require('@/assets/images/pause.png');

const AnimatedLetterButton = ({
  letter,
  index,
  isCorrect,
  shakeTrigger,
  onPress,
  compact,
}: {
  letter: string;
  index: number;
  isCorrect: boolean;
  shakeTrigger: number;
  onPress: (letter: string) => void;
  compact: boolean;
}) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const color = useMemo(() => getLetterColor(index), [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (isCorrect) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.85, { damping: 10 }); // Squeeze effect
  };

  const handlePressOut = () => {
    if (isCorrect) return;
    scale.value = withSequence(
      withSpring(1.05, { damping: 10 }), // Slight bounce back
      withSpring(1, { damping: 10 })
    );
  };

  useEffect(() => {
    if (!shakeTrigger) return;
    translateX.value = withSequence(
      withTiming(-10, { duration: 45 }),
      withTiming(10, { duration: 45 }),
      withTiming(-8, { duration: 45 }),
      withTiming(8, { duration: 45 }),
      withTiming(0, { duration: 45 })
    );
  }, [shakeTrigger, translateX]);

  return (
    <View style={styles.letterWrapper}>
      <Pressable
        disabled={isCorrect}
        onPress={() => onPress(letter)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressableContainer}
      >
        <Animated.View
          style={[
            styles.letterButton,
            {
              backgroundColor: color,
              opacity: isCorrect ? 0 : 1,
              borderRadius: compact ? 10 : 12,
            },
            animatedStyle
          ]}
        >
          <Text style={[styles.letterText, compact && styles.letterTextCompact]}>{letter}</Text>
          {/* Shine effect */}
          <View style={styles.shine} />
        </Animated.View>
      </Pressable>
    </View>
  );
};

export const AlphabetGameScreen = () => {
  const { replaceTo } = useCloudTransition();
  const insets = useSafeAreaInsets();
  const difficulty = useAppStore((state) => state.settings.difficulty);
  const addScore = useAppStore((state) => state.addScore);
  const recordGameResult = useAppStore((state) => state.recordGameResult);
  const currentLevel = useAppStore((state) => state.progression.games.alphabet.currentLevel);
  const setCurrentGameLevel = useAppStore((state) => state.setCurrentGameLevel);
  const activateRecoveryMode = useAppStore((state) => state.activateRecoveryMode);
  const levelConfig = useMemo(() => getAlphabetLevelConfig(currentLevel), [currentLevel]);
  const targetAlphabet = useMemo(
    () => ALPHABET.slice(0, levelConfig.letterCount),
    [levelConfig.letterCount]
  );
  const [gamePhase, setGamePhase] = useState<'intro' | 'countdown' | 'playing'>('intro');
  const [shuffledLetters, setShuffledLetters] = useState<string[]>(() =>
    shuffleLetters(targetAlphabet)
  );
  const [nextLetterIndex, setNextLetterIndex] = useState(0);
  const [correctLetters, setCorrectLetters] = useState<Set<string>>(() => new Set());
  const [shakeTickByLetter, setShakeTickByLetter] = useState<Record<string, number>>({});
  const [roundScore, setRoundScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [roundStartedAt, setRoundStartedAt] = useState<number | null>(null);
  const [letterStartedAt, setLetterStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);
  const [roundSummary, setRoundSummary] = useState<RoundSummary | null>(null);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const resultRecordedRef = useRef(false);
  const isCompact = isSmallHeightDevice;
  const isVeryCompact = isVerySmallHeightDevice;
  const boardMaxHeight = isVeryCompact
    ? SCREEN_HEIGHT * 0.44
    : isCompact
      ? SCREEN_HEIGHT * 0.50
      : SCREEN_HEIGHT * 0.62;
  const titleSize = isVeryCompact ? scale(18) : isCompact ? scale(20) : scale(22);
  const timerSize = isVeryCompact ? scale(18) : isCompact ? scale(20) : scale(24);
  const progressSize = isVeryCompact ? scale(24) : isCompact ? scale(28) : scale(34);
  const progressSubSize = isVeryCompact ? scale(14) : isCompact ? scale(16) : scale(20);
  const headerIconSize = isVeryCompact ? scale(42) : scale(50);
  const footerBottom = Math.max(
    isCompact ? verticalScale(16) : 40,
    insets.bottom + (isCompact ? verticalScale(6) : 12)
  );

  // Pick 3 unique random candy colors on mount for Timer / TapNext / Correct texts
  const [timerColor, tapNextColor, correctColor] = useMemo(() => {
    const shuffled = [...CHILD_COLORS].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1], shuffled[2]];
  }, []);

  // Pick a random background image on each mount
  const randomBg = useMemo(() => BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)], []);

  // Animation Values
  // Animation Values
  const boardScale = useSharedValue(0);
  const pauseScale = useSharedValue(1);

  const boardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boardScale.value }],
  }));
  const pauseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pauseScale.value }],
  }));
  const expectedLetter = targetAlphabet[nextLetterIndex];
  const isRoundComplete = nextLetterIndex >= targetAlphabet.length;
  const formatElapsed = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const startNewRound = (targetLevel?: number) => {
    const level = targetLevel ?? currentLevel;
    const lettersForLevel = ALPHABET.slice(0, getAlphabetLevelConfig(level).letterCount);
    const now = Date.now();
    setShuffledLetters(shuffleLetters(lettersForLevel));
    setNextLetterIndex(0);
    setCorrectLetters(new Set());
    setShakeTickByLetter({});
    setRoundScore(0);
    setStreak(0);
    setBestStreak(0);
    setWrongCount(0);
    setRoundStartedAt(now);
    setLetterStartedAt(now);
    setElapsedMs(0);
    setRoundSummary(null);
    setShowRoundResult(false);
    setGamePhase('intro');
    resultRecordedRef.current = false;
    boardScale.value = withSequence(
      withTiming(0.9, { duration: 0 }),
      withSpring(1, { damping: 12, stiffness: 100 })
    );
  };

  const recordAlphabetResult = (
    score: number,
    timeMs: number | null,
    correct: number,
    wrong: number,
    peakStreak: number,
    outcome: 'won' | 'lost' | 'quit'
  ): RoundSummary | null => {
    if (resultRecordedRef.current) return null;
    resultRecordedRef.current = true;
    return recordGameResult({
      game: 'alphabet',
      score,
      timeMs,
      accuracy: toAccuracy(correct, wrong),
      streak: peakStreak,
      level: currentLevel,
      hintsUsed: wrong > 0,
      outcome,
    });
  };

  const handleLetterPress = (letter: string) => {
    if (gamePhase !== 'playing' || isRoundComplete || correctLetters.has(letter)) {
      return;
    }

    if (letter === expectedLetter) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const responseMs = letterStartedAt ? Date.now() - letterStartedAt : Number.POSITIVE_INFINITY;
      setCorrectLetters((prev) => {
        const next = new Set(prev);
        next.add(letter);
        return next;
      });

      const newStreak = streak + 1;
      const nextBestStreak = Math.max(bestStreak, newStreak);
      const earnedPoints = applyScoreFormula({
        basePoints: 8,
        speedBonus: getSpeedBonus(responseMs, {
          fastMs: 1500,
          mediumMs: 3200,
          fastBonus: 4,
          mediumBonus: 2,
          slowBonus: 0,
        }),
        comboBonus: getComboBonus(newStreak, {
          startAt: 4,
          maxBonus: 8,
        }),
        difficulty,
      });
      const nextRoundScore = roundScore + earnedPoints;

      setStreak(newStreak);
      setBestStreak(nextBestStreak);
      setRoundScore(nextRoundScore);
      addScore('alphabet', earnedPoints);

      const updatedIndex = nextLetterIndex + 1;
      setNextLetterIndex(updatedIndex);

      if (updatedIndex === targetAlphabet.length) {
        const completedAt = Date.now();
        const totalMs = roundStartedAt ? completedAt - roundStartedAt : null;
        if (totalMs !== null) {
          setElapsedMs(totalMs);
        }
        setLetterStartedAt(null);
        const summary = recordAlphabetResult(
          nextRoundScore,
          totalMs,
          updatedIndex,
          wrongCount,
          nextBestStreak,
          'won'
        );
        if (summary) {
          setRoundSummary(summary);
          setShowRoundResult(true);
        }
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setLetterStartedAt(Date.now());
      }
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setStreak(0);
    setWrongCount((prev) => prev + 1);
    setShakeTickByLetter((prev) => ({
      ...prev,
      [letter]: (prev[letter] ?? 0) + 1,
    }));
  };

  const openGiveUpModal = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowGiveUpModal(true);
  };

  const handleCancelGiveUp = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowGiveUpModal(false);
  };

  const handleConfirmGiveUp = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowGiveUpModal(false);
    const hasProgress = nextLetterIndex > 0 || wrongCount > 0 || roundScore > 0;
    if (hasProgress) {
      const totalMs = roundStartedAt ? Date.now() - roundStartedAt : null;
      const summary = recordAlphabetResult(
        roundScore,
        totalMs,
        nextLetterIndex,
        wrongCount,
        bestStreak,
        'quit'
      );
      if (summary) {
        setRoundSummary(summary);
        setShowRoundResult(true);
      }
      return;
    }
    replaceTo('/');
  };

  /**
   * Callback from GameCountdown when 3..2..1 finishes.
   * Starts the playing phase, timer, and board pop-in animation.
   */
  const handleCountdownComplete = () => {
    const now = Date.now();
    setGamePhase('playing');
    setRoundStartedAt(now);
    setLetterStartedAt(now);
    setElapsedMs(0);
    resultRecordedRef.current = false;

    // Board squeeze animation (pop-in)
    boardScale.value = withSequence(
      withTiming(0.8, { duration: 0 }),
      withSpring(1, { damping: 12, stiffness: 100 })
    );
  };

  // Gentle pulse animation on the pause button so kids notice it
  useEffect(() => {
    pauseScale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) })
      ),
      -1, // infinite
      true
    );
  }, [pauseScale]);

  useEffect(() => {
    if (gamePhase !== 'playing' || isRoundComplete || !roundStartedAt) {
      return;
    }

    const timer = setInterval(() => {
      setElapsedMs(Date.now() - roundStartedAt);
    }, 250);

    return () => clearInterval(timer);
  }, [gamePhase, isRoundComplete, roundStartedAt]);

  useEffect(() => {
    startNewRound(currentLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel]);



  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background Image using absolute Image from expo-image */}
      <Image
        source={randomBg}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          {/* Top-left pause button */}
          <Pressable onPress={openGiveUpModal} >
            <Animated.View
              style={[
                styles.pauseButton,
                {
                  width: headerIconSize,
                  height: headerIconSize,
                },
                pauseAnimatedStyle,
              ]}
            >
              <Image
                source={PAUSE_ICON}
                style={{ width: headerIconSize, height: headerIconSize }}
                contentFit="contain"
              />
            </Animated.View>
          </Pressable>

          <View style={styles.titleContainer}>
            <Text style={[styles.title, { fontSize: titleSize }]}>Alphabet Fun</Text>
          </View>
          <View style={[styles.headerSpacer, { width: headerIconSize, height: headerIconSize }]} />
        </View>
        <View style={styles.scoreRow}>
          <ScoreBadge game="alphabet" />
        </View>
        {gamePhase === 'playing' && (
          <Text style={[styles.timerText, { color: timerColor, fontSize: timerSize }]}>
            Time: {formatElapsed(elapsedMs)}
          </Text>
        )}
        {/* Content Area */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentScroll,
            isCompact && styles.contentScrollCompact,
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEnabled={isCompact}
        >

          {gamePhase !== 'playing' && (
            <GameCountdown
              introText={`Ready for ABC L${currentLevel}?`}
              onComplete={handleCountdownComplete}
            />
          )}

          {gamePhase === 'playing' && (
            <>
              <View
                style={[
                  styles.progressContainer,
                  isCompact && styles.progressContainerCompact,
                ]}
              >
                <Text style={[styles.progressText, { color: tapNextColor, fontSize: progressSize }]}>
                  {isRoundComplete ? 'Awesome! You finished A to Z!' : `Tap Next: ${expectedLetter}`}
                </Text>
                <Text style={[styles.progressSubText, { color: correctColor, fontSize: progressSubSize }]}>
                  Level {currentLevel} • Correct: {nextLetterIndex}/{targetAlphabet.length} • Mistakes: {wrongCount} • Streak: {streak} • Score: {roundScore}
                </Text>
              </View>

              <Animated.View
                style={[
                  styles.boardContainer,
                  {
                    maxHeight: boardMaxHeight,
                    width: isCompact ? '96%' : '92%',
                  },
                  boardAnimatedStyle,
                ]}
              >
                {/* <Image
                  source={BOARD_IMAGE}
                  style={styles.boardImage}
                  contentFit="fill"
                /> */}

                <View pointerEvents="box-none" style={styles.boardOverlay}>
                  {/* Grid Overlay */}
                  <View style={styles.lettersGrid}>
                    {shuffledLetters.map((letter, index) => (
                      <AnimatedLetterButton
                        key={letter}
                        letter={letter}
                        index={index}
                        isCorrect={correctLetters.has(letter)}
                        shakeTrigger={shakeTickByLetter[letter] ?? 0}
                        onPress={handleLetterPress}
                        compact={isCompact}
                      />
                    ))}
                  </View>
                </View>
              </Animated.View>

              {/* Extra bottom padding accounts for Android software nav buttons */}
              <View style={[styles.footer, { bottom: footerBottom }]}>
                {isRoundComplete && (
                  <TactileButton
                    onPress={startNewRound}
                    color={Colors.primary.main}
                    size="small"
                    label="Play Again"
                    textStyle={{ color: Colors.white, fontSize: 30 }}
                    style={{
                      borderRadius: 30,
                      minWidth: 200,
                      marginBottom: 12,
                      paddingHorizontal: 0,
                      paddingVertical: 0,
                    }}
                  />
                )}
              </View>
            </>
          )}

        </ScrollView>
      </SafeAreaView>

      {showGiveUpModal && (
        <GiveUpModal
          onConfirm={handleConfirmGiveUp}
          onCancel={handleCancelGiveUp}
        />
      )}
      <RoundResultPopup
        visible={showRoundResult}
        summary={roundSummary}
        gameTitle="Alphabet Fun"
        onPlayAgain={() => startNewRound(currentLevel)}
        onPlayNext={() => {
          const nextLevel = roundSummary?.nextLevel ?? null;
          if (nextLevel) {
            setCurrentGameLevel('alphabet', nextLevel);
            startNewRound(nextLevel);
            return;
          }
          startNewRound(currentLevel);
        }}
        onBackHome={() => replaceTo('/')}
        onTryRecovery={(suggestedLevel) => {
          activateRecoveryMode('alphabet', suggestedLevel);
          startNewRound(suggestedLevel);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary.light,
  },
  safeArea: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 1,
  },
  headerSpacer: {
    width: 50,
    height: 50,
  },
  scoreRow: {
    width: '100%',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  pauseButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
  },
  pauseIcon: {
    width: 50,
    height: 50,
  },

  titleContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.secondary.main,
    elevation: 4,
    marginLeft: -30,
  },
  title: {
    fontFamily: 'SuperWonder',
    fontSize: 22,
    color: Colors.secondary.dark,

  },
  timerText: {
    marginTop: 8,
    fontFamily: 'SuperWonder',
    fontSize: 24,
    color: Colors.candy.lemon,
    textShadowColor: 'rgba(120, 80, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  content: {
    flex: 1,
    width: '100%',
  },
  contentScroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: verticalScale(20),
  },
  contentScrollCompact: {
    paddingBottom: verticalScale(10),
  },
  boardContainer: {
    width: '92%',
    maxWidth: 560,
    aspectRatio: 0.78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  boardOverlay: {
    position: 'absolute',
    left: '9%',
    right: '9%',
    top: '10%',
    bottom: '14%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lettersGrid: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
  },
  letterWrapper: {
    width: Platform.OS === 'web' ? '18%' : '19%',
    aspectRatio: 1,
    marginHorizontal: '0.5%',
    marginVertical: 6,
  },
  pressableContainer: {
    flex: 1,
  },
  letterButton: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
  },
  letterText: {
    fontFamily: 'SuperWonder',
    fontSize: 28,
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  letterTextCompact: {
    fontSize: scale(22),
  },
  shine: {
    position: 'absolute',
    top: 3,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  footer: {
    position: 'absolute',
    // bottom is set dynamically via insets.bottom in the component
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  // placeholderText + countdownText styles moved to shared GameCountdown component
  progressContainer: {
    marginTop: 44,
    marginBottom: 14,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  progressContainerCompact: {
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
    paddingHorizontal: scale(14),
  },
  progressText: {
    fontFamily: 'SuperWonder',
    fontSize: 34,
    color: Colors.candy.pink,
    textAlign: 'center',
    textShadowColor: 'rgba(180, 0, 80, 0.35)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  progressSubText: {
    marginTop: 6,
    fontFamily: 'SuperWonder',
    fontSize: 20,
    color: Colors.candy.mint,
    textShadowColor: 'rgba(0, 100, 80, 0.35)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: 'center',
  },

});
