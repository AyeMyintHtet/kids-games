import { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, withRepeat } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { TactileButton } from '@/components/TactileButton';
import { LinearGradient } from 'expo-linear-gradient';

const BACKGROUND_IMAGE = require('@/assets/images/alphabet/background.png');
const BOARD_IMAGE = require('@/assets/images/alphabet/board.png');

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const shuffleLetters = (letters: string[]) => {
  const shuffled = [...letters];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper to get consistent colors for letters
const getLetterColor = (index: number) => {
  const colors = [
    Colors.candy.pink, Colors.candy.mint, Colors.candy.lemon,
    Colors.candy.skyBlue, Colors.candy.lavender, Colors.candy.peach,
    Colors.primary.main, Colors.accent.main, Colors.fun.purple
  ];
  return colors[index % colors.length];
};

const AnimatedLetterButton = ({
  letter,
  index,
  isCorrect,
  shakeTrigger,
  onPress,
}: {
  letter: string;
  index: number;
  isCorrect: boolean;
  shakeTrigger: number;
  onPress: (letter: string) => void;
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
            { backgroundColor: color, opacity: isCorrect ? 0 : 1 },
            animatedStyle
          ]}
        >
          <Text style={styles.letterText}>{letter}</Text>
          {/* Shine effect */}
          <View style={styles.shine} />
        </Animated.View>
      </Pressable>
    </View>
  );
};

