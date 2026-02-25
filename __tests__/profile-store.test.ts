/* eslint-disable import/first, @typescript-eslint/no-require-imports */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { useAppStore } from '@/store/useAppStore';

describe('profile store onboarding', () => {
  beforeEach(() => {
    useAppStore.setState({
      profile: {
        nickname: '',
        gender: null,
        avatarEmoji: '🧒',
        onboardingCompletedAt: null,
      },
    });
  });

  test('saves valid nickname and gender', () => {
    useAppStore.getState().saveProfile({ nickname: 'Kid Hero', gender: 'female' });

    const profile = useAppStore.getState().profile;
    expect(profile.nickname).toBe('Kid Hero');
    expect(profile.gender).toBe('female');
    expect(profile.avatarEmoji).toBe('🧚‍♀️');
  });

  test('rejects invalid nickname', () => {
    useAppStore.getState().saveProfile({ nickname: ' ', gender: 'male' });

    const profile = useAppStore.getState().profile;
    expect(profile.nickname).toBe('');
    expect(profile.gender).toBeNull();
  });
});
