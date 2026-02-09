/**
 * Color constants for the Kids Games app.
 * Uses a vibrant, child-friendly palette.
 */

export const Colors = {
  // Primary - Warm Orange (energetic and friendly)
  primary: {
    50: '#fef3e2',
    100: '#fce7c5',
    200: '#f9cf8b',
    300: '#f5b750',
    400: '#f29f16',
    500: '#e88b09', // Main primary
    600: '#cc6c05',
    700: '#a94d08',
    800: '#893d0e',
    900: '#72330f',
  },

  // Secondary - Bright Blue (calm and trustworthy)
  secondary: {
    50: '#edf8ff',
    100: '#d6eeff',
    200: '#b5e2ff',
    300: '#83d2ff',
    400: '#48b6ff',
    500: '#1e93ff', // Main secondary
    600: '#0672ff',
    700: '#0059eb',
    800: '#0849be',
    900: '#0d4195',
  },

  // Accent - Purple (magical and fun)
  accent: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef', // Main accent
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },

  // Neutral grays
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },

  // Semantic colors
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Background
  background: '#ffffff',
  backgroundDark: '#0f172a',
} as const;

export type ColorScheme = typeof Colors;