export const AlphabetGameScreen = () => {
  const router = useRouter();
  const [gamePhase, setGamePhase] = useState<'intro' | 'countdown' | 'playing'>('intro');
  const [countdown, setCountdown] = useState(3);
  const [shuffledLetters, setShuffledLetters] = useState<string[]>(() => shuffleLetters(ALPHABET));
  const [nextLetterIndex, setNextLetterIndex] = useState(0);
  const [correctLetters, setCorrectLetters] = useState<Set<string>>(() => new Set());
  const [shakeTickByLetter, setShakeTickByLetter] = useState<Record<string, number>>({});
  const [wrongCount, setWrongCount] = useState(0);
  const [roundStartedAt, setRoundStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);

  // Animation Values
  const boardScale = useSharedValue(0);
  const giveUpModalScale = useSharedValue(0.85);
  const mascotScale = useSharedValue(1);
  const stickerRotate = useSharedValue(0);

  const boardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boardScale.value }],
  }));
  const giveUpModalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: giveUpModalScale.value }],
  }));
  const mascotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mascotScale.value }],
  }));
  const stickerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${stickerRotate.value}deg` }],
  }));
  const expectedLetter = ALPHABET[nextLetterIndex];
  const isRoundComplete = nextLetterIndex >= ALPHABET.length;
  const formatElapsed = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const startNewRound = () => {
    setShuffledLetters(shuffleLetters(ALPHABET));
    setNextLetterIndex(0);
    setCorrectLetters(new Set());
    setShakeTickByLetter({});
    setWrongCount(0);
    setRoundStartedAt(Date.now());
    setElapsedMs(0);
    boardScale.value = withSequence(
      withTiming(0.9, { duration: 0 }),
      withSpring(1, { damping: 12, stiffness: 100 })
    );
  };

  const handleLetterPress = (letter: string) => {
    if (gamePhase !== 'playing' || isRoundComplete || correctLetters.has(letter)) {
      return;
    }

    if (letter === expectedLetter) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCorrectLetters((prev) => {
        const next = new Set(prev);
        next.add(letter);
        return next;
      });

      const updatedIndex = nextLetterIndex + 1;
      setNextLetterIndex(updatedIndex);

      if (updatedIndex === ALPHABET.length) {
        if (roundStartedAt) {
          setElapsedMs(Date.now() - roundStartedAt);
        }
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
    router.replace('/');
  };

  // Intro Sequence
  useEffect(() => {
    let isMounted = true;

    const runSequence = async () => {
      // 1. Show "Ready for Alphabet?" for 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!isMounted) return;

      setGamePhase('countdown');

      // 2. Countdown 3..2..1
      for (let i = 3; i >= 1; i--) {
        setCountdown(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!isMounted) return;
      }

      // 3. Start Game
      setGamePhase('playing');
      setRoundStartedAt(Date.now());
      setElapsedMs(0);

      // 4. Trigger Board Squeeze Animation (Pop in)
      boardScale.value = withSequence(
        withTiming(0.8, { duration: 0 }), // Start slightly smaller
        withSpring(1, { damping: 12, stiffness: 100 }) // Spring to full size
      );
    };

    runSequence();
    return () => {
      isMounted = false;
    };
  }, []);

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
    if (!showGiveUpModal) {
      giveUpModalScale.value = 0.85;
      mascotScale.value = 1;
      stickerRotate.value = 0;
      return;
    }

    giveUpModalScale.value = withSequence(
      withTiming(0.9, { duration: 0 }),
      withSpring(1, { damping: 10, stiffness: 160 })
    );

    mascotScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );

    stickerRotate.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 550, easing: Easing.inOut(Easing.sin) }),
        withTiming(3, { duration: 550, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [showGiveUpModal, giveUpModalScale, mascotScale, stickerRotate]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background Image using absolute Image from expo-image */}
      <Image
        source={BACKGROUND_IMAGE}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Alphabet Fun</Text>
          </View>
          {gamePhase === 'playing' && (
            <Text style={styles.timerText}>Time: {formatElapsed(elapsedMs)}</Text>
          )}
        </View>

        {/* Content Area */}
        <View style={styles.content}>

          {gamePhase === 'intro' && (
            <Text style={styles.placeholderText}>Ready for ABCs?</Text>
          )}

          {gamePhase === 'countdown' && (
            <Text style={styles.countdownText}>{countdown}</Text>
          )}

          {gamePhase === 'playing' && (
            <>
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  {isRoundComplete ? 'Awesome! You finished A to Z!' : `Tap Next: ${expectedLetter}`}
                </Text>
                <Text style={styles.progressSubText}>
                  Correct: {nextLetterIndex}/26 • Mistakes: {wrongCount}
                </Text>
              </View>

              <Animated.View style={[styles.boardContainer, boardAnimatedStyle]}>
                <Image
                  source={BOARD_IMAGE}
                  style={styles.boardImage}
                  contentFit="fill"
                />

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
                      />
                    ))}
                  </View>
                </View>
              </Animated.View>

              <View style={styles.footer}>
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
                <TactileButton
                  onPress={openGiveUpModal}
                  color={Colors.fun.coral}
                  size="small"
                  label="Give Up"
                  textStyle={{ color: Colors.white, fontSize: 32 }}
                  style={{
                    borderRadius: 30,
                    minWidth: 160,
                    paddingHorizontal: 0,
                    paddingVertical: 0,
                  }}
                />
              </View>
            </>
          )}

        </View>
      </SafeAreaView>

      {showGiveUpModal && (
        <View style={styles.modalBackdrop}>
          <Animated.View style={[styles.giveUpModalCard, giveUpModalAnimatedStyle]}>
            <LinearGradient
              colors={['#FFFDF0', '#FFEFF8', '#EAF6FF']}
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

              <Text style={styles.giveUpEmoji}>🌈 🐻 ⭐</Text>
              <Text style={styles.giveUpTitle}>Give Up For Now?</Text>
              <Text style={styles.giveUpMessage}>
                You can come back and play again anytime.
              </Text>

              <View style={styles.sparkleRow}>
                <Text style={styles.sparkleText}>✨</Text>
                <Text style={styles.sparkleText}>🧸</Text>
                <Text style={styles.sparkleText}>✨</Text>
              </View>

              <View style={styles.giveUpButtonsRow}>
                <TactileButton
                  onPress={handleCancelGiveUp}
                  color={Colors.secondary.main}
                  size="small"
                  emoji="😊"
                  label="NO"
                  textStyle={styles.giveUpButtonText}
                  style={styles.giveUpNoButton}
                />
                <TactileButton
                  onPress={handleConfirmGiveUp}
                  color={Colors.fun.coral}
                  size="small"
                  emoji="👋"
                  label="YES"
                  textStyle={styles.giveUpButtonText}
                  style={styles.giveUpYesButton}
                />
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      )}
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
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  backButtonText: {
    fontSize: 24,
  },
  titleContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.secondary.main,
    elevation: 4,
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
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    width: '100%',
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
    top: '22%',
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
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: 'SuperWonder',
    fontSize: 48,
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    textAlign: 'center',
  },
  countdownText: {
    fontFamily: 'SuperWonder',
    fontSize: 120,
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 8,
  },
  progressContainer: {
    marginBottom: 14,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  progressText: {
    fontFamily: 'SuperWonder',
    fontSize: 34,
    color: Colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  progressSubText: {
    marginTop: 6,
    fontFamily: 'SuperWonder',
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
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
    fontFamily: 'SuperWonder',
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
  giveUpEmoji: {
    fontSize: 28,
    marginTop: 12,
    marginBottom: 8,
  },
  giveUpTitle: {
    fontFamily: 'SuperWonder',
    fontSize: 34,
    color: Colors.secondary.dark,
    textAlign: 'center',
  },
  giveUpMessage: {
    marginTop: 8,
    fontFamily: 'SuperWonder',
    fontSize: 22,
    color: Colors.primary.dark,
    textAlign: 'center',
    lineHeight: 30,
  },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 2,
  },
  sparkleText: {
    fontSize: 26,
    marginHorizontal: 6,
  },
  giveUpButtonsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 14,
  },
  giveUpNoButton: {
    borderRadius: 44,
    minWidth: 120,
  },
  giveUpYesButton: {
    borderRadius: 44,
    minWidth: 120,
  },
  giveUpButtonText: {
    color: Colors.white,
    fontSize: 30,
  },
});
