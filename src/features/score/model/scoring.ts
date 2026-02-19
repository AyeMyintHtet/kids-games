export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_MULTIPLIER: Record<DifficultyLevel, number> = {
  easy: 1,
  medium: 1.25,
  hard: 1.5,
};

export const getDifficultyMultiplier = (difficulty: DifficultyLevel): number =>
  DIFFICULTY_MULTIPLIER[difficulty];

type SpeedBonusConfig = {
  fastMs: number;
  mediumMs: number;
  fastBonus: number;
  mediumBonus: number;
  slowBonus: number;
};

export const getSpeedBonus = (
  responseMs: number,
  config: SpeedBonusConfig
): number => {
  if (responseMs <= config.fastMs) return config.fastBonus;
  if (responseMs <= config.mediumMs) return config.mediumBonus;
  return config.slowBonus;
};

type ComboBonusConfig = {
  startAt: number;
  maxBonus: number;
};

export const getComboBonus = (
  streak: number,
  config: ComboBonusConfig
): number => {
  if (streak < config.startAt) return 0;
  return Math.min(streak - config.startAt + 1, config.maxBonus);
};

export const applyScoreFormula = (params: {
  basePoints: number;
  speedBonus?: number;
  comboBonus?: number;
  difficulty: DifficultyLevel;
}): number => {
  const speedBonus = params.speedBonus ?? 0;
  const comboBonus = params.comboBonus ?? 0;
  const multiplier = getDifficultyMultiplier(params.difficulty);
  return Math.max(
    1,
    Math.round((params.basePoints + speedBonus + comboBonus) * multiplier)
  );
};

export const toAccuracy = (correct: number, wrong: number): number => {
  const total = correct + wrong;
  if (total <= 0) return 0;
  return correct / total;
};

