import {
  ACHIEVEMENTS,
  getUnlockedAchievementIds,
  type AchievementProgressSnapshot,
} from '@/features/achievements/model/achievements';

const buildProgress = (
  overrides?: Partial<AchievementProgressSnapshot>
): AchievementProgressSnapshot => ({
  totalScore: 0,
  gamesPlayed: 0,
  gameStats: {
    math: {
      gamesPlayed: 0,
      bestScore: 0,
      bestAccuracy: 0,
      bestStreak: 0,
    },
    alphabet: {
      gamesPlayed: 0,
      bestScore: 0,
      bestAccuracy: 0,
      bestStreak: 0,
    },
    animals: {
      gamesPlayed: 0,
      bestScore: 0,
      bestAccuracy: 0,
      bestStreak: 0,
    },
  },
  ...overrides,
});

describe('achievements model', () => {
  test('has expected child-friendly badge set', () => {
    const ids = ACHIEVEMENTS.map((item) => item.id);
    expect(ids).toEqual(['abc_master', 'math_rocket', 'animal_memory_pro']);
  });

  test('unlocks ABC Master from alphabet best score', () => {
    const unlocked = getUnlockedAchievementIds(
      buildProgress({
        gameStats: {
          ...buildProgress().gameStats,
          alphabet: {
            gamesPlayed: 1,
            bestScore: 230,
            bestAccuracy: 0.8,
            bestStreak: 5,
          },
        },
      })
    );

    expect(unlocked).toContain('abc_master');
  });

  test('unlocks Math Rocket from streak or score', () => {
    const byStreak = getUnlockedAchievementIds(
      buildProgress({
        gameStats: {
          ...buildProgress().gameStats,
          math: {
            gamesPlayed: 1,
            bestScore: 90,
            bestAccuracy: 0.9,
            bestStreak: 8,
          },
        },
      })
    );
    const byScore = getUnlockedAchievementIds(
      buildProgress({
        gameStats: {
          ...buildProgress().gameStats,
          math: {
            gamesPlayed: 1,
            bestScore: 160,
            bestAccuracy: 0.6,
            bestStreak: 3,
          },
        },
      })
    );

    expect(byStreak).toContain('math_rocket');
    expect(byScore).toContain('math_rocket');
  });

  test('unlocks Animal Memory Pro from animal best score', () => {
    const unlocked = getUnlockedAchievementIds(
      buildProgress({
        gameStats: {
          ...buildProgress().gameStats,
          animals: {
            gamesPlayed: 1,
            bestScore: 120,
            bestAccuracy: 0.7,
            bestStreak: 4,
          },
        },
      })
    );

    expect(unlocked).toContain('animal_memory_pro');
  });
});
