import {
  DIFFICULTY_MULTIPLIER,
  applyScoreFormula,
  getComboBonus,
  getDifficultyMultiplier,
  getSpeedBonus,
  toAccuracy,
} from '@/features/score/model/scoring';

describe('score formula utilities', () => {
  test('difficulty multipliers are stable', () => {
    expect(DIFFICULTY_MULTIPLIER.easy).toBe(1);
    expect(DIFFICULTY_MULTIPLIER.medium).toBe(1.25);
    expect(DIFFICULTY_MULTIPLIER.hard).toBe(1.5);

    expect(getDifficultyMultiplier('easy')).toBe(1);
    expect(getDifficultyMultiplier('medium')).toBe(1.25);
    expect(getDifficultyMultiplier('hard')).toBe(1.5);
  });

  test('speed bonus honors thresholds', () => {
    const config = {
      fastMs: 1000,
      mediumMs: 2500,
      fastBonus: 5,
      mediumBonus: 2,
      slowBonus: 0,
    };

    expect(getSpeedBonus(600, config)).toBe(5);
    expect(getSpeedBonus(1800, config)).toBe(2);
    expect(getSpeedBonus(3000, config)).toBe(0);
  });

  test('combo bonus starts at configured streak and caps at max', () => {
    const config = { startAt: 3, maxBonus: 4 };

    expect(getComboBonus(1, config)).toBe(0);
    expect(getComboBonus(3, config)).toBe(1);
    expect(getComboBonus(4, config)).toBe(2);
    expect(getComboBonus(10, config)).toBe(4);
  });

  test('applyScoreFormula combines bonuses and difficulty', () => {
    expect(
      applyScoreFormula({
        basePoints: 10,
        speedBonus: 2,
        comboBonus: 3,
        difficulty: 'medium',
      })
    ).toBe(19);
  });

  test('accuracy is correct and safe for zero attempts', () => {
    expect(toAccuracy(0, 0)).toBe(0);
    expect(toAccuracy(8, 2)).toBe(0.8);
  });
});
