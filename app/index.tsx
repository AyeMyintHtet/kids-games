import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants';

/**
 * Home Screen - Welcome screen for kids.
 * Demonstrates use of Reanimated for 60FPS animations.
 */
export default function HomeScreen() {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Subtle bounce animation on mount
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withSpring(1.05, { damping: 2 }),
        withSpring(1, { damping: 2 })
      ),
      -1, // Infinite repeat
      true
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const handlePress = () => {
    // Haptic feedback for sensory engagement (important for kids)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View style={styles.container}>
      <Animated.View style={animatedStyle}>
        <Text style={styles.title}>🎮 Kids Games</Text>
      </Animated.View>

      <Text style={styles.subtitle}>Learn & Play!</Text>

      <Pressable style={styles.button} onPress={handlePress}>
        <Link href="/games" style={styles.buttonText}>
          Start Playing
        </Link>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: Colors.primary[500],
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    color: Colors.secondary[500],
    marginBottom: 40,
  },
  button: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
});
