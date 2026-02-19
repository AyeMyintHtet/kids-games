export type ProgressionGameKey = 'math' | 'alphabet' | 'animals';

export const MAX_GAME_LEVEL = 20;
export const DAILY_STAR_GOAL_DEFAULT = 6;

type LevelBand = 'easy' | 'medium' | 'hard';
export type RoundOutcome = 'won' | 'lost' | 'quit';

export type StarBreakdown = {
  accuracyStar: boolean;
  speedStar: boolean;
  noHintStar: boolean;
  effortStar: boolean;
};

export type StarCalculationInput = {
  accuracy: number;
  timeMs: number | null;
  hintsUsed: boolean;
  completed: boolean;
  minAccuracy: number;
  speedTargetMs: number;
  awardEffortStar: boolean;
};

export type StarCalculationResult = {
  starsEarned: number;
  breakdown: StarBreakdown;
};

export type MathOperation = 'add' | 'subtract' | 'multiply' | 'modulo';

export type MathLevelConfig = {
  level: number;
  band: LevelBand;
  operations: MathOperation[];
  minOperand: number;
  maxOperand: number;
  questionCount: number;
  minAccuracy: number;
  speedTargetMs: number;
};

export type AlphabetLevelConfig = {
  level: number;
  band: LevelBand;
  letterCount: number;
  minAccuracy: number;
  speedTargetMs: number;
};

export type AnimalLevelConfig = {
  level: number;
  band: LevelBand;
  label: string;
  pairs: number;
  columns: number;
  lives: number;
  durationSeconds: number;
  pairPoints: number;
  streakBonus: number;
  completionBonus: number;
  minAccuracy: number;
  speedTargetMs: number;
};

export type MilestoneTheme = {
  id: string;
  name: string;
  icon: string;
  skyGradient: [string, string, string];
  grassGradient: [string, string, string];
  accent: string;
};

export const PROGRESSION_THEMES: MilestoneTheme[] = [
  {
    id: 'sunny-meadow',
    name: 'Sunny Meadow',
    icon: '🌼',
    skyGradient: ['#87CEEB', '#B0E0E6', '#98D8C8'],
    grassGradient: ['#7CB342', '#558B2F', '#33691E'],
    accent: '#FF6B9D',
  },
  {
    id: 'candy-sunset',
    name: 'Candy Sunset',
    icon: '🍭',
    skyGradient: ['#FFB3BA', '#FFD3B6', '#FFF1A8'],
    grassGradient: ['#89D37F', '#55B96B', '#2F8F52'],
    accent: '#FF7F7F',
  },
  {
    id: 'rainbow-lagoon',
    name: 'Rainbow Lagoon',
    icon: '🌈',
    skyGradient: ['#7CD6FF', '#8EE7CC', '#B8F6A4'],
    grassGradient: ['#56C3E8', '#2F9CC6', '#1D6E9D'],
    accent: '#2DD4BF',
  },
  {
    id: 'starlight-garden',
    name: 'Starlight Garden',
    icon: '🌟',
    skyGradient: ['#A8C3FF', '#CBB8FF', '#FFD4F6'],
    grassGradient: ['#8BCF6A', '#63B54D', '#3E8F34'],
    accent: '#A855F7',
  },
  {
    id: 'rocket-nebula',
    name: 'Rocket Nebula',
    icon: '🚀',
    skyGradient: ['#6FB4FF', '#7DA0FF', '#B197FC'],
    grassGradient: ['#67C46A', '#4BAF52', '#2E8E3C'],
    accent: '#3B9EFF',
  },
];

const clampLevel = (level: number): number =>
  Math.max(1, Math.min(MAX_GAME_LEVEL, Math.round(level)));

const getLevelBand = (level: number): LevelBand => {
  if (level <= 7) return 'easy';
  if (level <= 14) return 'medium';
  return 'hard';
};

const round = (value: number): number => Math.round(value);

export const getRequiredStarsForLevel = (level: number): number => {
  const safeLevel = clampLevel(level);
  if (safeLevel <= 1) return 0;
  return (safeLevel - 1) * 2;
};

export const getUnlockedLevelFromStars = (stars: number): number => {
  const safeStars = Math.max(0, round(stars));
  let unlocked = 1;
  for (let level = 2; level <= MAX_GAME_LEVEL; level += 1) {
    if (safeStars >= getRequiredStarsForLevel(level)) {
      unlocked = level;
    } else {
      break;
    }
  }
  return unlocked;
};

