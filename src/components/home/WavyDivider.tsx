import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

/**
 * Wavy Divider Component.
 */
export const WavyDivider: React.FC = () => {
  return (
    <View style={styles.wavyDividerContainer}>
      <Text style={styles.wavyText} numberOfLines={1} ellipsizeMode="clip">
        {'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wavyDividerContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
    opacity: 0.5,
    overflow: 'hidden',
  },
  wavyText: {
    color: Colors.primary.main,
    fontSize: 24,
    lineHeight: 24,
    fontWeight: 'bold',
    letterSpacing: -7,
    marginTop: -8,
  },
});
