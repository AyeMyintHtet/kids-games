import {
  getProfileAvatar,
  sanitizeNickname,
  validateNickname,
} from '@/features/profile/model/profile';

describe('profile model', () => {
  test('sanitizes nickname input safely', () => {
    expect(sanitizeNickname('  Kid@@ Hero  ')).toBe('Kid Hero');
    expect(sanitizeNickname('A   B   C')).toBe('A B C');
  });

  test('validates nickname rules', () => {
    expect(validateNickname(' ').valid).toBe(false);
    expect(validateNickname('a').valid).toBe(false);
    expect(validateNickname('kid_name').valid).toBe(true);
  });

  test('returns profile avatar by gender', () => {
    expect(getProfileAvatar('male')).toBe('🧑‍🚀');
    expect(getProfileAvatar('female')).toBe('🧚‍♀️');
  });
});
