import {
  shouldShowInterstitialByCaps,
  type InterstitialCapsConfig,
  type InterstitialCapsState,
} from '@/features/monetization/model/ads';

const caps: InterstitialCapsConfig = {
  cooldownSec: 180,
  maxPerDay: 6,
  roundInterval: 2,
};

const baseState: InterstitialCapsState = {
  lastInterstitialAt: null,
  interstitialShownToday: 0,
  roundsSinceInterstitial: 0,
};

describe('monetization interstitial caps', () => {
  test('allows interstitial when caps are satisfied', () => {
    const now = 1_000_000;
    const state: InterstitialCapsState = {
      ...baseState,
      roundsSinceInterstitial: 2,
    };

    expect(shouldShowInterstitialByCaps(state, caps, now)).toBe(true);
  });

  test('blocks when rounds since last interstitial are below interval', () => {
    const now = 1_000_000;
    const state: InterstitialCapsState = {
      ...baseState,
      roundsSinceInterstitial: 1,
    };

    expect(shouldShowInterstitialByCaps(state, caps, now)).toBe(false);
  });

  test('blocks when interstitial cooldown has not passed', () => {
    const now = 1_000_000;
    const state: InterstitialCapsState = {
      ...baseState,
      roundsSinceInterstitial: 3,
      lastInterstitialAt: now - 60_000, // 60s ago
    };

    expect(shouldShowInterstitialByCaps(state, caps, now)).toBe(false);
  });

  test('blocks when daily max is already reached', () => {
    const now = 1_000_000;
    const state: InterstitialCapsState = {
      ...baseState,
      roundsSinceInterstitial: 3,
      interstitialShownToday: 6,
      lastInterstitialAt: now - 500_000,
    };

    expect(shouldShowInterstitialByCaps(state, caps, now)).toBe(false);
  });
});

