import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  getUnlockedAchievementIds,
  type AchievementId,
} from '@/features/achievements/model/achievements';
import {
  getProfileAvatar,
  validateNickname,
  type ProfileGender,
} from '@/features/profile/model/profile';
import {
  DAILY_ROUND_GOAL_DEFAULT,
  MAX_GAME_LEVEL,
  calculateStarsForRound,
  getDayDifference,
  getAlphabetLevelConfig,
  getAnimalLevelConfig,
  getDateKey,
  getMathLevelConfig,
  getMilestoneSticker,
  getThemeByMilestoneCount,
  getUnlockProgressRatio,
  getUnlockedLevelFromStars,
  isMilestoneLevel,
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

export interface UserProfile {
  nickname: string;
  gender: ProfileGender | null;
  avatarEmoji: string;
  onboardingCompletedAt: string | null;
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
  targetRounds: number;
  completedRounds: number;
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
    completedRounds: number;
    targetRounds: number;
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

export type GameRoute = '/math-game' | '/alphabet' | '/animal-flashcards';
export type SavedSessionPhase = 'intro' | 'countdown' | 'playing';

export type MathSessionPayload = {
  currentData: {
    question: string;
    answer: number;
    choices: number[];
  };
  phase: SavedSessionPhase;
  wrongAnswer: number | null;
  streak: number;
  bestStreak: number;
  roundScore: number;
  correctCount: number;
  wrongCount: number;
  answeredCount: number;
  questionStartedAt: number;
  sessionStartedAt: number | null;
};

export type AlphabetSessionPayload = {
  shuffledLetters: string[];
  nextLetterIndex: number;
  correctLetters: string[];
  shakeTickByLetter: Record<string, number>;
  roundScore: number;
  streak: number;
  bestStreak: number;
  wrongCount: number;
  roundStartedAt: number | null;
  letterStartedAt: number | null;
  elapsedMs: number;
  phase: SavedSessionPhase;
};

export type AnimalSessionPayload = {
  cards: {
    uid: string;
    id: string;
    name: string;
    emoji: string;
    cardColor: string;
    imageSource?: number | string;
    isFlipped: boolean;
    isMatched: boolean;
    shakeTick: number;
  }[];
  openedCardIds: string[];
  isResolvingPair: boolean;
  moves: number;
  lives: number;
  streak: number;
  bestStreak: number;
  roundScore: number;
  remainingTime: number;
  roundStartedAt: number | null;
  firstCardOpenedAt: number | null;
  feedbackLabel: string;
  phase: SavedSessionPhase;
};

interface BaseSavedSession {
  game: GameKey;
  route: GameRoute;
  level: number;
  phase: SavedSessionPhase;
  updatedAt: string;
  progressLabel: string;
}

export type SavedSession =
  | (BaseSavedSession & {
    game: 'math';
    route: '/math-game';
    payload: MathSessionPayload;
  })
  | (BaseSavedSession & {
    game: 'alphabet';
    route: '/alphabet';
    payload: AlphabetSessionPayload;
  })
  | (BaseSavedSession & {
    game: 'animals';
    route: '/animal-flashcards';
    payload: AnimalSessionPayload;
  });

export interface ActivityLogEntry {
  id: string;
  game: GameKey;
  level: number;
  score: number;
  accuracy: number;
  timeMs: number | null;
  outcome: RoundOutcome;
  starsEarned: number;
  dateKey: string;
  playedAt: string;
}

interface AppState {
  // User settings
  settings: UserSettings;
  profile: UserProfile;
  updateSettings: (settings: Partial<UserSettings>) => void;
  saveProfile: (payload: {
    nickname: string;
    gender: ProfileGender;
  }) => void;
  setMathOperationEnabled: (operation: MathOperation, enabled: boolean) => void;

  // Game progress
  progress: GameProgress;
  achievements: AchievementState;
  progression: ProgressionState;
  lastSession: SavedSession | null;
  activityLog: ActivityLogEntry[];
  addScore: (game: GameKey, points: number) => void;
  saveLastSession: (session: SavedSession) => void;
  clearLastSession: (game?: GameKey) => void;
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
  setDailyGoalTarget: (targetRounds: number) => void;
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

const initialProfile: UserProfile = {
  nickname: '',
  gender: null,
  avatarEmoji: '🧒',
  onboardingCompletedAt: null,
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
    targetRounds: DAILY_ROUND_GOAL_DEFAULT,
    completedRounds: 0,
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

const initialActivityLog: ActivityLogEntry[] = [];
const ACTIVITY_LOG_MAX_ENTRIES = 600;
const ACTIVITY_LOG_RETENTION_DAYS = 35;

const clampLevel = (level: number): number =>
  Math.max(1, Math.min(MAX_GAME_LEVEL, Math.round(level)));

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const clampAccuracy = (accuracy: number): number => Math.max(0, Math.min(1, accuracy));

const trimActivityLog = (entries: ActivityLogEntry[]): ActivityLogEntry[] => {
  const now = Date.now();
  const cutoffMs = now - ACTIVITY_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;

  const filtered = entries.filter((entry) => {
    const playedAtMs = new Date(entry.playedAt).getTime();
    return Number.isFinite(playedAtMs) && playedAtMs >= cutoffMs;
  });

  const sorted = [...filtered].sort((a, b) => {
    const timeA = new Date(a.playedAt).getTime();
    const timeB = new Date(b.playedAt).getTime();
    return timeA - timeB;
  });

  if (sorted.length <= ACTIVITY_LOG_MAX_ENTRIES) {
    return sorted;
  }

  return sorted.slice(sorted.length - ACTIVITY_LOG_MAX_ENTRIES);
};

const sanitizeActivityLog = (input: unknown): ActivityLogEntry[] => {
  if (!Array.isArray(input)) {
    return initialActivityLog;
  }

  const entries: ActivityLogEntry[] = [];
  for (const row of input) {
    if (!row || typeof row !== 'object') {
      continue;
    }
    const entry = row as Partial<ActivityLogEntry>;
    if (typeof entry.id !== 'string' || !entry.id) {
      continue;
    }
    if (entry.game !== 'math' && entry.game !== 'alphabet' && entry.game !== 'animals') {
      continue;
    }
    if (!isFiniteNumber(entry.level)) {
      continue;
    }
    if (!isFiniteNumber(entry.score)) {
      continue;
    }
    if (!isFiniteNumber(entry.accuracy)) {
      continue;
    }
    if (
      entry.timeMs !== null &&
      entry.timeMs !== undefined &&
      (!isFiniteNumber(entry.timeMs) || entry.timeMs <= 0)
    ) {
      continue;
    }
    if (entry.outcome !== 'won' && entry.outcome !== 'lost' && entry.outcome !== 'quit') {
      continue;
    }
    if (!isFiniteNumber(entry.starsEarned)) {
      continue;
    }
    if (typeof entry.dateKey !== 'string' || !entry.dateKey) {
      continue;
    }
    if (typeof entry.playedAt !== 'string' || !entry.playedAt) {
      continue;
    }

    entries.push({
      id: entry.id,
      game: entry.game,
      level: clampLevel(Math.round(entry.level)),
      score: Math.max(0, Math.round(entry.score)),
      accuracy: clampAccuracy(entry.accuracy),
      timeMs: entry.timeMs == null ? null : Math.round(entry.timeMs),
      outcome: entry.outcome,
      starsEarned: Math.max(0, Math.min(3, Math.round(entry.starsEarned))),
      dateKey: entry.dateKey,
      playedAt: entry.playedAt,
    });
  }

  return trimActivityLog(entries);
};

const sanitizeProfile = (input: unknown): UserProfile => {
  if (!input || typeof input !== 'object') {
    return initialProfile;
  }

  const candidate = input as Partial<UserProfile>;
  const gender: ProfileGender | null =
    candidate.gender === 'male' || candidate.gender === 'female'
      ? candidate.gender
      : null;
  const validatedNickname = validateNickname(candidate.nickname ?? '');
  const hasValidNickname = validatedNickname.valid;

  return {
    nickname: hasValidNickname ? validatedNickname.normalized : '',
    gender: hasValidNickname ? gender : null,
    avatarEmoji:
      hasValidNickname && gender
        ? getProfileAvatar(gender)
        : initialProfile.avatarEmoji,
    onboardingCompletedAt:
      hasValidNickname && gender
        ? typeof candidate.onboardingCompletedAt === 'string'
          ? candidate.onboardingCompletedAt
          : null
        : null,
  };
};

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
    targetRounds: Math.max(
      1,
      Math.round(dailyGoal.targetRounds || DAILY_ROUND_GOAL_DEFAULT)
    ),
    completedRounds: 0,
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
    const dayDiff = getDayDifference(streak.lastCompletedDate, dateKey);
    if (dayDiff === 1) {
      nextCurrent = streak.current + 1;
    } else if (dayDiff === 2 && streak.shieldAvailable) {
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

  const inputDailyGoal = (input?.dailyGoal as
    | (Partial<DailyGoalState> & { targetStars?: number; earnedStars?: number })
    | undefined);
  const migratedTargetRounds =
    inputDailyGoal?.targetRounds ??
    (typeof inputDailyGoal?.targetStars === 'number'
      ? Math.max(1, Math.round(inputDailyGoal.targetStars / 2))
      : base.dailyGoal.targetRounds);
  const migratedCompletedRounds =
    inputDailyGoal?.completedRounds ??
    (typeof inputDailyGoal?.earnedStars === 'number'
      ? Math.max(0, Math.round(inputDailyGoal.earnedStars / 2))
      : base.dailyGoal.completedRounds);

  const dailyGoal = resetDailyGoalIfNeeded(
    {
      ...base.dailyGoal,
      ...(inputDailyGoal ?? {}),
      targetRounds: Math.max(1, Math.round(migratedTargetRounds)),
      completedRounds: Math.max(0, Math.round(migratedCompletedRounds)),
      completed: Boolean(
        inputDailyGoal?.completed ??
        migratedCompletedRounds >= Math.max(1, Math.round(migratedTargetRounds))
      ),
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
    completedRounds: 0,
    targetRounds: DAILY_ROUND_GOAL_DEFAULT,
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

const routeByGame: Record<GameKey, GameRoute> = {
  math: '/math-game',
  alphabet: '/alphabet',
  animals: '/animal-flashcards',
};

const sanitizeSavedSession = (input: unknown): SavedSession | null => {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const candidate = input as Partial<SavedSession> & { payload?: unknown };
  const game = candidate.game;
  if (game !== 'math' && game !== 'alphabet' && game !== 'animals') {
    return null;
  }

  if (candidate.route !== routeByGame[game]) {
    return null;
  }

  const phase = candidate.phase;
  if (phase !== 'intro' && phase !== 'countdown' && phase !== 'playing') {
    return null;
  }

  if (typeof candidate.updatedAt !== 'string' || !candidate.updatedAt) {
    return null;
  }

  if (typeof candidate.progressLabel !== 'string' || !candidate.progressLabel) {
    return null;
  }

  if (typeof candidate.level !== 'number' || !Number.isFinite(candidate.level)) {
    return null;
  }

  if (!candidate.payload || typeof candidate.payload !== 'object') {
    return null;
  }

  return {
    ...candidate,
    game,
    route: routeByGame[game],
    phase,
    level: clampLevel(candidate.level),
    payload: candidate.payload as SavedSession['payload'],
  } as SavedSession;
};

/**
 * Main app store using Zustand with AsyncStorage persistence.
 * Switched to AsyncStorage to ensure compatibility with Expo Go.
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Settings
      settings: initialSettings,
      profile: initialProfile,
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
      saveProfile: ({ nickname, gender }) =>
        set((state) => {
          const validatedNickname = validateNickname(nickname);
          if (!validatedNickname.valid) {
            return state;
          }

          const savedAt = new Date().toISOString();
          return {
            profile: {
              nickname: validatedNickname.normalized,
              gender,
              avatarEmoji: getProfileAvatar(gender),
              onboardingCompletedAt: state.profile.onboardingCompletedAt ?? savedAt,
            },
          };
        }),
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
      lastSession: null,
      activityLog: initialActivityLog,
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
      saveLastSession: (session) =>
        set(() => ({
          lastSession: sanitizeSavedSession({
            ...session,
            updatedAt: session.updatedAt || new Date().toISOString(),
            level: clampLevel(session.level),
            route: routeByGame[session.game],
          }),
        })),
      clearLastSession: (game) =>
        set((state) => {
          if (!state.lastSession) {
            return state;
          }
          if (game && state.lastSession.game !== game) {
            return state;
          }
          return { lastSession: null };
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
            completedRounds: resetDailyGoal.completedRounds + 1,
          };
          const reachedGoalNow =
            !nextDailyGoal.completed &&
            nextDailyGoal.completedRounds >= nextDailyGoal.targetRounds;
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
          const playedAt = new Date().toISOString();
          const activityEntry: ActivityLogEntry = {
            id: `${playedAt}-${game}-${Math.round(Math.random() * 1_000_000)}`,
            game,
            level: activeLevel,
            score: safeScore,
            accuracy: safeAccuracy,
            timeMs: safeTime,
            outcome: safeOutcome,
            starsEarned: starResult.starsEarned,
            dateKey,
            playedAt,
          };
          const nextActivityLog = trimActivityLog([...state.activityLog, activityEntry]);

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
              completedRounds: nextDailyGoal.completedRounds,
              targetRounds: nextDailyGoal.targetRounds,
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
            lastSession: null,
            activityLog: nextActivityLog,
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
      setDailyGoalTarget: (targetRounds) =>
        set((state) => {
          const safeTarget = Math.max(1, Math.round(targetRounds));
          return {
            progression: {
              ...state.progression,
              dailyGoal: {
                ...state.progression.dailyGoal,
                targetRounds: safeTarget,
                completed: state.progression.dailyGoal.completedRounds >= safeTarget,
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
          lastSession: null,
          activityLog: initialActivityLog,
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
        const mergedProfile = sanitizeProfile(
          (persisted as { profile?: unknown }).profile
        );
        const mergedActivityLog = sanitizeActivityLog(
          (persisted as { activityLog?: unknown }).activityLog
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
        const persistedLastSession = sanitizeSavedSession(
          (persisted as { lastSession?: unknown }).lastSession
        );

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
          profile: mergedProfile,
          progress: mergedProgress,
          progression: finalProgression,
          achievements: {
            ...currentState.achievements,
            ...persistedAchievements,
            unlocked: Array.from(unlockedSet),
            lastUnlockedId: null,
            lastUnlockedAt: null,
          },
          lastSession: persistedLastSession,
          activityLog: mergedActivityLog,
        };
      },
    }
  )
);
