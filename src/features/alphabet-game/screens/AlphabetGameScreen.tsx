import { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useCloudTransition } from '@/hooks/useCloudTransition';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, withRepeat } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { TactileButton } from '@/components/TactileButton';
import { GameCountdown } from '@/components/GameCountdown';

const BACKGROUNDS = [
  require('@/assets/images/alphabet/background.png'),
  require('@/assets/images/alphabet/background2.png'),
  require('@/assets/images/alphabet/background3.png'),
];
const PAUSE_ICON = require('@/assets/images/pause.png');
import { GiveUpModal } from '@/components/GiveUpModal';

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
  const { replaceTo } = useCloudTransition();
  const insets = useSafeAreaInsets();
  const [gamePhase, setGamePhase] = useState<'intro' | 'countdown' | 'playing'>('intro');
  const [shuffledLetters, setShuffledLetters] = useState<string[]>(() => shuffleLetters(ALPHABET));
  const [nextLetterIndex, setNextLetterIndex] = useState(0);
  const [correctLetters, setCorrectLetters] = useState<Set<string>>(() => new Set());
  const [shakeTickByLetter, setShakeTickByLetter] = useState<Record<string, number>>({});
  const [wrongCount, setWrongCount] = useState(0);
  const [roundStartedAt, setRoundStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);

  // Pick 3 unique random candy colors on mount for Timer / TapNext / Correct texts
  const CHILD_COLORS = [
    Colors.candy.pink, Colors.candy.bubblegum, Colors.candy.mint,
    Colors.candy.lavender, Colors.candy.peach, Colors.candy.lemon,
    Colors.candy.skyBlue, Colors.candy.lilac, Colors.candy.coral,
    Colors.candy.seafoam, Colors.accent.main, Colors.fun.teal,
  ];
  const [timerColor, tapNextColor, correctColor] = useMemo(() => {
    const shuffled = [...CHILD_COLORS].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1], shuffled[2]];
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    replaceTo('/');
  };

  /**
   * Callback from GameCountdown when 3..2..1 finishes.
   * Starts the playing phase, timer, and board pop-in animation.
   */
  const handleCountdownComplete = () => {
    setGamePhase('playing');
    setRoundStartedAt(Date.now());
    setElapsedMs(0);

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
            <Animated.View style={[styles.pauseButton, pauseAnimatedStyle]}>
              <Image source={PAUSE_ICON} style={styles.pauseIcon} contentFit="contain" />
            </Animated.View>
          </Pressable>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Alphabet Fun</Text>
          </View>
          <View></View>
        </View>
        {gamePhase === 'playing' && (
          <Text style={[styles.timerText, { color: timerColor }]}>Time: {formatElapsed(elapsedMs)}</Text>
        )}
        {/* Content Area */}
        <View style={styles.content}>

          {gamePhase !== 'playing' && (
            <GameCountdown
              introText="Ready for ABCs?"
              onComplete={handleCountdownComplete}
            />
          )}

          {gamePhase === 'playing' && (
            <>
              <View style={styles.progressContainer}>
                <Text style={[styles.progressText, { color: tapNextColor }]}>
                  {isRoundComplete ? 'Awesome! You finished A to Z!' : `Tap Next: ${expectedLetter}`}
                </Text>
                <Text style={[styles.progressSubText, { color: correctColor }]}>
                  Correct: {nextLetterIndex}/26 • Mistakes: {wrongCount}
                </Text>
              </View>

              <Animated.View style={[styles.boardContainer, boardAnimatedStyle]}>
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
                      />
                    ))}
                  </View>
                </View>
              </Animated.View>

              {/* Extra bottom padding accounts for Android software nav buttons */}
              <View style={[styles.footer, { bottom: Math.max(40, insets.bottom + 12) }]}>
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

        </View>
      </SafeAreaView>

      {showGiveUpModal && (
        <GiveUpModal
          onConfirm={handleConfirmGiveUp}
          onCancel={handleCancelGiveUp}
        />
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
    justifyContent: "flex-start",
    alignItems: "center",
    // paddingVertical: 20,
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
