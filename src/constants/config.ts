/**
 * Application configuration constants.
 * Centralized config for easy maintenance.
 */

export const Config = {
  // App info
  APP_NAME: 'Kids Games',
  APP_VERSION: '1.0.0',

  // Feature flags
  features: {
    enableHaptics: true,
    enableSounds: true,
    enableAnimations: true,
  },

  // Game settings
  game: {
    defaultDifficulty: 'easy' as const,
    maxScore: 999999,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes in ms
  },

  // Legal links
  legal: {
    // Must be a public URL for app store policy compliance.
    privacyPolicyUrl:
      'https://raw.githubusercontent.com/AyeMyintHtet/kids-games/main/PRIVACY_POLICY.md',
  },

  // Monetization (Android-first, child-directed)
  monetization: {
    adsEnabled: true,
    bannerEnabled: true,
    interstitialEnabled: true,
    androidOnlyMonetization: true,
    interstitialCooldownSec: 180,
    interstitialMaxPerDay: 6,
    interstitialRoundInterval: 2,
    adUnitIds: {
      // Google AdMob official test IDs. Replace with production IDs before release.
      androidBanner: 'ca-app-pub-3940256099942544/6300978111',
      androidInterstitial: 'ca-app-pub-3940256099942544/1033173712',
    },
    remoteConfig: {
      // Remote kill switch payload format: { "adsEnabled": true | false }
      url: 'https://raw.githubusercontent.com/AyeMyintHtet/kids-games/main/ads-config.json',
      timeoutMs: 4000,
    },
    compliance: {
      childDirectedTreatment: true,
      underAgeOfConsent: true,
      maxAdContentRating: 'G' as const,
      nonPersonalizedAdsOnly: true,
    },
  },

  // Animation durations (ms)
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
} as const;

export type ConfigType = typeof Config;
