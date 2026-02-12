import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';

/**
 * Child-friendly Language Dropdown Component.
 */
export const LanguageDropdown: React.FC<{
  selected: 'en' | 'es';
  onSelect: (lang: 'en' | 'es') => void;
}> = ({ selected, onSelect }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const rotation = useSharedValue(0);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    rotation.value = withTiming(isOpen ? 0 : 180);
  };

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const renderOption = (lang: 'en' | 'es', label: string, icon: string, isSelected: boolean) => (
    <TouchableOpacity
      key={lang}
      onPress={() => {
        onSelect(lang);
        setIsOpen(false);
        rotation.value = withTiming(0);
        Haptics.selectionAsync();
      }}
      style={[
        styles.languageOption,
        isSelected && styles.languageOptionSelected,
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.languageOptionContent}>
        <Text style={styles.languageIcon}>{icon}</Text>
        <Text style={[styles.languageText, isSelected && styles.languageTextSelected]}>
          {label}
        </Text>
      </View>
      {isSelected && <Text style={styles.checkMark}>✓</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.languageContainer}>
      <View style={styles.languageHeaderRow}>
        <Text style={styles.settingLabel}>Language</Text>
        <Text style={styles.wavyLineSmall}>~~~~~~</Text>
      </View>

      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          onPress={toggleDropdown}
          style={styles.dropdownTrigger}
          activeOpacity={0.8}
        >
          <View style={styles.triggerContent}>
            <Text style={styles.languageIcon}>
              {selected === 'en' ? '🌍' : '🧱'}
            </Text>
            <Text style={styles.triggerText}>
              {selected === 'en' ? 'English' : 'Español'}
            </Text>
          </View>
          <Animated.Text style={[styles.dropdownArrow, arrowStyle]}>
            ▼
          </Animated.Text>
        </TouchableOpacity>

        {isOpen && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            layout={Layout.springify()}
            style={styles.dropdownList}
          >
            {renderOption('en', 'English', '🌍', selected === 'en')}
            {renderOption('es', 'Español', '🧱', selected === 'es')}
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  languageContainer: {
    marginTop: 8,
    marginBottom: 8,
    zIndex: 10,
  },
  languageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  settingLabel: {
    fontFamily: 'SuperWonder',
    fontSize: 18,
    color: Colors.secondary[900],
  },
  wavyLineSmall: {
    color: Colors.primary.main,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: -4,
    marginTop: 4,
    opacity: 0.6,
  },
  dropdownContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.neutral[200],
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.white,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownArrow: {
    fontSize: 14,
    color: Colors.neutral[500],
  },
  triggerText: {
    fontFamily: 'SuperWonder',
    fontSize: 18,
    color: Colors.neutral[800],
  },
  dropdownList: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
    backgroundColor: Colors.neutral[50],
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  languageOptionSelected: {
    backgroundColor: Colors.primary[50],
  },
  languageOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageIcon: {
    fontSize: 24,
  },
  languageText: {
    fontFamily: 'SuperWonder',
    fontSize: 18,
    color: Colors.neutral[600],
  },
  languageTextSelected: {
    color: Colors.primary.main,
    fontFamily: 'SuperWonder',
  },
  checkMark: {
    fontSize: 18,
    color: Colors.primary.main,
    fontWeight: 'bold',
  },
});
