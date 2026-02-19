import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  getUnlockedAchievementIds,
  type AchievementId,
} from '@/features/achievements/model/achievements';
import {
  DAILY_STAR_GOAL_DEFAULT,
  MAX_GAME_LEVEL,
  calculateStarsForRound,
  getAlphabetLevelConfig,
  getAnimalLevelConfig,
  getDateKey,
  getMathLevelConfig,
  getMilestoneSticker,
  getThemeByMilestoneCount,
  getUnlockProgressRatio,
  getUnlockedLevelFromStars,
  isMilestoneLevel,
  isNextDay,
  type MathOperation,
  type MilestoneTheme,
  type RoundOutcome,
  type StarBreakdown,
} from '@/features/progression/model/progression';

// -----------------------------------------------------------------------------
// State Interfaces
// -----------------------------------------------------------------------------

interface UserSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  language: 'en' | 'es';
  mathOperationPrefs: Record<MathOperation, boolean>;
}

export type GameKey = 'math' | 'alphabet' | 'animals';

interface PerGameStats {
  gamesPlayed: number;
  lastScore: number;
  bestScore: number;
  bestTimeMs: number | null;
  bestAccuracy: number;
  bestStreak: number;
}

interface GameProgress {
  totalScore: number;
  gamesPlayed: number;
  lastPlayedAt: string | null;
  gameStats: Record<GameKey, PerGameStats>;
}

interface AchievementState {
  unlocked: AchievementId[];
  lastUnlockedId: AchievementId | null;
  lastUnlockedAt: string | null;
}

export interface GameLevelState {
  level: number;
  stars: number;
  attempts: number;
  completed: boolean;
  bestScore: number;
  bestAccuracy: number;
  bestTimeMs: number | null;
  lastPlayedAt: string | null;
}

export interface GameProgressionState {
  currentLevel: number;
  unlockedLevel: number;
  totalStars: number;
  consecutiveFails: number;
  roundsWon: number;
  roundsLost: number;
  totalAccuracy: number;
  totalTimeMs: number;
  roundsWithTime: number;
  levels: GameLevelState[];
}

export interface DailyGoalState {
  dateKey: string;
  targetStars: number;
  earnedStars: number;
  completed: boolean;
}

export interface StreakState {
  current: number;
  best: number;
  lastCompletedDate: string | null;
  shieldAvailable: boolean;
  shieldUsedOnDate: string | null;
}

export interface MilestoneReward {
  id: string;
  game: GameKey;
  level: number;
  sticker: string;
  unlockedAt: string;
  theme: MilestoneTheme;
}

export interface ProgressionState {
  games: Record<GameKey, GameProgressionState>;
  totalStars: number;
  dailyGoal: DailyGoalState;
  streak: StreakState;
  milestones: MilestoneReward[];
  lastMilestoneId: string | null;
  activeThemeId: string;
}

export interface RoundSummary {
  game: GameKey;
  level: number;
  score: number;
  accuracy: number;
  timeMs: number | null;
  outcome: RoundOutcome;
  starsEarned: number;
  bestStarsForLevel: number;
  totalStarsForGame: number;
  totalStarsOverall: number;
  unlockedLevel: number;
  currentLevel: number;
  nextLevel: number | null;
  levelUnlockProgress: number;
  levelUnlockedThisRound: boolean;
  breakdown: StarBreakdown;
  dailyGoal: {
    dateKey: string;
    earnedStars: number;
    targetStars: number;
    completed: boolean;
  };
  streak: {
    current: number;
    best: number;
    shieldAvailable: boolean;
    shieldUsed: boolean;
  };
  recovery: {
    effortStarAwarded: boolean;
    consecutiveFails: number;
    suggestedLevel: number | null;
  };
  milestone: {
    id: string;
    level: number;
    sticker: string;
    themeName: string;
    icon: string;
  } | null;
}

interface AppState {
  // User settings
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  setMathOperationEnabled: (operation: MathOperation, enabled: boolean) => void;

