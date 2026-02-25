import {
  buildParentWeeklyReport,
  formatDurationLabel,
  type ParentReportActivityEntry,
} from '@/features/parent-progress/model/weeklyReport';

const DAY_MS = 24 * 60 * 60 * 1000;

const buildEntry = (
  now: Date,
  data: {
    game: ParentReportActivityEntry['game'];
    daysAgo: number;
    accuracy: number;
    outcome: ParentReportActivityEntry['outcome'];
    timeMs?: number | null;
    starsEarned?: number;
  }
): ParentReportActivityEntry => {
  const playedAt = new Date(now.getTime() - data.daysAgo * DAY_MS).toISOString();
  const dateKey = playedAt.slice(0, 10);

  return {
    game: data.game,
    score: 50,
    accuracy: data.accuracy,
    timeMs: data.timeMs ?? 42_000,
    outcome: data.outcome,
    starsEarned: data.starsEarned ?? 2,
    dateKey,
    playedAt,
  };
};

describe('parent weekly report', () => {
  test('summarizes weekly rounds/time and game stats', () => {
    const now = new Date('2026-02-24T12:00:00.000Z');
    const rows: ParentReportActivityEntry[] = [
      buildEntry(now, { game: 'math', daysAgo: 1, accuracy: 0.85, outcome: 'won', timeMs: 40_000 }),
      buildEntry(now, { game: 'alphabet', daysAgo: 2, accuracy: 0.8, outcome: 'won', timeMs: 55_000 }),
      buildEntry(now, { game: 'animals', daysAgo: 3, accuracy: 0.6, outcome: 'lost', timeMs: 62_000 }),
      buildEntry(now, { game: 'math', daysAgo: 4, accuracy: 0.9, outcome: 'won', timeMs: 35_000 }),
    ];

    const report = buildParentWeeklyReport(rows, { now });

    expect(report.totalRounds).toBe(4);
    expect(report.activeDays).toBeGreaterThanOrEqual(4);
    expect(report.totalTimeMs).toBe(192_000);
    expect(report.gameSummaries.find((item) => item.game === 'math')?.rounds).toBe(2);
    expect(report.gameSummaries.find((item) => item.game === 'math')?.winRate).toBe(1);
  });

  test('detects improved skills and weak areas', () => {
    const now = new Date('2026-02-24T12:00:00.000Z');
    const rows: ParentReportActivityEntry[] = [
      // Previous week math (weaker)
      buildEntry(now, { game: 'math', daysAgo: 10, accuracy: 0.55, outcome: 'lost' }),
      buildEntry(now, { game: 'math', daysAgo: 11, accuracy: 0.58, outcome: 'quit' }),
      buildEntry(now, { game: 'math', daysAgo: 12, accuracy: 0.6, outcome: 'won' }),
      buildEntry(now, { game: 'math', daysAgo: 13, accuracy: 0.57, outcome: 'lost' }),

      // Current week math (improved)
      buildEntry(now, { game: 'math', daysAgo: 1, accuracy: 0.86, outcome: 'won' }),
      buildEntry(now, { game: 'math', daysAgo: 2, accuracy: 0.83, outcome: 'won' }),
      buildEntry(now, { game: 'math', daysAgo: 3, accuracy: 0.8, outcome: 'won' }),
      buildEntry(now, { game: 'math', daysAgo: 4, accuracy: 0.84, outcome: 'won' }),

      // Current week weak ABC exposure
      buildEntry(now, { game: 'alphabet', daysAgo: 1, accuracy: 0.6, outcome: 'lost' }),
    ];

    const report = buildParentWeeklyReport(rows, { now });

    expect(report.improvedSkills.some((line) => line.includes('Math accuracy improved'))).toBe(true);
    expect(report.weakAreas.length).toBeGreaterThan(0);
    expect(report.weakAreas.some((area) => area.game === 'alphabet')).toBe(true);
  });

  test('formats durations for parent UI', () => {
    expect(formatDurationLabel(0)).toBe('0m');
    expect(formatDurationLabel(45 * 60 * 1000)).toBe('45m');
    expect(formatDurationLabel(2 * 60 * 60 * 1000)).toBe('2h');
  });
});
