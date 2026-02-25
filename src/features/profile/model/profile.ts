export type ProfileGender = 'male' | 'female';

export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 16;

const ALLOWED_CHAR_REGEX = /[^A-Za-z0-9 _-]/g;
const MULTI_SPACE_REGEX = /\s+/g;

export const sanitizeNickname = (value: string): string => {
  return value
    .replace(ALLOWED_CHAR_REGEX, '')
    .replace(MULTI_SPACE_REGEX, ' ')
    .trim();
};

export const validateNickname = (
  value: string
): { valid: boolean; normalized: string; error: string | null } => {
  const normalized = sanitizeNickname(value);

  if (!normalized) {
    return {
      valid: false,
      normalized,
      error: 'Nickname is required.',
    };
  }

  if (normalized.length < NICKNAME_MIN_LENGTH) {
    return {
      valid: false,
      normalized,
      error: `Use at least ${NICKNAME_MIN_LENGTH} characters.`,
    };
  }

  if (normalized.length > NICKNAME_MAX_LENGTH) {
    return {
      valid: false,
      normalized: normalized.slice(0, NICKNAME_MAX_LENGTH),
      error: `Use ${NICKNAME_MAX_LENGTH} characters or less.`,
    };
  }

  return {
    valid: true,
    normalized,
    error: null,
  };
};

export const getProfileAvatar = (gender: ProfileGender): string =>
  gender === 'male' ? '🧑‍🚀' : '🧚‍♀️';
