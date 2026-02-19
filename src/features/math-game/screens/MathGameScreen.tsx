import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  StatusBar,
  Text,
  Pressable,
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


const BACKGROUND_IMAGE = require('@/assets/images/math/background.png');
// Using the requested path for the board image
// If this file does not exist, please ensure it is added to the assets folder.
const BOARD_IMAGE = require('@/assets/images/math/board.png');
const WRONG_IMAGE = require('@/assets/images/math/wrong.png');
const PAUSE_ICON = require('@/assets/images/pause.png');
import { GiveUpModal } from '@/components/GiveUpModal';

const generateQuestion = () => {
  // 1. Generate two random numbers (e.g., between 1 and 10)
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const correctAnswer = num1 + num2;

  // 2. Generate unique random distractors
  const options = new Set<number>();
  options.add(correctAnswer);

  while (options.size < 6) {
    // Generate numbers near the answer to make it challenging
    const distractor = Math.max(1, correctAnswer + (Math.floor(Math.random() * 7) - 3));
    options.add(distractor);
  }

  // 3. Shuffle the array so the answer isn't always in the same spot
  const shuffledOptions = Array.from(options).sort(() => Math.random() - 0.5);

  return {
    question: `${num1} + ${num2} =`,
    answer: correctAnswer,
    choices: shuffledOptions,
  };
};



const WRONG_SOUND = require('@/assets/sounds/wrong.mp3');
const CORRECT_SOUND = require('@/assets/sounds/correct.mp3');
const BRAVO_SOUND = require('@/assets/sounds/bravo.mp3');
const EXCELLENT_SOUND = require('@/assets/sounds/excellent.mp3');

// ... (existing imports)

export const MathGameScreen = () => {
  const { goBack } = useCloudTransition();
  const [sound, setSound] = useState<Audio.Sound>();
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);
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
  const [currentData, setCurrentData] = useState(generateQuestion());
  const { incrementScore } = useAppStore();
  const [wrongAnswer, setWrongAnswer] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);

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
  const handleAnswer = (selectedAnswer: number) => {
    if (selectedAnswer === currentData.answer) {
      // Correct!
      incrementScore(10);
      setWrongAnswer(null); // Clear previous wrong answer

      const newStreak = streak + 1;
      setStreak(newStreak);
      setCelebrationTrigger(prev => prev + 1); // Trigger celebration

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

      // Change data while hidden (after 200ms)
      setTimeout(() => {
        setCurrentData(generateQuestion());
      }, 200);

    } else {
      // Incorrect!
      setStreak(0); // Reset streak
      setWrongAnswer(selectedAnswer);
      playWrongSound();
    }
  };

  /**
   * Callback from GameCountdown when 3..2..1 finishes.
   * Switches to playing phase and triggers the board pop-in animation.
   */
  const handleCountdownComplete = () => {
    setGamePhase('playing');

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
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable onPress={openGiveUpModal} >
                <Animated.View style={[styles.pauseButton, pauseAnimatedStyle]}>
                  <Image source={PAUSE_ICON} style={styles.pauseIcon} contentFit="contain" />
                </Animated.View>
              </Pressable>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Math Adventure</Text>
            </View>
            <View></View>
          </View>
          <View style={styles.headerRight}>
            <ScoreBadge />
          </View>

          <View style={styles.content}>
            <CelebrationEffect trigger={celebrationTrigger} />
            {gamePhase !== 'playing' && (
              <GameCountdown
                introText="Ready for Math?"
                onComplete={handleCountdownComplete}
              />
            )}

            {gamePhase === 'playing' && (
              <>
                <Animated.View style={[{ alignItems: 'center', width: '100%' }, contentAnimatedStyle]}>
                  <Animated.View style={[styles.boardContainer, boardAnimatedStyle]}>
                    <ImageBackground
                      source={BOARD_IMAGE}
                      style={styles.boardImage}
                      resizeMode="contain"
                    >
                      <View style={styles.questionContainer}>
                        <Text style={styles.questionText}>{currentData.question}</Text>
                        <View style={styles.questionMarkBox}>
                          <Text style={styles.questionMark}>?</Text>
                        </View>
                      </View>
                    </ImageBackground>
                  </Animated.View>

                  <View style={styles.answersContainer}>
                    <View style={styles.answersRow}>
                      {currentData.choices.map((num) => (
                        <TactileButton
                          key={num}
                          onPress={() => handleAnswer(num)}
                          color={Colors.fun.pink}
                          style={styles.answerButton}
                        >
                          {wrongAnswer === num ? (
                            <Image
                              source={WRONG_IMAGE}
                              style={{ width: 60, height: 60 }}
                              resizeMode="contain"
                            />
                          ) : (
                            <Text style={styles.answerText}>{num}</Text>
                          )}
                        </TactileButton>
                      ))}
                    </View>
                  </View>
                </Animated.View>
              </>
            )}
          </View>
        </SafeAreaView>
      </ImageBackground>
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
  title: {
    fontFamily: 'SuperWonder',
    fontSize: 24,
    color: Colors.primary[800],
    alignSelf: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 0,
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