  // Game progress
  progress: GameProgress;
  achievements: AchievementState;
  progression: ProgressionState;
  addScore: (game: GameKey, points: number) => void;
  recordGameResult: (payload: {
    game: GameKey;
    score: number;
    timeMs?: number | null;
    accuracy?: number | null;
    streak?: number;
    level?: number;
    hintsUsed?: boolean;
    outcome?: RoundOutcome;
  }) => RoundSummary;
  setCurrentGameLevel: (game: GameKey, level: number) => void;
  activateRecoveryMode: (game: GameKey, preferredLevel?: number | null) => void;
  setDailyGoalTarget: (targetStars: number) => void;
  clearLastUnlockedAchievement: () => void;
  clearLastMilestone: () => void;
  incrementScore: (points: number) => void;
  recordGamePlayed: () => void;
  resetProgress: () => void;
}

// -----------------------------------------------------------------------------
// Store Implementation
// -----------------------------------------------------------------------------

const initialSettings: UserSettings = {
  soundEnabled: true,
  musicEnabled: true,
  hapticsEnabled: true,
  difficulty: 'easy',
  language: 'en',
  mathOperationPrefs: {
    add: true,
    subtract: false,
    multiply: false,
    modulo: false,
  },
};

const createInitialGameStats = (): Record<GameKey, PerGameStats> => ({
  math: {
    gamesPlayed: 0,
    lastScore: 0,
    bestScore: 0,
    bestTimeMs: null,
    bestAccuracy: 0,
    bestStreak: 0,
  },
  alphabet: {
    gamesPlayed: 0,
    lastScore: 0,
    bestScore: 0,
    bestTimeMs: null,
    bestAccuracy: 0,
    bestStreak: 0,
  },
  animals: {
    gamesPlayed: 0,
    lastScore: 0,
    bestScore: 0,
    bestTimeMs: null,
    bestAccuracy: 0,
    bestStreak: 0,
  },
});

const initialProgress: GameProgress = {
  totalScore: 0,
  gamesPlayed: 0,
  lastPlayedAt: null,
  gameStats: createInitialGameStats(),
};

const initialAchievements: AchievementState = {
  unlocked: [],
  lastUnlockedId: null,
  lastUnlockedAt: null,
};

const createInitialLevelState = (level: number): GameLevelState => ({
  level,
  stars: 0,
  attempts: 0,
  completed: false,
  bestScore: 0,
  bestAccuracy: 0,
  bestTimeMs: null,
  lastPlayedAt: null,
});

const createInitialGameProgressionState = (): GameProgressionState => ({
  currentLevel: 1,
  unlockedLevel: 1,
  totalStars: 0,
  consecutiveFails: 0,
  roundsWon: 0,
  roundsLost: 0,
  totalAccuracy: 0,
  totalTimeMs: 0,
  roundsWithTime: 0,
  levels: Array.from({ length: MAX_GAME_LEVEL }, (_, index) =>
    createInitialLevelState(index + 1)
  ),
});

const initialProgression: ProgressionState = {
  games: {
    math: createInitialGameProgressionState(),
    alphabet: createInitialGameProgressionState(),
    animals: createInitialGameProgressionState(),
  },
  totalStars: 0,
  dailyGoal: {
    dateKey: getDateKey(),
    targetStars: DAILY_STAR_GOAL_DEFAULT,
    earnedStars: 0,
    completed: false,
  },
  streak: {
    current: 0,
    best: 0,
    lastCompletedDate: null,
    shieldAvailable: true,
    shieldUsedOnDate: null,
  },
  milestones: [],
  lastMilestoneId: null,
  activeThemeId: getThemeByMilestoneCount(0).id,
};

const clampLevel = (level: number): number =>
  Math.max(1, Math.min(MAX_GAME_LEVEL, Math.round(level)));

const getRoundConfigForGame = (game: GameKey, level: number) => {
  const safeLevel = clampLevel(level);
  if (game === 'math') {
    const config = getMathLevelConfig(safeLevel);
    return {
      minAccuracy: config.minAccuracy,
      speedTargetMs: config.speedTargetMs,
    };
  }
  if (game === 'alphabet') {
    const config = getAlphabetLevelConfig(safeLevel);
    return {
      minAccuracy: config.minAccuracy,
      speedTargetMs: config.speedTargetMs,
    };
  }
  const config = getAnimalLevelConfig(safeLevel);
  return {
    minAccuracy: config.minAccuracy,
    speedTargetMs: config.speedTargetMs,
  };
};