export const calculateStarsForRound = (
  input: StarCalculationInput
): StarCalculationResult => {
  const accuracyStar = input.accuracy >= input.minAccuracy;
  const speedStar =
    input.timeMs !== null &&
    Number.isFinite(input.timeMs) &&
    input.timeMs > 0 &&
    input.timeMs <= input.speedTargetMs;
  const noHintStar = !input.hintsUsed;
  const effortStar = !input.completed && input.awardEffortStar;

  let starsEarned = 0;
  if (input.completed) {
    starsEarned =
      Number(accuracyStar) + Number(speedStar) + Number(noHintStar);
    if (starsEarned === 0) {
      // Keep completed rounds rewarding for kids.
      starsEarned = 1;
    }
  } else if (effortStar) {
    starsEarned = 1;
  }

  return {
    starsEarned: Math.max(0, Math.min(3, starsEarned)),
    breakdown: {
      accuracyStar,
      speedStar,
      noHintStar,
      effortStar,
    },
  };
};

export const getMathLevelConfig = (level: number): MathLevelConfig => {
  const safeLevel = clampLevel(level);
  const band = getLevelBand(safeLevel);

  const operations: MathOperation[] = ['add'];
  if (safeLevel >= 6) operations.push('subtract');
  if (safeLevel >= 15) operations.push('multiply');
  if (safeLevel >= 18) operations.push('modulo');

  const maxOperand =
    safeLevel <= 7
      ? 6 + safeLevel
      : safeLevel <= 14
        ? 12 + (safeLevel - 7) * 2
        : 26 + (safeLevel - 14) * 3;

  return {
    level: safeLevel,
    band,
    operations,
    minOperand: safeLevel >= 10 ? 2 : 1,
    maxOperand,
    questionCount: safeLevel <= 5 ? 8 : safeLevel <= 12 ? 10 : 12,
    minAccuracy: safeLevel <= 7 ? 0.62 : safeLevel <= 14 ? 0.7 : 0.78,
    speedTargetMs: Math.max(2800, 7800 - safeLevel * 220),
  };
};

export const getAlphabetLevelConfig = (level: number): AlphabetLevelConfig => {
  const safeLevel = clampLevel(level);
  return {
    level: safeLevel,
    band: getLevelBand(safeLevel),
    // L1 starts at 8 letters, L19+ reaches full alphabet.
    letterCount: Math.min(26, 7 + safeLevel),
    minAccuracy: safeLevel <= 7 ? 0.7 : safeLevel <= 14 ? 0.78 : 0.84,
    speedTargetMs: Math.max(30000, 94000 - safeLevel * 2300),
  };
};

export const getAnimalLevelConfig = (level: number): AnimalLevelConfig => {
  const safeLevel = clampLevel(level);
  const band = getLevelBand(safeLevel);
  const pairs = Math.min(10, 4 + Math.floor((safeLevel - 1) / 3));
  const columns = pairs >= 8 ? 4 : pairs >= 6 ? 4 : 3;
  const durationSeconds = Math.max(46, 95 - (safeLevel - 1) * 2);
  const lives = Math.max(3, 7 - Math.floor((safeLevel - 1) / 4));

  return {
    level: safeLevel,
    band,
    label: `L${safeLevel}`,
    pairs,
    columns,
    lives,
    durationSeconds,
    pairPoints: 13 + safeLevel,
    streakBonus: 3 + Math.floor(safeLevel / 4),
    completionBonus: 34 + safeLevel * 6,
    minAccuracy: safeLevel <= 7 ? 0.58 : safeLevel <= 14 ? 0.68 : 0.76,
    speedTargetMs: Math.floor(durationSeconds * 700),
  };
};

export const isMilestoneLevel = (level: number): boolean =>
  [5, 10, 15, 20].includes(clampLevel(level));

export const getMilestoneSticker = (level: number): string => {
  const safeLevel = clampLevel(level);
  if (safeLevel >= 20) return '👑';
  if (safeLevel >= 15) return '🦄';
  if (safeLevel >= 10) return '🚀';
  if (safeLevel >= 5) return '🌈';
  return '⭐';
};

export const getThemeByMilestoneCount = (milestoneCount: number): MilestoneTheme =>
  PROGRESSION_THEMES[
    Math.max(0, Math.min(PROGRESSION_THEMES.length - 1, milestoneCount))
  ];

export const getDateKey = (input?: Date | number | string): string => {
  const date =
    input instanceof Date
      ? input
      : typeof input === 'number' || typeof input === 'string'
        ? new Date(input)
        : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isNextDay = (previousDateKey: string, currentDateKey: string): boolean => {
  const previous = new Date(`${previousDateKey}T00:00:00`);
  const current = new Date(`${currentDateKey}T00:00:00`);
  const diffMs = current.getTime() - previous.getTime();
  return diffMs === 24 * 60 * 60 * 1000;
};

export const getUnlockProgressRatio = (
  currentStars: number,
  level: number
): number => {
  const safeLevel = clampLevel(level);
  const previousReq = getRequiredStarsForLevel(safeLevel);
  const nextReq =
    safeLevel >= MAX_GAME_LEVEL
      ? previousReq + 1
      : getRequiredStarsForLevel(safeLevel + 1);
  const span = Math.max(1, nextReq - previousReq);
  const delta = Math.max(0, Math.min(span, currentStars - previousReq));
  return delta / span;
};
