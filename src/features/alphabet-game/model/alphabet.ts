import { Colors } from '@/constants/colors';

export const BACKGROUNDS = [
  require('@/assets/images/alphabet/background.png'),
  require('@/assets/images/alphabet/background2.png'),
  require('@/assets/images/alphabet/background3.png'),
];

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const CHILD_COLORS = [
  Colors.candy.pink,
  Colors.candy.bubblegum,
  Colors.candy.mint,
  Colors.candy.lavender,
  Colors.candy.peach,
  Colors.candy.lemon,
  Colors.candy.skyBlue,
  Colors.candy.lilac,
  Colors.candy.coral,
  Colors.candy.seafoam,
  Colors.accent.main,
  Colors.fun.teal,
];

const LETTER_COLORS = [
  Colors.candy.pink,
  Colors.candy.mint,
  Colors.candy.lemon,
  Colors.candy.skyBlue,
  Colors.candy.lavender,
  Colors.candy.peach,
  Colors.primary.main,
  Colors.accent.main,
  Colors.fun.purple,
];

export const shuffleLetters = (letters: string[]) => {
  const shuffled = [...letters];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getLetterColor = (index: number) =>
  LETTER_COLORS[index % LETTER_COLORS.length];

