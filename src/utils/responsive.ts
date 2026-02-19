import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;
const SMALL_HEIGHT_BREAKPOINT = 740;
const VERY_SMALL_HEIGHT_BREAKPOINT = 680;

export const MIN_TOUCH_TARGET = 88;
export const isSmallHeightDevice = SCREEN_HEIGHT <= SMALL_HEIGHT_BREAKPOINT;
export const isVerySmallHeightDevice = SCREEN_HEIGHT <= VERY_SMALL_HEIGHT_BREAKPOINT;

/**
 * Responsive sizing utilities.
 * Scales based on screen size while maintaining minimum touch targets.
 */
export const scale = (size: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

export const verticalScale = (size: number): number => {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

export const moderateScale = (size: number, factor = 0.5): number =>
  size + (scale(size) - size) * factor;

export const normalizeTouchSize = (size: number): number =>
  Math.max(moderateScale(size, 0.35), MIN_TOUCH_TARGET);

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const scaleInRange = (size: number, min: number, max: number): number =>
  clamp(scale(size), min, max);

export const verticalScaleInRange = (
  size: number,
  min: number,
  max: number
): number => clamp(verticalScale(size), min, max);

export { SCREEN_WIDTH, SCREEN_HEIGHT };
