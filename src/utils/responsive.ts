import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Responsive sizing utilities.
 * Scales based on screen size while maintaining minimum touch targets.
 */
export const scale = (size: number): number => {
  const baseWidth = 375;
  return (SCREEN_WIDTH / baseWidth) * size;
};

export const verticalScale = (size: number): number => {
  const baseHeight = 812;
  return (SCREEN_HEIGHT / baseHeight) * size;
};

export { SCREEN_WIDTH, SCREEN_HEIGHT };
