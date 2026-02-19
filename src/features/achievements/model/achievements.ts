import type { GameKey } from '@/store/useAppStore';

export type AchievementId = 'abc_master' | 'math_rocket' | 'animal_memory_pro';

type AchievementGameStats = {
  gamesPlayed: number;
  bestScore: number;
  bestAccuracy: number;
  bestStreak: number;
};

export type AchievementProgressSnapshot = {
  totalScore: number;
  gamesPlayed: number;
  gameStats: Record<GameKey, AchievementGameStats>;
};

export type AchievementDefinition = {
  id: AchievementId;
  title: string;
  emoji: string;
  description: string;
  isUnlocked: (progress: AchievementProgressSnapshot) => boolean;
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'abc_master',
    title: 'ABC Master',
    emoji: '🔤',
    description: 'Reach a best Alphabet score of 220.',
    isUnlocked: (progress) => progress.gameStats.alphabet.bestScore >= 220,
  },
  {
    id: 'math_rocket',
    title: 'Math Rocket',
    emoji: '🚀',
    description: 'Get a Math streak of 8 or best Math score of 160.',
    isUnlocked: (progress) =>
      progress.gameStats.math.bestStreak >= 8 ||
      progress.gameStats.math.bestScore >= 160,
  },
  {
    id: 'animal_memory_pro',
    title: 'Animal Memory Pro',
    emoji: '🐾',
    description: 'Reach a best Animal score of 120.',
    isUnlocked: (progress) => progress.gameStats.animals.bestScore >= 120,
  },
];

export const getUnlockedAchievementIds = (
  progress: AchievementProgressSnapshot
): AchievementId[] =>
  ACHIEVEMENTS.filter((achievement) => achievement.isUnlocked(progress)).map(
    (achievement) => achievement.id
  );

export const getAchievementById = (
  id: AchievementId
): AchievementDefinition | undefined =>
  ACHIEVEMENTS.find((achievement) => achievement.id === id);
