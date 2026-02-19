import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { type GameKey, useAppStore } from '@/store/useAppStore';
import { scale } from '@/utils/responsive';

/**
 * Score badge component.
 * Displays the user's total score from the global store.
 */
type ScoreBadgeProps = {
  game?: GameKey;
};

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ game }) => {
  const { progress } = useAppStore();
  const bestScore = game ? progress.gameStats[game].bestScore : null;

  return (
    <View style={styles.scoreBadge}>
      <View style={styles.row}>
        <Text style={styles.trophyEmoji}>🏆</Text>
        <Text style={styles.scoreText}>TOTAL: {progress.totalScore}</Text>
      </View>
      {game && (
        <Text style={styles.bestText}>BEST THIS GAME: {bestScore}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  scoreBadge: {
    alignItems: 'flex-start',
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trophyEmoji: {
    fontSize: scale(24),
    marginRight: 8,
  },
  scoreText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(16),
    color: Colors.neutral[800],
  },
  bestText: {
    marginTop: 2,
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(11),
    color: Colors.neutral[700],
  },
});
