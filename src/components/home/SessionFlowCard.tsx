import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { scale, verticalScale } from '@/utils/responsive';

type SessionFlowCardProps = {
  completedRounds: number;
  targetRounds: number;
  streakDays: number;
  shieldAvailable: boolean;
};

export const SessionFlowCard: React.FC<SessionFlowCardProps> = ({
  completedRounds,
  targetRounds,
  streakDays,
  shieldAvailable,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.goalBlock}>
        <Text style={styles.goalText}>
          🎯 Mini Goal: {completedRounds}/{targetRounds} rounds
        </Text>
        <Text style={styles.goalText}>
          🔥 Streak: {streakDays} {shieldAvailable ? '🛡️ Ready' : '🛡️ Used'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: scale(16),
    borderWidth: 2,
    borderColor: Colors.white,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    gap: verticalScale(8),
    minWidth: scale(170),
  },
  goalBlock: {
    gap: verticalScale(2),
  },
  goalText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(11),
    color: Colors.neutral[700],
  },
});
