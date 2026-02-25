/* eslint-disable import/first, @typescript-eslint/no-require-imports */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import {
  useAppStore,
  type MathSessionPayload,
  type SavedSession,
} from '@/store/useAppStore';

const completeDailyGoal = () => {
  const targetRounds = useAppStore.getState().progression.dailyGoal.targetRounds;
  for (let index = 0; index < targetRounds; index += 1) {
    useAppStore.getState().recordGameResult({
      game: 'math',
      score: 32,
      timeMs: 3200,
      accuracy: 0.9,
      streak: 4,
      outcome: 'won',
    });
  }
};

const sampleMathPayload: MathSessionPayload = {
  currentData: {
    question: '4 + 6 =',
    answer: 10,
    choices: [8, 10, 11, 12, 13, 14],
  },
  phase: 'playing',
  wrongAnswer: null,
  streak: 2,
  bestStreak: 3,
  roundScore: 41,
  correctCount: 3,
  wrongCount: 1,
  answeredCount: 4,
  questionStartedAt: 1000,
  sessionStartedAt: 900,
};

const sampleSession: SavedSession = {
  game: 'math',
  route: '/math-game',
  level: 2,
  phase: 'playing',
  progressLabel: 'Level 2 • 4/8 solved',
  updatedAt: '2026-02-20T10:00:00.000Z',
  payload: sampleMathPayload,
};

describe('session flow store', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useAppStore.getState().resetProgress();
    useAppStore.setState({ lastSession: null });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('daily mini goal completes by rounds and increases streak', () => {
    jest.setSystemTime(new Date('2026-02-20T09:00:00.000Z'));
    completeDailyGoal();

    const state = useAppStore.getState();
    expect(state.progression.dailyGoal.completed).toBe(true);
    expect(state.progression.dailyGoal.completedRounds).toBe(3);
    expect(state.progression.streak.current).toBe(1);
  });

  test('streak shield protects exactly one missed day', () => {
    jest.setSystemTime(new Date('2026-02-20T09:00:00.000Z'));
    completeDailyGoal();

    jest.setSystemTime(new Date('2026-02-22T09:00:00.000Z'));
    completeDailyGoal();

    let state = useAppStore.getState();
    expect(state.progression.streak.current).toBe(2);
    expect(state.progression.streak.shieldAvailable).toBe(false);

    jest.setSystemTime(new Date('2026-02-25T09:00:00.000Z'));
    completeDailyGoal();

    state = useAppStore.getState();
    expect(state.progression.streak.current).toBe(1);
  });

  test('last session can be saved and cleared safely by game key', () => {
    useAppStore.getState().saveLastSession(sampleSession);
    expect(useAppStore.getState().lastSession?.progressLabel).toBe('Level 2 • 4/8 solved');

    useAppStore.getState().clearLastSession('alphabet');
    expect(useAppStore.getState().lastSession?.game).toBe('math');

    useAppStore.getState().clearLastSession('math');
    expect(useAppStore.getState().lastSession).toBeNull();
  });
});
