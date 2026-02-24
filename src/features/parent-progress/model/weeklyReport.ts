export type ParentReportGameKey = 'math' | 'alphabet' | 'animals';

export type ParentReportActivityEntry = {
  game: ParentReportGameKey;
  score: number;
  accuracy: number;
  timeMs: number | null;
  outcome: 'won' | 'lost' | 'quit';
  starsEarned: number;
  dateKey: string;
  playedAt: string;
};

export type ParentWeeklyGameSummary = {
  game: ParentReportGameKey;
  title: string;
  shortLabel: string;
  emoji: string;
  rounds: number;
  wins: number;
  avgAccuracy: number;
  avgRoundTimeMs: number | null;
  totalTimeMs: number;
  winRate: number;
  stars: number;
};

export type ParentWeakArea = {
  game: ParentReportGameKey;
  title: string;
  reason: string;
  recommendation: string;
};

export type ParentWeeklyReport = {
  periodLabel: string;
  totalRounds: number;
  activeDays: number;
  totalTimeMs: number;
  gameSummaries: ParentWeeklyGameSummary[];
  improvedSkills: string[];
  weakAreas: ParentWeakArea[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

type GameMeta = {
  title: string;
  shortLabel: string;
  emoji: string;
  recommendation: string;
};

const GAME_META: Record<ParentReportGameKey, GameMeta> = {
  math: {
    title: 'Math Skills',
    shortLabel: 'Math',
    emoji: '🚀',
    recommendation: 'Try 2 short math rounds focused on careful counting.',
  },
  alphabet: {
    title: 'ABC Fluency',
    shortLabel: 'ABC',
    emoji: '🔤',
    recommendation: 'Replay alphabet rounds and say each letter out loud together.',
  },
  animals: {
    title: 'Memory Focus',
    shortLabel: 'Memory',
    emoji: '🐾',
    recommendation: 'Do 1 memory round daily and pause to name card pairs before tapping.',
  },
};

const clampAccuracy = (value: number): number => Math.max(0, Math.min(1, value));

const toDateMs = (value: string): number => new Date(value).getTime();

const filterByRange = (
  rows: ParentReportActivityEntry[],
  fromMs: number,
  toMs: number
): ParentReportActivityEntry[] => {
  return rows.filter((row) => {
    const playedAtMs = toDateMs(row.playedAt);
    if (!Number.isFinite(playedAtMs)) return false;
    return playedAtMs >= fromMs && playedAtMs < toMs;
  });
};

const summarizeGame = (
  rows: ParentReportActivityEntry[],
  game: ParentReportGameKey
): ParentWeeklyGameSummary => {
  const gameRows = rows.filter((row) => row.game === game);
  const measuredRows = gameRows.filter(
    (row) => typeof row.timeMs === 'number' && Number.isFinite(row.timeMs) && row.timeMs > 0
  );
  const rounds = gameRows.length;
  const wins = gameRows.filter((row) => row.outcome === 'won').length;
  const totalTimeMs = measuredRows.reduce((sum, row) => sum + (row.timeMs as number), 0);
  const avgRoundTimeMs = measuredRows.length > 0 ? Math.round(totalTimeMs / measuredRows.length) : null;
  const avgAccuracy =
    rounds > 0
      ? gameRows.reduce((sum, row) => sum + clampAccuracy(row.accuracy), 0) / rounds
      : 0;
  const stars = gameRows.reduce((sum, row) => sum + Math.max(0, Math.round(row.starsEarned)), 0);

  return {
    game,
    title: GAME_META[game].title,
    shortLabel: GAME_META[game].shortLabel,
    emoji: GAME_META[game].emoji,
    rounds,
    wins,
    avgAccuracy,
    avgRoundTimeMs,
    totalTimeMs,
    winRate: rounds > 0 ? wins / rounds : 0,
    stars,
  };
};

const formatPercent = (value: number): string => `${Math.round(value * 100)}%`;

const formatDeltaPercent = (value: number): string => {
  const pct = Math.round(Math.abs(value) * 100);
  return `${pct}%`;
};

const getImprovedSkills = (
  current: ParentWeeklyGameSummary[],
  previous: ParentWeeklyGameSummary[],
  activeDays: number
): string[] => {
  const result: string[] = [];

  for (const currentItem of current) {
    const previousItem = previous.find((item) => item.game === currentItem.game);
    if (!previousItem) continue;

    if (currentItem.rounds >= 3 && previousItem.rounds >= 3) {
      const accuracyDelta = currentItem.avgAccuracy - previousItem.avgAccuracy;
      if (accuracyDelta >= 0.05) {
        result.push(
          `${currentItem.shortLabel} accuracy improved by ${formatDeltaPercent(accuracyDelta)}.`
        );
      }

      const winRateDelta = currentItem.winRate - previousItem.winRate;
      if (winRateDelta >= 0.1) {
        result.push(
          `${currentItem.shortLabel} completion rate improved by ${formatDeltaPercent(winRateDelta)}.`
        );
      }

      if (currentItem.avgRoundTimeMs && previousItem.avgRoundTimeMs) {
        const speedGain =
          (previousItem.avgRoundTimeMs - currentItem.avgRoundTimeMs) /
          previousItem.avgRoundTimeMs;
        if (speedGain >= 0.15) {
          result.push(`${currentItem.shortLabel} response speed improved this week.`);
        }
      }
    }
  }

  if (result.length === 0 && activeDays >= 4) {
    result.push(`Learning consistency improved: active on ${activeDays}/7 days.`);
  }

  if (result.length === 0) {
    result.push('No clear growth trend yet. More sessions this week will unlock insights.');
  }

  return result.slice(0, 4);
};

const getWeakAreas = (summaries: ParentWeeklyGameSummary[]): ParentWeakArea[] => {
  const scoreSummary = (item: ParentWeeklyGameSummary): number => {
    if (item.rounds === 0) return 0;
    const exposure = Math.min(item.rounds / 10, 1);
    return item.avgAccuracy * 0.5 + item.winRate * 0.35 + exposure * 0.15;
  };

  const sorted = [...summaries].sort((a, b) => scoreSummary(a) - scoreSummary(b));

  return sorted.slice(0, 2).map((item) => {
    let reason = 'Needs more repetition for confidence.';

    if (item.rounds < 2) {
      reason = 'Not enough weekly practice yet.';
    } else if (item.avgAccuracy < 0.72) {
      reason = `Accuracy is low this week (${formatPercent(item.avgAccuracy)}).`;
    } else if (item.winRate < 0.55) {
      reason = `Completion rate is low this week (${formatPercent(item.winRate)}).`;
    } else if (item.avgRoundTimeMs && item.avgRoundTimeMs > 75_000) {
      reason = 'Rounds are taking a long time; confidence may be low.';
    }

    return {
      game: item.game,
      title: item.title,
      reason,
      recommendation: GAME_META[item.game].recommendation,
    };
  });
};

export const formatDurationLabel = (timeMs: number): string => {
  if (timeMs <= 0) return '0m';
  const totalMinutes = Math.round(timeMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

export const buildParentWeeklyReport = (
  activityRows: ParentReportActivityEntry[],
  options?: { now?: Date | number | string }
): ParentWeeklyReport => {
  const nowMs =
    options?.now instanceof Date
      ? options.now.getTime()
      : typeof options?.now === 'number' || typeof options?.now === 'string'
        ? new Date(options.now).getTime()
        : Date.now();

  const safeNowMs = Number.isFinite(nowMs) ? nowMs : Date.now();
  const currentStartMs = safeNowMs - 7 * DAY_MS;
  const previousStartMs = currentStartMs - 7 * DAY_MS;

  const currentRows = filterByRange(activityRows, currentStartMs, safeNowMs + 1);
  const previousRows = filterByRange(activityRows, previousStartMs, currentStartMs);

  const gameOrder: ParentReportGameKey[] = ['math', 'alphabet', 'animals'];
  const currentSummaries = gameOrder.map((game) => summarizeGame(currentRows, game));
  const previousSummaries = gameOrder.map((game) => summarizeGame(previousRows, game));

  const totalRounds = currentRows.length;
  const totalTimeMs = currentSummaries.reduce((sum, item) => sum + item.totalTimeMs, 0);
  const activeDays = new Set(currentRows.map((row) => row.dateKey)).size;

  return {
    periodLabel: 'Last 7 days',
    totalRounds,
    activeDays,
    totalTimeMs,
    gameSummaries: currentSummaries,
    improvedSkills: getImprovedSkills(currentSummaries, previousSummaries, activeDays),
    weakAreas: getWeakAreas(currentSummaries),
  };
};
