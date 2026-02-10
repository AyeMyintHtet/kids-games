import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/colors';
import TactileButton from '../src/components/TactileButton';

/**
 * Settings Screen
 * 
 * Provides controls for:
 * - Audio settings (Music, Sound Effects) - Placeholders for now
 * - Back navigation to Home
 */
export default function SettingsScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient - slightly different from Home to indicate "modal" feel */}
      <LinearGradient
        colors={['#A5B8D1', '#E8F9ED']} // Cloudy blue to soft green
        style={styles.background}
      />

      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          <TactileButton
            onPress={handleBack}
            color={Colors.fun.coral}
            size="small"
            emoji="◀️"
            shadowColor="#C06060" // Darker coral
          />
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 60 }} /> {/* Spacer for centering title */}
        </View>

        <View style={styles.settingsContainer}>
          {/* Placeholder Settings Options */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Music 🎵</Text>
            <TactileButton
              onPress={() => { }}
              color={Colors.primary.main}
              size="small"
              emoji="🔊"
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Sounds 🔔</Text>
            <TactileButton
              onPress={() => { }}
              color={Colors.primary.main}
              size="small"
              emoji="🔊"
            />
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
    marginTop: 20, // Add a bit of breathing room from safe area
  },
  title: {
    fontFamily: 'SuperWonder',
    fontSize: 32,
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  settingsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    padding: 20,
    gap: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 15,
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLabel: {
    fontFamily: 'SuperWonder',
    fontSize: 20,
    color: Colors.neutral[700],
  },
  infoSection: {
    marginTop: 'auto',
    alignItems: 'center',
    marginBottom: 20
  },
  versionText: {
    fontFamily: 'SuperWonder',
    color: Colors.neutral[500],
    fontSize: 14
  }
});
