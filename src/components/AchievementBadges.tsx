import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useAppStore } from '@/store/useAppStore';
import { scale, verticalScale } from '@/utils/responsive';
import { ACHIEVEMENTS } from '@/features/achievements/model/achievements';

export const AchievementBadges: React.FC = () => {
  const unlocked = useAppStore((state) => state.achievements.unlocked);
  const unlockedSet = new Set(unlocked);
  const unlockedCount = unlocked.length;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Achievements</Text>
      <View style={styles.row}>
        {ACHIEVEMENTS.map((achievement) => {
          const isUnlocked = unlockedSet.has(achievement.id);
          return (
            <View
              key={achievement.id}
              style={[
                styles.badge,
                isUnlocked ? styles.badgeUnlocked : styles.badgeLocked,
              ]}
            >
              <Text style={styles.emoji}>
                {isUnlocked ? achievement.emoji : '🔒'}
              </Text>
              <Text
                style={[
                  styles.badgeLabel,
                  isUnlocked
                    ? styles.badgeLabelUnlocked
                    : styles.badgeLabelLocked,
                ]}
              >
                {achievement.title}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.progressText}>
        {unlockedCount}/{ACHIEVEMENTS.length} unlocked
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: scale(350),
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: scale(20),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(14),
    color: Colors.secondary.dark,
    textAlign: 'center',
    marginBottom: verticalScale(6),
  },
  row: {
    flexDirection: 'row',
    gap: scale(6),
    justifyContent: 'space-between',
  },
  badge: {
    flex: 1,
    borderRadius: scale(12),
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(4),
    alignItems: 'center',
    borderWidth: 2,
  },
  badgeUnlocked: {
    backgroundColor: 'rgba(249,225,4,0.25)',
    borderColor: Colors.accent.main,
  },
  badgeLocked: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderColor: Colors.neutral[300],
  },
  emoji: {
    fontSize: scale(16),
    marginBottom: verticalScale(2),
  },
  badgeLabel: {
    textAlign: 'center',
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(10),
  },
  badgeLabelUnlocked: {
    color: Colors.neutral[800],
  },
  badgeLabelLocked: {
    color: Colors.neutral[500],
  },
  progressText: {
    marginTop: verticalScale(6),
    textAlign: 'center',
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(10),
    color: Colors.secondary[800],
  },
});

