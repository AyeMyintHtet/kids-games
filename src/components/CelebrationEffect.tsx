import React, { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PIECE_COUNT = 18;
const CELEBRATION_SYMBOLS = ['🎉', '✨', '🎊', '⭐', '🌟'];

type ConfettiPieceProps = {
  index: number;
  trigger: number;
};

const ConfettiPiece = ({ index, trigger }: ConfettiPieceProps) => {
  const translateY = useSharedValue(-40);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  const startX = (SCREEN_WIDTH / PIECE_COUNT) * index + (index % 2 === 0 ? 8 : -8);
  const horizontalDrift = ((index % 5) - 2) * 18;

  useEffect(() => {
    const delay = index * 35;
    const duration = 950 + index * 22;
    const finalRotation = index % 2 === 0 ? 360 : -360;

    opacity.value = 0;
    translateY.value = -40;
    translateX.value = 0;
    rotate.value = 0;

    opacity.value = withDelay(delay, withTiming(1, { duration: 120 }));
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 80, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );
    translateX.value = withDelay(
      delay,
      withTiming(horizontalDrift, {
        duration,
        easing: Easing.inOut(Easing.quad),
      })
    );
    rotate.value = withDelay(
      delay,
      withTiming(finalRotation, {
        duration,
        easing: Easing.linear,
      })
    );
    opacity.value = withDelay(delay + duration - 220, withTiming(0, { duration: 220 }));
  }, [horizontalDrift, index, opacity, rotate, translateX, translateY, trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.Text style={[styles.piece, { left: startX }, animatedStyle]}>
      {CELEBRATION_SYMBOLS[index % CELEBRATION_SYMBOLS.length]}
    </Animated.Text>
  );
};

const CelebrationEffectBase = ({ trigger }: { trigger: number }) => {
  if (trigger === 0) return null;

  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: PIECE_COUNT }).map((_, index) => (
        <ConfettiPiece key={`${trigger}-${index}`} index={index} trigger={trigger} />
      ))}
    </Animated.View>
  );
};

CelebrationEffectBase.displayName = 'CelebrationEffectBase';

export const CelebrationEffect = React.memo(CelebrationEffectBase);

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: -30,
    zIndex: 9999,
    fontSize: 20,
  },
});