const resetDailyGoalIfNeeded = (
  dailyGoal: DailyGoalState,
  dateKey: string
): DailyGoalState => {
  if (dailyGoal.dateKey === dateKey) {
    return dailyGoal;
  }
  return {
    dateKey,
    targetStars: Math.max(3, Math.round(dailyGoal.targetStars || DAILY_STAR_GOAL_DEFAULT)),
    earnedStars: 0,
    completed: false,
  };
};

const applyGoalCompletionToStreak = (
  streak: StreakState,
  dateKey: string
): { nextStreak: StreakState; shieldUsed: boolean } => {
  if (streak.lastCompletedDate === dateKey) {
    return { nextStreak: streak, shieldUsed: false };
  }

  let shieldUsed = false;
  let nextCurrent = 1;
  let nextShieldAvailable = streak.shieldAvailable;

  if (streak.lastCompletedDate) {
    if (isNextDay(streak.lastCompletedDate, dateKey)) {
      nextCurrent = streak.current + 1;
    } else if (streak.shieldAvailable) {
      // One missed day can be protected once.
      nextCurrent = streak.current + 1;
      nextShieldAvailable = false;
      shieldUsed = true;
    }
  }

  if (nextCurrent > 0 && nextCurrent % 3 === 0) {
    nextShieldAvailable = true;
  }

  return {
    shieldUsed,
    nextStreak: {
      current: nextCurrent,
      best: Math.max(streak.best, nextCurrent),
      lastCompletedDate: dateKey,
      shieldAvailable: nextShieldAvailable,
      shieldUsedOnDate: shieldUsed ? dateKey : streak.shieldUsedOnDate,
    },
  };
};

const sanitizeGameProgression = (
  input: Partial<GameProgressionState> | undefined
): GameProgressionState => {
  const base = createInitialGameProgressionState();
  const mergedLevels = base.levels.map((baseLevel, index) => {
    const candidate = input?.levels?.[index];
    if (!candidate) return baseLevel;
    return {
      ...baseLevel,
      ...candidate,
      level: index + 1,
      stars: Math.max(0, Math.min(3, Math.round(candidate.stars ?? 0))),
      attempts: Math.max(0, Math.round(candidate.attempts ?? 0)),
      bestScore: Math.max(0, Math.round(candidate.bestScore ?? 0)),
      bestAccuracy: Math.max(0, Math.min(1, candidate.bestAccuracy ?? 0)),
      bestTimeMs:
        typeof candidate.bestTimeMs === 'number' && candidate.bestTimeMs > 0
          ? Math.round(candidate.bestTimeMs)
          : null,
    };
  });

  const totalStars = mergedLevels.reduce((sum, level) => sum + level.stars, 0);
  const unlockedLevel = getUnlockedLevelFromStars(totalStars);
  const requestedCurrent = Math.round(input?.currentLevel ?? base.currentLevel);

  return {
    ...base,
    ...input,
    levels: mergedLevels,
    totalStars,
    unlockedLevel: Math.max(unlockedLevel, Math.round(input?.unlockedLevel ?? 1)),
    currentLevel: Math.min(
      Math.max(1, requestedCurrent),
      Math.max(unlockedLevel, Math.round(input?.unlockedLevel ?? 1))
    ),
    consecutiveFails: Math.max(0, Math.round(input?.consecutiveFails ?? 0)),
    roundsWon: Math.max(0, Math.round(input?.roundsWon ?? 0)),
    roundsLost: Math.max(0, Math.round(input?.roundsLost ?? 0)),
    totalAccuracy: Math.max(0, input?.totalAccuracy ?? 0),
    totalTimeMs: Math.max(0, Math.round(input?.totalTimeMs ?? 0)),
    roundsWithTime: Math.max(0, Math.round(input?.roundsWithTime ?? 0)),
  };
};

