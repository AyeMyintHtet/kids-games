import { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  StatusBar,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCloudTransition } from '@/hooks/useCloudTransition';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { TactileButton } from '@/components/TactileButton';
import { Colors } from '@/constants/colors';
import { ScoreBadge } from '@/components/ScoreBadge';
import { useAppStore } from '@/store/useAppStore';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { CelebrationEffect } from '@/components/CelebrationEffect';
import { GameCountdown } from '@/components/GameCountdown';
import { GiveUpModal } from '@/components/GiveUpModal';
import { RoundResultPopup } from '@/components/RoundResultPopup';
import { generateMathQuestion } from '@/features/math-game/model/question';
import {
  getMathLevelConfig,
  type MathOperation,
} from '@/features/progression/model/progression';
import {
  applyScoreFormula,
  getComboBonus,
  getSpeedBonus,
  toAccuracy,
} from '@/features/score/model/scoring';
import {
  isSmallHeightDevice,
  isVerySmallHeightDevice,
  scale,
  verticalScale,
} from '@/utils/responsive';
import type { RoundSummary } from '@/store/useAppStore';

const BACKGROUND_IMAGE = require('@/assets/images/math/background.png');
// Using the requested path for the board image
// If this file does not exist, please ensure it is added to the assets folder.
const BOARD_IMAGE = require('@/assets/images/math/board.png');
const WRONG_IMAGE = require('@/assets/images/math/wrong.png');
const PAUSE_ICON = require('@/assets/images/pause.png');

const WRONG_SOUND = require('@/assets/sounds/wrong.mp3');
const CORRECT_SOUND = require('@/assets/sounds/correct.mp3');
const BRAVO_SOUND = require('@/assets/sounds/bravo.mp3');
const EXCELLENT_SOUND = require('@/assets/sounds/excellent.mp3');

// ... (existing imports)

