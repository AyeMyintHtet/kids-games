import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/colors';
import { TactileButton } from '../src/components/TactileButton';
import { useAppStore } from '../src/store/useAppStore';
import type { MathOperation } from '../src/features/progression/model/progression';
import {
  isSmallHeightDevice,
  isVerySmallHeightDevice,
  scale,
  verticalScale,
} from '../src/utils/responsive';

/**
 * Settings Screen
 * 
 * Provides controls for:
 * - Audio settings (Music, Sound Effects) - Placeholders for now
 * - Back navigation to Home
 */
export default function SettingsScreen() {
  const router = useRouter();
  const isCompact = isSmallHeightDevice;
  const isVeryCompact = isVerySmallHeightDevice;
  const mathOperationPrefs = useAppStore((state) => state.settings.mathOperationPrefs);
  const setMathOperationEnabled = useAppStore((state) => state.setMathOperationEnabled);
  const mathOperationOptions: { key: MathOperation; label: string; emoji: string }[] = [
    { key: 'add', label: '+', emoji: '➕' },
    { key: 'subtract', label: '-', emoji: '➖' },
    { key: 'multiply', label: 'x', emoji: '✖️' },
    { key: 'modulo', label: '%', emoji: '🧮' },
  ];

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
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isCompact && styles.scrollContentCompact,
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[styles.header, isCompact && styles.headerCompact]}>
            <TactileButton
              onPress={handleBack}
              color={Colors.fun.coral}
              size="small"
              emoji="◀️"
              shadowColor="#C06060"
            />
            <Text style={[styles.title, isCompact && styles.titleCompact]}>
              Settings
            </Text>
            <View style={{ width: isVeryCompact ? 50 : 60 }} />
          </View>

          <View style={[styles.settingsContainer, isCompact && styles.settingsContainerCompact]}>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, isCompact && styles.settingLabelCompact]}>
                Music 🎵
              </Text>
              <TactileButton
                onPress={() => { }}
                color={Colors.primary.main}
                size="small"
                emoji="🔊"
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, isCompact && styles.settingLabelCompact]}>
                Sounds 🔔
              </Text>
              <TactileButton
                onPress={() => { }}
                color={Colors.primary.main}
                size="small"
                emoji="🔊"
              />
            </View>

            <View style={styles.mathOpsSection}>
              <Text style={[styles.settingLabel, isCompact && styles.settingLabelCompact]}>
                Math Signs
              </Text>
              <View style={styles.mathOpsRow}>
                {mathOperationOptions.map((option) => {
                  const enabled = mathOperationPrefs[option.key];
                  return (
                    <TactileButton
                      key={option.key}
                      onPress={() => setMathOperationEnabled(option.key, !enabled)}
                      color={enabled ? Colors.primary.main : Colors.neutral[300]}
                      size="small"
                      style={styles.mathOpButton}
                    >
                      <Text style={styles.mathOpText}>
                        {option.emoji} {option.label}
                      </Text>
                    </TactileButton>
                  );
                })}
              </View>
              <Text style={styles.mathHintText}>
                Parent control: keep only the signs you want in Math Adventure.
              </Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentCompact: {
    paddingBottom: verticalScale(16),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
    marginTop: 20, // Add a bit of breathing room from safe area
  },
  headerCompact: {
    marginBottom: verticalScale(22),
    marginTop: verticalScale(10),
  },
  title: {
    fontFamily: 'SuperWonder',
    fontSize: 32,
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  titleCompact: {
    fontSize: scale(26),
  },
  settingsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    padding: 20,
    gap: 20,
  },
  settingsContainerCompact: {
    padding: scale(14),
    gap: verticalScale(12),
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
  settingLabelCompact: {
    fontSize: scale(16),
  },
  mathOpsSection: {
    gap: verticalScale(8),
  },
  mathOpsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  mathOpButton: {
    width: scale(84),
    height: scale(56),
    borderRadius: scale(14),
  },
  mathOpText: {
    fontFamily: 'SuperWonder',
    fontSize: scale(14),
    color: Colors.white,
  },
  mathHintText: {
    fontFamily: 'SuperWonder',
    fontSize: scale(11),
    color: Colors.neutral[600],
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
