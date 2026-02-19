/**
 * Color constants for Learny Land - 2026 Kid-Friendly Standards.
 * Uses a vibrant, child-friendly palette with tactile design focus.
 */

export const Colors = {
  // Primary - Rainbow Green (Growth/Correct)
  primary: {
    main: '#35D461',
    light: '#5EE080',
    dark: '#2AB84E',
    50: '#E8F9ED',
    100: '#C5F2D3',
    200: '#9EEAB6',
    300: '#77E299',
    400: '#50DA7C',
    500: '#35D461', // Main primary
    600: '#2AB84E',
    700: '#1F9C3B',
    800: '#148028',
    900: '#096415',
  },

  // Accent - Golden Yellow (Happiness/Stars)
  accent: {
    main: '#F9E104',
    light: '#FAEB4D',
    dark: '#D9C303',
    50: '#FFFDE6',
    100: '#FEF9BF',
    200: '#FDF599',
    300: '#FCF172',
    400: '#FAED4C',
    500: '#F9E104', // Main accent
    600: '#D9C303',
    700: '#B9A503',
    800: '#998702',
    900: '#796901',
  },

  // Danger - California Orange (Try Again - Not harsh red)
  danger: {
    main: '#F99D07',
    light: '#FAB43F',
    dark: '#D98606',
    50: '#FEF4E6',
    100: '#FCE3BF',
    200: '#FBD299',
    300: '#F9C172',
    400: '#F8B04C',
    500: '#F99D07', // Main danger
    600: '#D98606',
    700: '#B96F05',
    800: '#995804',
    900: '#794103',
  },

  // Secondary - Bright Blue (Learning/Exploration)
  secondary: {
    main: '#3B9EFF',
    light: '#6BB5FF',
    dark: '#2B87E0',
    50: '#EDF8FF',
    100: '#D6EEFF',
    200: '#B5E2FF',
    300: '#83D2FF',
    400: '#48B6FF',
    500: '#3B9EFF', // Main secondary
    600: '#2B87E0',
    700: '#1B70C0',
    800: '#0B59A0',
    900: '#004280',
  },

  // Fun Colors for variety
  fun: {
    pink: '#FF6B9D',
    purple: '#A855F7',
    coral: '#FF7F7F',
    teal: '#2DD4BF',
    lime: '#84CC16',
  },

  // Candy colors for magical/playful animation effects (confetti, bubbles, sparkles)
  candy: {
    pink: '#FF80AB',
    bubblegum: '#FF4081',
    mint: '#64FFDA',
    lavender: '#B388FF',
    peach: '#FFAB91',
    lemon: '#FFF176',
    skyBlue: '#81D4FA',
    lilac: '#CE93D8',
    coral: '#FF8A80',
    seafoam: '#A7FFEB',
  },

  // Neutral grays
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Semantic colors
  success: '#35D461',
  warning: '#F9E104',
  error: '#F99D07',
  info: '#3B9EFF',

  // Background colors
  background: '#87CEEB', // Sky blue for outdoor feel
  backgroundGradientTop: '#87CEEB',
  backgroundGradientBottom: '#4CAF50', // Grass green
  cream: '#FFF9E6',
  white: '#FFFFFF',

  // Shared gradients for screen themes
  gradients: {
    homeSky: ['#87CEEB', '#B0E0E6', '#98D8C8'] as const,
    homeGrass: ['#7CB342', '#558B2F', '#33691E'] as const,
    animalOcean: ['#83D9FF', '#4EBEFF', '#2D86E0'] as const,
    modalPastel: ['#FFFDF0', '#FFEFF8', '#EAF6FF'] as const,
  },
} as const;

export type ColorScheme = typeof Colors;
