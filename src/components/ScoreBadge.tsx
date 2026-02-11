import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/store/useAppStore';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

/**
 * Score badge component.
 * Displays the user's total score from the global store.
 */
export const ScoreBadge: React.FC = () => {
  const { progress } = useAppStore();

  return (
    <View style={styles.scoreBadge}>
      <Text style={styles.trophyEmoji}>🏆</Text>
      <Text style={styles.scoreText}>SCORE: {progress.totalScore}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.main,
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    borderBottomWidth: 4,
    borderBottomColor: Colors.accent.dark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  trophyEmoji: {
    fontSize: scale(24),
    marginRight: 8,
  },
  scoreText: {
    fontFamily: 'SuperWonder',
    fontSize: scale(16),
    color: Colors.neutral[800],
  },
});