const sanitizeProgression = (
  input: Partial<ProgressionState> | undefined
): ProgressionState => {
  const base = initialProgression;

  const games: Record<GameKey, GameProgressionState> = {
    math: sanitizeGameProgression(input?.games?.math),
    alphabet: sanitizeGameProgression(input?.games?.alphabet),
    animals: sanitizeGameProgression(input?.games?.animals),
  };

  const totalStars = games.math.totalStars + games.alphabet.totalStars + games.animals.totalStars;

  const milestones = (input?.milestones ?? [])
    .filter((item): item is MilestoneReward => Boolean(item && item.id && item.game))
    .map((item) => ({
      ...item,
      level: clampLevel(item.level),
      theme: item.theme ?? getThemeByMilestoneCount(0),
    }));

  const streak: StreakState = {
    ...base.streak,
    ...(input?.streak ?? {}),
    current: Math.max(0, Math.round(input?.streak?.current ?? base.streak.current)),
    best: Math.max(0, Math.round(input?.streak?.best ?? base.streak.best)),
    shieldAvailable: input?.streak?.shieldAvailable ?? base.streak.shieldAvailable,
  };

  const dailyGoal = resetDailyGoalIfNeeded(
    {
      ...base.dailyGoal,
      ...(input?.dailyGoal ?? {}),
      targetStars: Math.max(
        3,
        Math.round(input?.dailyGoal?.targetStars ?? base.dailyGoal.targetStars)
      ),
      earnedStars: Math.max(
        0,
        Math.round(input?.dailyGoal?.earnedStars ?? base.dailyGoal.earnedStars)
      ),
      completed: Boolean(input?.dailyGoal?.completed ?? base.dailyGoal.completed),
    },
    getDateKey()
  );

  const milestoneCount = milestones.length;
  const themeFromCount = getThemeByMilestoneCount(
    Math.min(milestoneCount, 4)
  );

  return {
    games,
    totalStars,
    dailyGoal,
    streak,
    milestones,
    lastMilestoneId: input?.lastMilestoneId ?? null,
    activeThemeId: input?.activeThemeId ?? themeFromCount.id,
  };
};

const getInitialRoundSummary = (game: GameKey): RoundSummary => ({
  game,
  level: 1,
  score: 0,
  accuracy: 0,
  timeMs: null,
  outcome: 'quit',
  starsEarned: 0,
  bestStarsForLevel: 0,
  totalStarsForGame: 0,
  totalStarsOverall: 0,
  unlockedLevel: 1,
  currentLevel: 1,
  nextLevel: 2,
  levelUnlockProgress: 0,
  levelUnlockedThisRound: false,
  breakdown: {
    accuracyStar: false,
    speedStar: false,
    noHintStar: false,
    effortStar: false,
  },
  dailyGoal: {
    dateKey: getDateKey(),
    earnedStars: 0,
    targetStars: DAILY_STAR_GOAL_DEFAULT,
    completed: false,
  },
  streak: {
    current: 0,
    best: 0,
    shieldAvailable: true,
    shieldUsed: false,
  },
  recovery: {
    effortStarAwarded: false,
    consecutiveFails: 0,
    suggestedLevel: null,
  },
  milestone: null,
});

