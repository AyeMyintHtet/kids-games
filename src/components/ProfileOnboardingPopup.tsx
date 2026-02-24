import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { PopBox } from '@/components/PopBox';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import {
  NICKNAME_MAX_LENGTH,
  validateNickname,
  type ProfileGender,
} from '@/features/profile/model/profile';
import { scale, verticalScale } from '@/utils/responsive';

type ProfileOnboardingPopupProps = {
  visible: boolean;
  initialNickname: string;
  initialGender: ProfileGender | null;
  onSave: (payload: { nickname: string; gender: ProfileGender }) => void;
};

const GENDER_OPTIONS: {
  value: ProfileGender;
  label: string;
  emoji: string;
  gradient: [string, string];
}[] = [
    {
      value: 'male',
      label: 'Male',
      emoji: '🧑‍🚀',
      gradient: ['#8BD3FF', '#5AA9FF'],
    },
    {
      value: 'female',
      label: 'Female',
      emoji: '🧚‍♀️',
      gradient: ['#FFAFDC', '#FF7CB8'],
    },
  ];

export const ProfileOnboardingPopup: React.FC<ProfileOnboardingPopupProps> = ({
  visible,
  initialNickname,
  initialGender,
  onSave,
}) => {
  const [nickname, setNickname] = useState(initialNickname);
  const [gender, setGender] = useState<ProfileGender | null>(initialGender);

  useEffect(() => {
    if (!visible) return;
    setNickname(initialNickname);
    setGender(initialGender);
  }, [initialGender, initialNickname, visible]);

  const validation = useMemo(() => validateNickname(nickname), [nickname]);
  const canSave = validation.valid && Boolean(gender);

  const handleSave = () => {
    if (!canSave || !gender) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({ nickname: validation.normalized, gender });
  };

  return (
    <PopBox
      visible={visible}
      onClose={() => { }}
      title="Welcome Little Star"
      variant="green"
      showCloseButton={false}
      dismissible={false}
    >
      <View style={styles.root}>
        <Text style={styles.subtitle}>
          Pick your nickname and character to start your learning adventure.
        </Text>

        <View style={styles.inputWrap}>
          <LinearGradient
            colors={['#FFF4C9', '#FFE5A8']}
            style={styles.inputGlow}
          >
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="Enter nickname"
              placeholderTextColor="#9B8F6A"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={NICKNAME_MAX_LENGTH}
              style={styles.input}
              returnKeyType="done"
              accessibilityLabel="Nickname input"
            />
          </LinearGradient>
        </View>

        {validation.error ? (
          <Text style={styles.errorText}>{validation.error}</Text>
        ) : (
          <Text style={styles.hintText}>This nickname will appear on the leaderboard.</Text>
        )}

        <View style={styles.genderRow}>
          {GENDER_OPTIONS.map((option) => {
            const selected = gender === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.genderCard, selected && styles.genderCardSelected]}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setGender(option.value);
                }}
              >
                <LinearGradient
                  colors={option.gradient}
                  style={styles.genderGradient}
                >
                  <Text style={styles.genderEmoji}>{option.emoji}</Text>
                  <Text style={styles.genderLabel}>{option.label}</Text>
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          disabled={!canSave}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save & Continue</Text>
        </Pressable>
      </View>
    </PopBox>
  );
};

const styles = StyleSheet.create({
  root: {
    gap: verticalScale(10),
  },
  subtitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(12),
    color: Colors.neutral[700],
    textAlign: 'center',
  },
  inputWrap: {
    borderRadius: scale(20),
    overflow: 'hidden',
  },
  inputGlow: {
    borderRadius: scale(20),
    borderWidth: 2,
    borderColor: '#FFD462',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(3),
  },
  input: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(16),
    color: Colors.neutral[800],
    minHeight: verticalScale(40),
    textAlign: 'center',
  },
  hintText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(10),
    color: Colors.neutral[600],
    textAlign: 'center',
  },
  errorText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(10),
    color: Colors.danger.dark,
    textAlign: 'center',
  },
  genderRow: {
    flexDirection: 'row',
    gap: scale(10),
  },
  genderCard: {
    flex: 1,
    borderRadius: scale(16),
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  genderCardSelected: {
    borderColor: Colors.accent.dark,
  },
  genderGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(2),
    paddingVertical: verticalScale(10),
  },
  genderEmoji: {
    fontSize: scale(30),
  },
  genderLabel: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(12),
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  saveButton: {
    borderRadius: scale(28),
    backgroundColor: Colors.primary.main,
    borderBottomWidth: 4,
    borderBottomColor: Colors.primary.dark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(10),
    marginTop: verticalScale(4),
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    fontFamily: Typography.fontFamily.display,
    fontSize: scale(14),
    color: Colors.white,
  },
});
