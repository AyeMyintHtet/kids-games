import { Config } from '@/constants/config';

export const AD_PLACEMENTS = {
  HOME_BANNER: 'HOME_BANNER',
  ROUND_RESULT_BANNER: 'ROUND_RESULT_BANNER',
  ROUND_RESULT_INTERSTITIAL: 'ROUND_RESULT_INTERSTITIAL',
} as const;

export type AdPlacement = (typeof AD_PLACEMENTS)[keyof typeof AD_PLACEMENTS];

export type InterstitialCapsState = {
  lastInterstitialAt: number | null;
  interstitialShownToday: number;
  roundsSinceInterstitial: number;
};

export type InterstitialCapsConfig = {
  cooldownSec: number;
  maxPerDay: number;
  roundInterval: number;
};

export const getInterstitialCapsConfig = (): InterstitialCapsConfig => ({
  cooldownSec: Config.monetization.interstitialCooldownSec,
  maxPerDay: Config.monetization.interstitialMaxPerDay,
  roundInterval: Config.monetization.interstitialRoundInterval,
});

export const isMonetizationEnabledForPlatform = (params: {
  remoteAdsEnabled: boolean;
  platform: string;
}): boolean => {
  if (!Config.monetization.adsEnabled) return false;
  if (!params.remoteAdsEnabled) return false;
  if (Config.monetization.androidOnlyMonetization && params.platform !== 'android') {
    return false;
  }
  return true;
};

export const shouldShowInterstitialByCaps = (
  state: InterstitialCapsState,
  caps: InterstitialCapsConfig,
  nowMs: number
): boolean => {
  if (state.interstitialShownToday >= caps.maxPerDay) return false;
  if (state.roundsSinceInterstitial < caps.roundInterval) return false;

  if (state.lastInterstitialAt !== null) {
    const elapsedMs = Math.max(0, nowMs - state.lastInterstitialAt);
    if (elapsedMs < caps.cooldownSec * 1000) {
      return false;
    }
  }

  return true;
};