/**
 * Main app store using Zustand with AsyncStorage persistence.
 * Switched to AsyncStorage to ensure compatibility with Expo Go.
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Settings
      settings: initialSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
            mathOperationPrefs: {
              ...state.settings.mathOperationPrefs,
              ...(newSettings.mathOperationPrefs ?? {}),
            },
          },
        })),
      setMathOperationEnabled: (operation, enabled) =>
        set((state) => {
          const currentPrefs = state.settings.mathOperationPrefs;
          const currentlyEnabledCount = Object.values(currentPrefs).filter(Boolean).length;
          const isTurningOffLastEnabled =
            !enabled && currentPrefs[operation] && currentlyEnabledCount <= 1;

          if (isTurningOffLastEnabled) {
            return state;
          }

          return {
            settings: {
              ...state.settings,
              mathOperationPrefs: {
                ...currentPrefs,
                [operation]: enabled,
              },
            },
          };
        }),

      // Progress
      progress: initialProgress,
      achievements: initialAchievements,
      progression: initialProgression,
      addScore: (game, points) =>
        set((state) => {
          const safePoints = Math.max(0, Math.round(points));
          if (safePoints === 0) return state;
          const previousGameStats =
            state.progress.gameStats[game] ?? initialProgress.gameStats[game];
          return {
            progress: {
              ...state.progress,
              totalScore: state.progress.totalScore + safePoints,
              gameStats: {
                ...state.progress.gameStats,
                [game]: {
                  ...previousGameStats,
                  lastScore: previousGameStats.lastScore + safePoints,
                },
              },
            },
          };
        }),
      recordGameResult: ({
        game,
        score,
        timeMs,
        accuracy,
        streak,
        level,
        hintsUsed,
        outcome,
      }) => {
        let roundSummary = getInitialRoundSummary(game);

        set((state) => {
          const safeScore = Math.max(0, Math.round(score));
          const safeTime =
            typeof timeMs === 'number' && Number.isFinite(timeMs) && timeMs > 0
              ? Math.round(timeMs)
              : null;
          const safeAccuracy =
            typeof accuracy === 'number' && Number.isFinite(accuracy)
              ? Math.max(0, Math.min(1, accuracy))
              : 0;
          const safeStreak = Math.max(0, Math.round(streak ?? 0));
          const safeOutcome: RoundOutcome = outcome ?? 'won';

          const previous =
            state.progress.gameStats[game] ?? initialProgress.gameStats[game];
          const nextProgress: GameProgress = {
            ...state.progress,
            gamesPlayed: state.progress.gamesPlayed + 1,
            lastPlayedAt: new Date().toISOString(),
            gameStats: {
              ...state.progress.gameStats,
              [game]: {
                ...previous,
                gamesPlayed: previous.gamesPlayed + 1,
                lastScore: safeScore,
                bestScore: Math.max(previous.bestScore, safeScore),
                bestTimeMs:
                  safeTime === null
                    ? previous.bestTimeMs
                    : previous.bestTimeMs === null
                      ? safeTime
                      : Math.min(previous.bestTimeMs, safeTime),
                bestAccuracy: Math.max(previous.bestAccuracy, safeAccuracy),
                bestStreak: Math.max(previous.bestStreak, safeStreak),
              },
            },
          };

          const previousGameProgression =
            state.progression.games[game] ?? createInitialGameProgressionState();
          const activeLevel = clampLevel(level ?? previousGameProgression.currentLevel);
          const roundConfig = getRoundConfigForGame(game, activeLevel);

          const effortThreshold = Math.max(12, activeLevel * 6);
          const awardEffortStar =
            safeOutcome !== 'won' &&
            (safeScore >= effortThreshold ||
              safeAccuracy >= Math.max(0.4, roundConfig.minAccuracy - 0.25));

          const starResult = calculateStarsForRound({
            accuracy: safeAccuracy,
            timeMs: safeTime,
            hintsUsed: Boolean(hintsUsed),
            completed: safeOutcome === 'won',
            minAccuracy: roundConfig.minAccuracy,
            speedTargetMs: roundConfig.speedTargetMs,
            awardEffortStar,
          });

          const levelIndex = activeLevel - 1;
          const previousLevel = previousGameProgression.levels[levelIndex] ??
            createInitialLevelState(activeLevel);
          const bestStarsForLevel = Math.max(previousLevel.stars, starResult.starsEarned);
          const starsDelta = bestStarsForLevel - previousLevel.stars;

          const nextLevels = previousGameProgression.levels.map((entry, index) => {
            if (index !== levelIndex) return entry;
            return {
              ...entry,
              level: activeLevel,
              stars: bestStarsForLevel,
              attempts: entry.attempts + 1,
              completed: entry.completed || safeOutcome === 'won',
              bestScore: Math.max(entry.bestScore, safeScore),
              bestAccuracy: Math.max(entry.bestAccuracy, safeAccuracy),
              bestTimeMs:
                safeTime === null
                  ? entry.bestTimeMs
                  : entry.bestTimeMs === null
                    ? safeTime
                    : Math.min(entry.bestTimeMs, safeTime),
              lastPlayedAt: new Date().toISOString(),
            };
          });

          const totalStarsForGame = Math.max(0, previousGameProgression.totalStars + starsDelta);
          const unlockedLevelByStars = getUnlockedLevelFromStars(totalStarsForGame);
          const unlockedLevel = Math.max(
            previousGameProgression.unlockedLevel,
            unlockedLevelByStars
          );
          const levelUnlockedThisRound = unlockedLevel > previousGameProgression.unlockedLevel;

          const suggestedLevel =
            safeOutcome === 'won'
              ? null
              : previousGameProgression.consecutiveFails + 1 >= 2
                ? Math.max(1, activeLevel - 1)
                : null;

          const nextCurrentLevel =
            safeOutcome === 'won'
              ? Math.min(unlockedLevel, Math.max(activeLevel + 1, previousGameProgression.currentLevel))
              : Math.min(unlockedLevel, Math.max(1, previousGameProgression.currentLevel));

          const nextGameProgression: GameProgressionState = {
            ...previousGameProgression,
            currentLevel: nextCurrentLevel,
            unlockedLevel,
            totalStars: totalStarsForGame,
            consecutiveFails:
              safeOutcome === 'won' ? 0 : previousGameProgression.consecutiveFails + 1,
            roundsWon:
              previousGameProgression.roundsWon + (safeOutcome === 'won' ? 1 : 0),
            roundsLost:
              previousGameProgression.roundsLost + (safeOutcome === 'won' ? 0 : 1),
            totalAccuracy: previousGameProgression.totalAccuracy + safeAccuracy,
            totalTimeMs:
              previousGameProgression.totalTimeMs + (safeTime ?? 0),
            roundsWithTime:
              previousGameProgression.roundsWithTime + (safeTime !== null ? 1 : 0),
            levels: nextLevels,
          };

          const nextProgressionGames = {
            ...state.progression.games,
            [game]: nextGameProgression,
          };

          const totalStarsOverall =
            nextProgressionGames.math.totalStars +
            nextProgressionGames.alphabet.totalStars +
            nextProgressionGames.animals.totalStars;

          const dateKey = getDateKey();
          const resetDailyGoal = resetDailyGoalIfNeeded(state.progression.dailyGoal, dateKey);
          const nextDailyGoal: DailyGoalState = {
            ...resetDailyGoal,
            earnedStars: resetDailyGoal.earnedStars + starResult.starsEarned,
          };
          const reachedGoalNow =
            !nextDailyGoal.completed && nextDailyGoal.earnedStars >= nextDailyGoal.targetStars;
          if (reachedGoalNow) {
            nextDailyGoal.completed = true;
          }

          let nextStreak = state.progression.streak;
          let shieldUsed = false;
          if (reachedGoalNow) {
            const streakResult = applyGoalCompletionToStreak(state.progression.streak, dateKey);
            nextStreak = streakResult.nextStreak;
            shieldUsed = streakResult.shieldUsed;
          }

          const milestoneId = `${game}-L${activeLevel}`;
          let milestoneSummary: RoundSummary['milestone'] = null;
          let nextMilestones = state.progression.milestones;
          let nextLastMilestoneId = state.progression.lastMilestoneId;
          let nextActiveThemeId = state.progression.activeThemeId;

          if (
            safeOutcome === 'won' &&
            isMilestoneLevel(activeLevel) &&
            !state.progression.milestones.some((milestone) => milestone.id === milestoneId)
          ) {
            const milestoneCount = state.progression.milestones.length + 1;
            const milestoneTheme = getThemeByMilestoneCount(
              Math.min(milestoneCount, 4)
            );
            const sticker = getMilestoneSticker(activeLevel);
            const unlockedAt = new Date().toISOString();

            const milestoneReward: MilestoneReward = {
              id: milestoneId,
              game,
              level: activeLevel,
              sticker,
              unlockedAt,
              theme: milestoneTheme,
            };

            nextMilestones = [...state.progression.milestones, milestoneReward];
            nextLastMilestoneId = milestoneId;
            nextActiveThemeId = milestoneTheme.id;
            milestoneSummary = {
              id: milestoneId,
              level: activeLevel,
              sticker,
              themeName: milestoneTheme.name,
              icon: milestoneTheme.icon,
            };
          }

          const nextProgression: ProgressionState = {
            ...state.progression,
            games: nextProgressionGames,
            totalStars: totalStarsOverall,
            dailyGoal: nextDailyGoal,
            streak: nextStreak,
            milestones: nextMilestones,
            lastMilestoneId: nextLastMilestoneId,
            activeThemeId: nextActiveThemeId,
          };

          const evaluatedAchievementIds = getUnlockedAchievementIds(nextProgress);
          const unlockedSet = new Set<AchievementId>(state.achievements.unlocked);
          const newlyUnlockedIds: AchievementId[] = [];
          for (const id of evaluatedAchievementIds) {
            if (!unlockedSet.has(id)) {
              unlockedSet.add(id);
              newlyUnlockedIds.push(id);
            }
          }
          const latestUnlockedId =
            newlyUnlockedIds.length > 0
              ? newlyUnlockedIds[newlyUnlockedIds.length - 1]
              : state.achievements.lastUnlockedId;

          roundSummary = {
            game,
            level: activeLevel,
            score: safeScore,
            accuracy: safeAccuracy,
            timeMs: safeTime,
            outcome: safeOutcome,
            starsEarned: starResult.starsEarned,
            bestStarsForLevel,
            totalStarsForGame,
            totalStarsOverall,
            unlockedLevel,
            currentLevel: nextCurrentLevel,
            nextLevel:
              nextCurrentLevel >= MAX_GAME_LEVEL ? null : nextCurrentLevel + 1,
            levelUnlockProgress: getUnlockProgressRatio(totalStarsForGame, nextCurrentLevel),
            levelUnlockedThisRound,
            breakdown: starResult.breakdown,
            dailyGoal: {
              dateKey: nextDailyGoal.dateKey,
              earnedStars: nextDailyGoal.earnedStars,
              targetStars: nextDailyGoal.targetStars,
              completed: nextDailyGoal.completed,
            },
            streak: {
              current: nextStreak.current,
              best: nextStreak.best,
              shieldAvailable: nextStreak.shieldAvailable,
              shieldUsed,
            },
            recovery: {
              effortStarAwarded: starResult.breakdown.effortStar,
              consecutiveFails: nextGameProgression.consecutiveFails,
              suggestedLevel,
            },
            milestone: milestoneSummary,
          };

          return {
            progress: nextProgress,
            progression: nextProgression,
            achievements: {
              unlocked: Array.from(unlockedSet),
              lastUnlockedId: latestUnlockedId,
              lastUnlockedAt:
                newlyUnlockedIds.length > 0
                  ? new Date().toISOString()
                  : state.achievements.lastUnlockedAt,
            },
          };
        });

        return roundSummary;
      },
      setCurrentGameLevel: (game, level) =>
        set((state) => {
          const gameProgression = state.progression.games[game];
          const clamped = clampLevel(level);
          if (clamped > gameProgression.unlockedLevel) {
            return state;
          }
          return {
            progression: {
              ...state.progression,
              games: {
                ...state.progression.games,
                [game]: {
                  ...gameProgression,
                  currentLevel: clamped,
                },
              },
            },
          };
        }),
      activateRecoveryMode: (game, preferredLevel) =>
        set((state) => {
          const gameProgression = state.progression.games[game];
          const fallbackLevel = Math.max(1, gameProgression.currentLevel - 1);
          const safePreferred = preferredLevel ? clampLevel(preferredLevel) : fallbackLevel;
          const nextLevel = Math.min(safePreferred, gameProgression.unlockedLevel);

          return {
            progression: {
              ...state.progression,
              games: {
                ...state.progression.games,
                [game]: {
                  ...gameProgression,
                  currentLevel: nextLevel,
                  consecutiveFails: 0,
                },
              },
            },
          };
        }),
      setDailyGoalTarget: (targetStars) =>
        set((state) => {
          const safeTarget = Math.max(3, Math.round(targetStars));
          return {
            progression: {
              ...state.progression,
              dailyGoal: {
                ...state.progression.dailyGoal,
                targetStars: safeTarget,
                completed: state.progression.dailyGoal.earnedStars >= safeTarget,
              },
            },
          };
        }),
      clearLastUnlockedAchievement: () =>
        set((state) => ({
          achievements: {
            ...state.achievements,
            lastUnlockedId: null,
            lastUnlockedAt: null,
          },
        })),
      clearLastMilestone: () =>
        set((state) => ({
          progression: {
            ...state.progression,
            lastMilestoneId: null,
          },
        })),
      incrementScore: (points) =>
        set((state) => ({
          progress: {
            ...state.progress,
            totalScore: state.progress.totalScore + Math.max(0, Math.round(points)),
          },
        })),
      recordGamePlayed: () =>
        set((state) => ({
          progress: {
            ...state.progress,
            gamesPlayed: state.progress.gamesPlayed + 1,
            lastPlayedAt: new Date().toISOString(),
          },
        })),
      resetProgress: () =>
        set(() => ({
          progress: initialProgress,
          achievements: initialAchievements,
          progression: initialProgression,
        })),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<AppState>) ?? {};

        const persistedProgress: Partial<GameProgress> = persisted.progress ?? {};
        const persistedGameStats: Partial<Record<GameKey, Partial<PerGameStats>>> =
          persistedProgress.gameStats ?? {};
        const mergedProgress: GameProgress = {
          ...currentState.progress,
          ...persistedProgress,
          gameStats: {
            math: {
              ...currentState.progress.gameStats.math,
              ...(persistedGameStats.math ?? {}),
            },
            alphabet: {
              ...currentState.progress.gameStats.alphabet,
              ...(persistedGameStats.alphabet ?? {}),
            },
            animals: {
              ...currentState.progress.gameStats.animals,
              ...(persistedGameStats.animals ?? {}),
            },
          },
        };

        const persistedAchievements: Partial<AchievementState> =
          persisted.achievements ?? {};
        const unlockedFromProgress = getUnlockedAchievementIds(mergedProgress);
        const unlockedSet = new Set<AchievementId>([
          ...(persistedAchievements.unlocked ?? []),
          ...unlockedFromProgress,
        ]);

        const mergedProgression = sanitizeProgression(
          (persisted as Partial<AppState>).progression
        );

        const recalculatedGameStars = {
          math: mergedProgression.games.math.levels.reduce((sum, level) => sum + level.stars, 0),
          alphabet: mergedProgression.games.alphabet.levels.reduce(
            (sum, level) => sum + level.stars,
            0
          ),
          animals: mergedProgression.games.animals.levels.reduce(
            (sum, level) => sum + level.stars,
            0
          ),
        };

        const finalProgression: ProgressionState = {
          ...mergedProgression,
          games: {
            math: {
              ...mergedProgression.games.math,
              totalStars: recalculatedGameStars.math,
              unlockedLevel: Math.max(
                mergedProgression.games.math.unlockedLevel,
                getUnlockedLevelFromStars(recalculatedGameStars.math)
              ),
              currentLevel: Math.min(
                mergedProgression.games.math.currentLevel,
                Math.max(
                  mergedProgression.games.math.unlockedLevel,
                  getUnlockedLevelFromStars(recalculatedGameStars.math)
                )
              ),
            },
            alphabet: {
              ...mergedProgression.games.alphabet,
              totalStars: recalculatedGameStars.alphabet,
              unlockedLevel: Math.max(
                mergedProgression.games.alphabet.unlockedLevel,
                getUnlockedLevelFromStars(recalculatedGameStars.alphabet)
              ),
              currentLevel: Math.min(
                mergedProgression.games.alphabet.currentLevel,
                Math.max(
                  mergedProgression.games.alphabet.unlockedLevel,
                  getUnlockedLevelFromStars(recalculatedGameStars.alphabet)
                )
              ),
            },
            animals: {
              ...mergedProgression.games.animals,
              totalStars: recalculatedGameStars.animals,
              unlockedLevel: Math.max(
                mergedProgression.games.animals.unlockedLevel,
                getUnlockedLevelFromStars(recalculatedGameStars.animals)
              ),
              currentLevel: Math.min(
                mergedProgression.games.animals.currentLevel,
                Math.max(
                  mergedProgression.games.animals.unlockedLevel,
                  getUnlockedLevelFromStars(recalculatedGameStars.animals)
                )
              ),
            },
          },
          totalStars:
            recalculatedGameStars.math +
            recalculatedGameStars.alphabet +
            recalculatedGameStars.animals,
        };

        return {
          ...currentState,
          ...persisted,
          settings: {
            ...currentState.settings,
            ...(persisted.settings ?? {}),
            mathOperationPrefs: {
              ...currentState.settings.mathOperationPrefs,
              ...(persisted.settings?.mathOperationPrefs ?? {}),
            },
          },
          progress: mergedProgress,
          progression: finalProgression,
          achievements: {
            ...currentState.achievements,
            ...persistedAchievements,
            unlocked: Array.from(unlockedSet),
            lastUnlockedId: null,
            lastUnlockedAt: null,
          },
        };
      },
    }
  )
);
