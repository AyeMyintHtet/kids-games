import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  StatusBar,
  Text,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { TactileButton } from '@/components/TactileButton';
import { Colors } from '@/constants/colors';

const BACKGROUND_IMAGE = require('@/assets/images/math/background.png');
// Using the requested path for the board image
// If this file does not exist, please ensure it is added to the assets folder.
const BOARD_IMAGE = require('@/assets/images/math/board.png');

export const MathGameScreen = () => {
  const router = useRouter();

  // Game Phase State
  const [gamePhase, setGamePhase] = useState<'intro' | 'countdown' | 'playing'>('intro');
  const [countdown, setCountdown] = useState(3);

  // Animation Values
  const boardScale = useSharedValue(0);

  // Intro Sequence
  useEffect(() => {
    let isMounted = true;

    const runSequence = async () => {
      // 1. Show "Ready for Math?" for 1 second
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

  const boardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boardScale.value }],
  }));



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
            <TactileButton
              onPress={() => router.back()}
              color={Colors.candy.pink}
              size="small"
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>🏠</Text>
            </TactileButton>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Math Adventure</Text>
            </View>
            <View style={{ width: 50 }} />
          </View>

          <View style={styles.content}>
            {gamePhase === 'intro' && (
              <Text style={styles.placeholderText}>Ready for Math?</Text>
            )}

            {gamePhase === 'countdown' && (
              <Text style={styles.countdownText}>{countdown}</Text>
            )}

            {gamePhase === 'playing' && (
              <Animated.View style={[styles.boardContainer, boardAnimatedStyle]}>
                <ImageBackground
                  source={BOARD_IMAGE}
                  style={styles.boardImage}
                  resizeMode="contain"
                >
                  {/* Board Content will go here later */}
                </ImageBackground>
              </Animated.View>
            )}
          </View>
        </SafeAreaView>
      </ImageBackground>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
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
  },
  title: {
    fontFamily: 'SuperWonder',
    fontSize: 24,
    color: Colors.primary[800],
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start', // Changed from center to accommodate upper center board positioning
    alignItems: 'center',
    paddingTop: 40,
  },
  placeholderText: {
    fontFamily: 'SuperWonder',
    fontSize: 32,
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginTop: 200, // Push text down a bit if needed
  },
  countdownText: {
    fontFamily: 'SuperWonder',
    fontSize: 120, // Big!
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 8,
    marginTop: 150,
  },
  boardContainer: {
    width: '90%',
    aspectRatio: 1.2, // Adjust based on board image dimensions
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20, // Upper center
  },
  boardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
