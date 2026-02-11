import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

// Using a public confetti animation Lottie file.
// For production, download this JSON and require it locally: require('@/assets/animations/confetti.json')
const CONFETTI_SOURCE = 'https://assets2.lottiefiles.com/packages/lf20_u4yrau.json'; // Simpler, reliable confetti burst

export const CelebrationEffect = React.memo(({ trigger }: { trigger: number }) => {
  if (trigger === 0) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]} pointerEvents="none">
      <LottieView
        key={trigger} // Force re-mount on every trigger
        source={{ uri: CONFETTI_SOURCE }}
        style={{ width: width, height: height }}
        resizeMode="cover"
        autoPlay
        loop={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({});
