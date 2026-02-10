import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MathGameScreen } from '@/features/math-game/screens/MathGameScreen';

export default function MathGame() {
  return (
    <View style={styles.container}>
      <MathGameScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
