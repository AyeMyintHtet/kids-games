import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { TactileButton } from '@/components/TactileButton';
import { Colors } from '@/constants/colors';
import { scale } from '@/utils/responsive';

// Icon assets
const SETTINGS_ICON = require('@/assets/images/settings.png');
const SPEAKER_ICON = require('@/assets/images/speaker.png');
const MUTE_ICON = require('@/assets/images/mute.png');

export const SettingsButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  return (
    <TactileButton
      onPress={onPress}
      color={Colors.white}
      shadowColor="#A5B8D1"
      size="small"
      style={styles.cornerButton}
      accessibilityLabel="Settings"
      accessibilityHint="Opens the settings menu"
    >
      <Image source={SETTINGS_ICON} style={styles.iconImage} />
    </TactileButton>
  );
};

export const SoundButton: React.FC<{ onPress: () => void; isMuted: boolean }> = ({
  onPress,
  isMuted,
}) => {
  return (
    <TactileButton
      onPress={onPress}
      color={Colors.white}
      shadowColor="#A5B8D1"
      size="small"
      style={styles.cornerButton}
      accessibilityLabel={isMuted ? "Unmute sound" : "Mute sound"}
      accessibilityHint="Toggles background music and sound effects"
    >
      <Image
        source={isMuted ? MUTE_ICON : SPEAKER_ICON}
        style={styles.iconImage}
      />
    </TactileButton>
  );
};

export const ParentGateButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  return (
    <View style={styles.parentGateContainer}>
      <TactileButton
        onPress={onPress}
        color={Colors.fun.purple}
        size="small"
        style={styles.cornerButton}
        accessibilityLabel="Parent Gate"
        accessibilityHint="Access information for parents"
      >
        <Text style={styles.cornerButtonEmoji}>ℹ️</Text>
      </TactileButton>
      <Text style={styles.parentGateLabel}>Parent{'\n'}Gate</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  cornerButton: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
  },
  iconImage: {
    width: scale(32),
    height: scale(32),
    resizeMode: 'contain',
  },
  parentGateContainer: {
    alignItems: 'center',
  },
  cornerButtonEmoji: {
    fontSize: scale(28),
  },
  parentGateLabel: {
    fontFamily: 'SuperWonder',
    fontSize: scale(10),
    color: Colors.fun.purple,
    textAlign: 'center',
    marginTop: 4,
  },
});
