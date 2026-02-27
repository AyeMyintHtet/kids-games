/* eslint-disable import/first, @typescript-eslint/no-require-imports */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { getDateKey } from '@/features/progression/model/progression';
import { useAppStore } from '@/store/useAppStore';

const setMonetizationState = (payload: {
  remoteAdsEnabled?: boolean;
  lastInterstitialAt: number | null;
  interstitialShownToday: number;
  roundsSinceInterstitial: number;
  dateKeyForAdCounters: string;
}) => {
  useAppStore.setState((state) => ({
    monetization: {
      ...state.monetization,
      ...payload,
    },
  }));
};

describe('monetization store state', () => {
  beforeEach(() => {
    useAppStore.getState().resetProgress();
    setMonetizationState({
      remoteAdsEnabled: true,
      lastInterstitialAt: null,
      interstitialShownToday: 0,
      roundsSinceInterstitial: 0,
      dateKeyForAdCounters: getDateKey(),
    });
  });

  test('recordGameResult increments roundsSinceInterstitial', () => {
    useAppStore.getState().recordGameResult({
      game: 'math',
      score: 12,
      outcome: 'won',
      level: 1,
    });

    expect(useAppStore.getState().monetization.roundsSinceInterstitial).toBe(1);
  });

  test('markInterstitialShown records timestamp and resets round counter', () => {
    setMonetizationState({
      lastInterstitialAt: null,
      interstitialShownToday: 2,
      roundsSinceInterstitial: 4,
      dateKeyForAdCounters: getDateKey(),
    });

    const shownAt = Date.now();
    useAppStore.getState().markInterstitialShown(shownAt);
    const monetization = useAppStore.getState().monetization;

    expect(monetization.lastInterstitialAt).toBe(shownAt);
    expect(monetization.interstitialShownToday).toBe(3);
    expect(monetization.roundsSinceInterstitial).toBe(0);
  });

  test('markInterstitialShown resets stale daily counters across date boundary', () => {
    const yesterday = getDateKey(Date.now() - 24 * 60 * 60 * 1000);
    const now = Date.now();

    setMonetizationState({
      lastInterstitialAt: null,
      interstitialShownToday: 5,
      roundsSinceInterstitial: 1,
      dateKeyForAdCounters: yesterday,
    });

    useAppStore.getState().markInterstitialShown(now);
    const monetization = useAppStore.getState().monetization;

    expect(monetization.dateKeyForAdCounters).toBe(getDateKey(now));
    expect(monetization.interstitialShownToday).toBe(1);
  });

  test('recordGameResult resets stale daily counters and keeps round progression', () => {
    const yesterday = getDateKey(Date.now() - 24 * 60 * 60 * 1000);

    setMonetizationState({
      lastInterstitialAt: null,
      interstitialShownToday: 4,
      roundsSinceInterstitial: 2,
      dateKeyForAdCounters: yesterday,
    });

    useAppStore.getState().recordGameResult({
      game: 'alphabet',
      score: 7,
      outcome: 'won',
      level: 1,
    });

    const monetization = useAppStore.getState().monetization;
    expect(monetization.dateKeyForAdCounters).toBe(getDateKey());
    expect(monetization.interstitialShownToday).toBe(0);
    expect(monetization.roundsSinceInterstitial).toBe(3);
  });
});

