import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PopBox } from '@/components/PopBox';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useAppStore } from '@/store/useAppStore';
import {
  buildParentWeeklyReport,
  formatDurationLabel,
} from '@/features/parent-progress/model/weeklyReport';
import { scale, verticalScale } from '@/utils/responsive';

type ParentProgressPopupProps = {
  visible: boolean;
  onClose: () => void;
};

export const ParentProgressPopup: React.FC<ParentProgressPopupProps> = ({
  visible,
  onClose,
}) => {
  const activityLog = useAppStore((state) => state.activityLog);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const report = useMemo(() => buildParentWeeklyReport(activityLog), [activityLog]);
  const scrollMaxHeight = useMemo(() => {
    const viewportHeight = windowHeight - insets.top - insets.bottom;
    const safeCap = viewportHeight * 0.58;
    return Math.max(verticalScale(260), Math.min(verticalScale(460), safeCap));
  }, [insets.bottom, insets.top, windowHeight]);

  const strongestSkill = useMemo(() => {
    if (report.gameSummaries.length === 0) return null;
    const ranked = [...report.gameSummaries].sort((a, b) => {
      const scoreA = a.avgAccuracy * 0.6 + a.winRate * 0.4;
      const scoreB = b.avgAccuracy * 0.6 + b.winRate * 0.4;
      return scoreB - scoreA;
    });
    return ranked[0];
  }, [report.gameSummaries]);

  return (
    <PopBox
      visible={visible}
      onClose={onClose}
      title="Parent Progress"
      variant="purple"
    >
      <ScrollView
        style={[styles.scroll, { maxHeight: scrollMaxHeight }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
        nestedScrollEnabled
      >
        <Text style={styles.subtitle}>
          Weekly classroom-style snapshot for parents and teachers.
        </Text>

        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>{report.periodLabel}</Text>
          <Text style={styles.overviewText}>
            🕒 Tracked time: {formatDurationLabel(report.totalTimeMs)}
          </Text>
          <Text style={styles.overviewText}>🎮 Rounds played: {report.totalRounds}</Text>
          <Text style={styles.overviewText}>📅 Active days: {report.activeDays}/7</Text>
          {strongestSkill && (
            <Text style={styles.overviewText}>
              🌟 Strongest area: {strongestSkill.shortLabel}
            </Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Skill Breakdown</Text>
          {report.gameSummaries.map((item) => (
            <View key={item.game} style={styles.skillRow}>
              <View style={styles.skillHeaderRow}>
                <Text style={styles.skillTitle}>
                  {item.emoji} {item.title}
                </Text>
                <Text style={styles.skillMeta}>{item.rounds} rounds</Text>
              </View>
              <Text style={styles.skillText}>Accuracy: {Math.round(item.avgAccuracy * 100)}%</Text>
              <Text style={styles.skillText}>Completion: {Math.round(item.winRate * 100)}%</Text>
              <Text style={styles.skillText}>Time: {formatDurationLabel(item.totalTimeMs)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Skills Improved</Text>
          {report.improvedSkills.map((line, index) => (
            <Text key={`${line}-${index}`} style={styles.listText}>
              ✅ {line}
            </Text>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Focus Areas</Text>
          {report.weakAreas.map((item) => (
            <View key={item.game} style={styles.focusCard}>
              <Text style={styles.focusTitle}>{item.title}</Text>
              <Text style={styles.focusText}>Why: {item.reason}</Text>
              <Text style={styles.focusText}>Plan: {item.recommendation}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </PopBox>
  );
};

const styles = StyleSheet.create({
  scroll: {},
  content: {
    gap: verticalScale(8),
    paddingBottom: verticalScale(6),
  },
  subtitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(12),
    color: Colors.neutral[700],
    textAlign: 'center',
  },
  overviewCard: {
    borderRadius: scale(16),
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(8),
    gap: verticalScale(3),
  },
  overviewTitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(14),
    color: Colors.fun.purple,
  },
  overviewText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(11),
    color: Colors.neutral[700],
  },
  sectionCard: {
    borderRadius: scale(16),
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(8),
    gap: verticalScale(5),
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(13),
    color: Colors.secondary.dark,
  },
  skillRow: {
    borderRadius: scale(12),
    backgroundColor: '#F7F8FF',
    borderWidth: 1,
    borderColor: '#E4E7FF',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(6),
    gap: verticalScale(1),
  },
  skillHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillTitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(12),
    color: Colors.neutral[800],
  },
  skillMeta: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(10),
    color: Colors.secondary.dark,
  },
  skillText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(10),
    color: Colors.neutral[700],
  },
  listText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(11),
    color: Colors.neutral[700],
  },
  focusCard: {
    borderRadius: scale(12),
    backgroundColor: '#FFF7EA',
    borderWidth: 1,
    borderColor: '#FFDFAE',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(6),
    gap: verticalScale(2),
  },
  focusTitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(12),
    color: '#AD6A00',
  },
  focusText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(10),
    color: Colors.neutral[700],
  },
});