export const MathGameScreen = () => {
  const { goBack } = useCloudTransition();
  const [sound, setSound] = useState<Audio.Sound>();
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);
  const difficulty = useAppStore((state) => state.settings.difficulty);
  const addScore = useAppStore((state) => state.addScore);
  const recordGameResult = useAppStore((state) => state.recordGameResult);
  const currentLevel = useAppStore((state) => state.progression.games.math.currentLevel);
  const setCurrentGameLevel = useAppStore((state) => state.setCurrentGameLevel);
  const activateRecoveryMode = useAppStore((state) => state.activateRecoveryMode);
  const mathOperationPrefs = useAppStore((state) => state.settings.mathOperationPrefs);
  const levelConfig = useMemo(() => getMathLevelConfig(currentLevel), [currentLevel]);
  const parentEnabledOperations = useMemo<MathOperation[]>(() => {
    const operationOrder: MathOperation[] = ['add', 'subtract', 'multiply', 'modulo'];
    const enabled = operationOrder.filter((operation) => mathOperationPrefs[operation]);
    return enabled.length > 0 ? enabled : ['add'];
  }, [mathOperationPrefs]);
  const isCompact = isSmallHeightDevice;
  const isVeryCompact = isVerySmallHeightDevice;
  const boardHeight = isVeryCompact ? verticalScale(148) : isCompact ? verticalScale(176) : 200;
  const questionFontSize = isVeryCompact ? scale(44) : isCompact ? scale(54) : 64;
  const questionMarkSize = isVeryCompact ? scale(58) : isCompact ? scale(68) : 80;
  const answersTopMargin = isVeryCompact ? verticalScale(18) : isCompact ? verticalScale(26) : 40;
  const answersContainerWidth = isVeryCompact ? '92%' : isCompact ? '88%' : '80%';
  const answerButtonHeight = isVeryCompact ? verticalScale(76) : isCompact ? verticalScale(86) : 100;
  const answerTextSize = isVeryCompact ? scale(30) : isCompact ? scale(36) : 40;
  const headerRightWidth = isVeryCompact ? scale(130) : isCompact ? scale(140) : 150;
  const headerSidePadding = isVeryCompact ? scale(12) : scale(20);
  const titleFontSize = isVeryCompact ? scale(20) : isCompact ? scale(22) : 24;
  const wrongIconSize = isVeryCompact ? scale(44) : isCompact ? scale(52) : 60;
  const headerTopPadding = isVeryCompact ? verticalScale(2) : verticalScale(10);
  const roundQuestionCount = levelConfig.questionCount;
  const createQuestionForLevel = (level: number) => {
    const config = getMathLevelConfig(level);
    const operationsForLevel = config.operations.filter((operation) =>
      parentEnabledOperations.includes(operation)
    );
    const operationsForQuestion =
      operationsForLevel.length > 0 ? operationsForLevel : parentEnabledOperations;
    return generateMathQuestion({
      minOperand: config.minOperand,
      maxOperand: config.maxOperand,
      operations: operationsForQuestion,
      choicesCount: 6,
    });
  };
  // Cleanup sound
  useEffect(() => {
    return sound
      ? () => {
        sound.unloadAsync();
      }
      : undefined;
  }, [sound]);

  const playWrongSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(WRONG_SOUND);
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.log('Error playing sound', error);
    }
  };

  const playCorrectSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(CORRECT_SOUND);
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.log('Error playing sound', error);
    }
  };

  const playStreakSound = async () => {
    try {
      const isBravo = Math.random() > 0.5;
      const soundFile = isBravo ? BRAVO_SOUND : EXCELLENT_SOUND;
      const { sound } = await Audio.Sound.createAsync(soundFile);
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.log('Error playing streak sound', error);
    }
  };

  // Game Phase State — simplified with GameCountdown handling intro + countdown
  const [gamePhase, setGamePhase] = useState<'intro' | 'countdown' | 'playing'>('intro');
  const [currentData, setCurrentData] = useState(() =>
    createQuestionForLevel(currentLevel)
  );
  const [wrongAnswer, setWrongAnswer] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [roundSummary, setRoundSummary] = useState<RoundSummary | null>(null);
  const [showRoundResult, setShowRoundResult] = useState(false);

  // Animation Values
  const boardScale = useSharedValue(0);
  const contentOpacity = useSharedValue(1);
  const pauseScale = useSharedValue(1);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));
  const pauseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pauseScale.value }],
  }));

  const resetRound = (targetLevel?: number) => {
    const levelToUse = targetLevel ?? currentLevel;
    setCurrentData(createQuestionForLevel(levelToUse));
    setWrongAnswer(null);
    setStreak(0);
    setCelebrationTrigger(0);
    setRoundScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setBestStreak(0);
    setQuestionStartedAt(Date.now());
    setSessionStartedAt(null);
    setAnsweredCount(0);
    setRoundSummary(null);
    setShowRoundResult(false);
    setGamePhase('intro');
  };

  const finishRound = (outcome: 'won' | 'quit' | 'lost') => {
    const safeCorrect = outcome === 'won' ? correctCount : Math.max(0, correctCount);
    const summary = recordGameResult({
      game: 'math',
      score: roundScore,
      timeMs: sessionStartedAt ? Date.now() - sessionStartedAt : null,
      accuracy: toAccuracy(safeCorrect, wrongCount),
      streak: bestStreak,
      level: currentLevel,
      hintsUsed: wrongCount > 0,
      outcome,
    });
    setRoundSummary(summary);
    setShowRoundResult(true);
  };

  useEffect(() => {
    resetRound(currentLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel]);

  const handleAnswer = (selectedAnswer: number) => {
    if (selectedAnswer === currentData.answer) {
      // Correct!
      const responseMs = Date.now() - questionStartedAt;
      setWrongAnswer(null); // Clear previous wrong answer

      const newStreak = streak + 1;
      const nextCorrectCount = correctCount + 1;
      const nextAnsweredCount = answeredCount + 1;
      setStreak(newStreak);
      const nextBestStreak = Math.max(bestStreak, newStreak);
      setBestStreak(nextBestStreak);
      setCelebrationTrigger(prev => prev + 1); // Trigger celebration
      setCorrectCount(nextCorrectCount);
      setAnsweredCount(nextAnsweredCount);

      const earnedPoints = applyScoreFormula({
        basePoints: 10,
        speedBonus: getSpeedBonus(responseMs, {
          fastMs: 2000,
          mediumMs: 4000,
          fastBonus: 5,
          mediumBonus: 2,
          slowBonus: 0,
        }),
        comboBonus: getComboBonus(newStreak, {
          startAt: 3,
          maxBonus: 6,
        }),
        difficulty,
      });

      addScore('math', earnedPoints);
      const nextRoundScore = roundScore + earnedPoints;
      setRoundScore(nextRoundScore);

      // Play sound
      if (newStreak % 3 === 0) {
        playStreakSound();
      } else {
        playCorrectSound();
      }

      // Animate content out, wait, then in
      // "Change to opacity 0 for 700ms"
      contentOpacity.value = withSequence(
        withTiming(0, { duration: 150 }), // Disappear quickly
        withDelay(700, withTiming(1, { duration: 250 })) // Wait 700ms then reappear
      );

      if (nextAnsweredCount >= roundQuestionCount) {
        const summary = recordGameResult({
          game: 'math',
          score: nextRoundScore,
          timeMs: sessionStartedAt ? Date.now() - sessionStartedAt : null,
          accuracy: toAccuracy(nextCorrectCount, wrongCount),
          streak: nextBestStreak,
          level: currentLevel,
          hintsUsed: wrongCount > 0,
          outcome: 'won',
        });
        setRoundSummary(summary);
        setShowRoundResult(true);
        return;
      }

      // Change data while hidden (after 200ms)
      setTimeout(() => {
        setCurrentData(createQuestionForLevel(currentLevel));
        setQuestionStartedAt(Date.now());
      }, 200);

    } else {
      // Incorrect!
      setStreak(0); // Reset streak
      setWrongAnswer(selectedAnswer);
      setWrongCount((previous) => previous + 1);
      playWrongSound();
    }
  };

  /**
   * Callback from GameCountdown when 3..2..1 finishes.
   * Switches to playing phase and triggers the board pop-in animation.
   */
  const handleCountdownComplete = () => {
    setGamePhase('playing');
    setSessionStartedAt(Date.now());
    setQuestionStartedAt(Date.now());

    // Board squeeze animation (pop-in)
    boardScale.value = withSequence(
      withTiming(0.8, { duration: 0 }),
      withSpring(1, { damping: 12, stiffness: 100 })
    );
  };

  const boardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boardScale.value }],
  }));

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
    if (correctCount > 0 || wrongCount > 0 || roundScore > 0) {
      finishRound('quit');
      return;
    }
    goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <ImageBackground
        source={BACKGROUND_IMAGE}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea}>
          <View
            style={[
              styles.header,
              {
                paddingTop: headerTopPadding,
                paddingHorizontal: headerSidePadding,
              },
            ]}
          >
            <View style={styles.headerLeft}>
              <Pressable onPress={openGiveUpModal} >
                <Animated.View style={[styles.pauseButton, pauseAnimatedStyle]}>
                  <Image source={PAUSE_ICON} style={styles.pauseIcon} contentFit="contain" />
                </Animated.View>
              </Pressable>
            </View>
            <View style={[styles.titleContainer, isCompact && styles.titleContainerCompact]}>
              <Text style={[styles.title, { fontSize: titleFontSize }]}>Math Adventure</Text>
            </View>
            <View></View>
          </View>
          <View style={[styles.headerRight, { width: headerRightWidth }]}>
            <ScoreBadge game="math" />
          </View>

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
            <CelebrationEffect trigger={celebrationTrigger} />
            <View style={styles.roundMetaRow}>
              <Text style={styles.roundMetaText}>
                Level {currentLevel} · Question {Math.min(answeredCount + 1, roundQuestionCount)}/{roundQuestionCount}
              </Text>
            </View>
            {gamePhase !== 'playing' && (
              <GameCountdown
                introText={`Ready for L${currentLevel}?`}
                onComplete={handleCountdownComplete}
              />
            )}

            {gamePhase === 'playing' && (
              <>
                <Animated.View style={[{ alignItems: 'center', width: '100%' }, contentAnimatedStyle]}>
                  <Animated.View
                    style={[
                      styles.boardContainer,
                      { height: boardHeight, marginTop: isCompact ? verticalScale(12) : 20 },
                      boardAnimatedStyle,
                    ]}
                  >
                    <ImageBackground
                      source={BOARD_IMAGE}
                      style={styles.boardImage}
                      resizeMode="contain"
                    >
                      <View style={styles.questionContainer}>
                        <Text style={[styles.questionText, { fontSize: questionFontSize }]}>
                          {currentData.question}
                        </Text>
                        <View
                          style={[
                            styles.questionMarkBox,
                            { width: questionMarkSize, height: questionMarkSize },
                          ]}
                        >
                          <Text style={[styles.questionMark, { fontSize: questionFontSize }]}>?</Text>
                        </View>
                      </View>
                    </ImageBackground>
                  </Animated.View>

                  <View
                    style={[
                      styles.answersContainer,
                      {
                        marginTop: answersTopMargin,
                        width: answersContainerWidth,
                      },
                    ]}
                  >
                    <View style={styles.answersRow}>
                      {currentData.choices.map((num) => (
                        <TactileButton
                          key={num}
                          onPress={() => handleAnswer(num)}
                          color={Colors.fun.pink}
                          style={[
                            styles.answerButton,
                            {
                              height: answerButtonHeight,
                              borderRadius: isCompact ? scale(30) : 40,
                            },
                          ]}
                        >
                          {wrongAnswer === num ? (
                            <Image
                              source={WRONG_IMAGE}
                              style={{ width: wrongIconSize, height: wrongIconSize }}
                              resizeMode="contain"
                            />
                          ) : (
                            <Text style={[styles.answerText, { fontSize: answerTextSize }]}>
                              {num}
                            </Text>
                          )}
                        </TactileButton>
                      ))}
                    </View>
                  </View>
                </Animated.View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
      {showGiveUpModal && (
        <GiveUpModal
          onConfirm={handleConfirmGiveUp}
          onCancel={handleCancelGiveUp}
        />
      )}
      <RoundResultPopup
        visible={showRoundResult}
        summary={roundSummary}
        gameTitle="Math Adventure"
        onPlayAgain={() => {
          resetRound(currentLevel);
        }}
        onPlayNext={() => {
          const nextLevel = roundSummary?.nextLevel ?? null;
          if (nextLevel) {
            setCurrentGameLevel('math', nextLevel);
            resetRound(nextLevel);
            return;
          }
          resetRound(currentLevel);
        }}
        onBackHome={goBack}
        onTryRecovery={(suggestedLevel) => {
          activateRecoveryMode('math', suggestedLevel);
          resetRound(suggestedLevel);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    paddingHorizontal: 20,
    width: '100%',
  },
  headerLeft: {
    // flex: 1,
    // alignItems: 'flex-start',
  },
  headerRight: {
    width: 150,
    marginLeft: 20,
    marginTop: 10
  },
  backButton: {
    width: 50,
    height: 50,
  },
  backButtonText: {
    fontSize: 24,
  },
  titleContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary.main,
    marginRight: 20
  },
  titleContainerCompact: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(7),
    marginRight: scale(8),
  },
  title: {
    fontFamily: 'SuperWonder',
    fontSize: 24,
    color: Colors.primary[800],
    alignSelf: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 0,
  },
  contentScroll: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingBottom: verticalScale(24),
  },
  contentScrollCompact: {
    paddingBottom: verticalScale(14),
  },
  roundMetaRow: {
    marginTop: verticalScale(8),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(14),
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  roundMetaText: {
    fontFamily: 'SuperWonder',
    fontSize: scale(12),
    color: Colors.secondary.dark,
  },
  // placeholderText + countdownText styles moved to shared GameCountdown component
  boardContainer: {
    width: '90%',
    height: 200, // Fixed height for better control
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  boardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  questionText: {
    fontFamily: 'SuperWonder',
    fontSize: 64,
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  questionMarkBox: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Semi-transparent dark background
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  questionMark: {
    fontFamily: 'SuperWonder',
    fontSize: 64,
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  answersContainer: {
    marginTop: 40,
    gap: 20,
    width: '80%',
  },
  answersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    gap: 6,
  },
  answerButton: {
    width: '30%',
    height: 100,
    borderRadius: 40,
    backgroundColor: Colors.fun.pink, // Updated to use theme color
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)', // Subtle highlight
  },
  answerText: {
    fontFamily: 'SuperWonder',
    fontSize: 40,
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
  footer: {
    position: 'absolute',
    bottom: 40,
  }
});
