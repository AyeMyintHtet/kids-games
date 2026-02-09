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

  // Animation durations (ms)
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
} as const;

export type ConfigType = typeof Config;
