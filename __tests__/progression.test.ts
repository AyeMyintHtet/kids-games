import {
  calculateStarsForRound,
  getAlphabetLevelConfig,
  getAnimalLevelConfig,
  getMathLevelConfig,
  getRequiredStarsForLevel,
  getUnlockedLevelFromStars,
} from '@/features/progression/model/progression';

describe('progression model', () => {
  test('unlock requirement grows by 2 stars per level', () => {
    expect(getRequiredStarsForLevel(1)).toBe(0);
    expect(getRequiredStarsForLevel(2)).toBe(2);
    expect(getRequiredStarsForLevel(6)).toBe(10);
  });

  test('unlocked level maps from earned stars', () => {
    expect(getUnlockedLevelFromStars(0)).toBe(1);
    expect(getUnlockedLevelFromStars(8)).toBe(5);
    expect(getUnlockedLevelFromStars(40)).toBeGreaterThanOrEqual(20);
  });

  test('star economy uses accuracy + speed + no-hint factors', () => {
    const perfect = calculateStarsForRound({
      accuracy: 0.95,
      timeMs: 3800,
      hintsUsed: false,
      completed: true,
      minAccuracy: 0.7,
      speedTargetMs: 4200,
      awardEffortStar: false,
    });
    const effort = calculateStarsForRound({
      accuracy: 0.45,
      timeMs: 12000,
      hintsUsed: true,
      completed: false,
      minAccuracy: 0.7,
      speedTargetMs: 4200,
      awardEffortStar: true,
    });

    expect(perfect.starsEarned).toBe(3);
    expect(effort.starsEarned).toBe(1);
    expect(effort.breakdown.effortStar).toBe(true);
  });

  test('content gating scales per level', () => {
    const earlyMath = getMathLevelConfig(1);
    const advancedMath = getMathLevelConfig(16);
    expect(earlyMath.operations).toEqual(['add']);
    expect(advancedMath.operations).toContain('multiply');

    const earlyAlphabet = getAlphabetLevelConfig(1);
    const advancedAlphabet = getAlphabetLevelConfig(19);
    expect(earlyAlphabet.letterCount).toBeLessThan(advancedAlphabet.letterCount);
    expect(advancedAlphabet.letterCount).toBe(26);

    const earlyAnimals = getAnimalLevelConfig(1);
    const advancedAnimals = getAnimalLevelConfig(20);
    expect(earlyAnimals.pairs).toBeLessThan(advancedAnimals.pairs);
    expect(earlyAnimals.durationSeconds).toBeGreaterThan(advancedAnimals.durationSeconds);
  });
});

