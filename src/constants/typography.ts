/**
 * Typography constants for consistent text styling.
 * Follows accessibility guidelines for children's apps.
 */

export const Typography = {
  // Font families (ensure these are loaded with expo-font)
  fontFamily: {
    sans: 'Inter',
    display: 'Outfit',
    rounded: 'Nunito', // Great for kids - friendly and readable
  },

  // Font sizes - larger for children's readability
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export type TypographyScheme = typeof Typography;
