export type GamePhase = 'intro' | 'playing';
export type RoundResult = 'none' | 'won' | 'lost';
export type Level = 'easy' | 'medium' | 'hard';

export type LevelConfig = {
  label: string;
  pairs: number;
  columns: number;
  lives: number;
  durationSeconds: number;
  pairPoints: number;
  streakBonus: number;
  completionBonus: number;
};

export type Animal = {
  id: string;
  name: string;
  emoji: string;
  cardColor: string;
  imageSource?: number | string;
};

export type AnimalCard = Animal & {
  uid: string;
  isFlipped: boolean;
  isMatched: boolean;
  shakeTick: number;
};

const COW_IMAGE = require('@/assets/images/animal-flashcard/image.png');
const DOG_IMAGE = require('@/assets/images/animal-flashcard/image copy.png');
const PIG_IMAGE = require('@/assets/images/animal-flashcard/image copy 2.png');
const SHEEP_IMAGE = require('@/assets/images/animal-flashcard/image copy 3.png');
const CAT_IMAGE = require('@/assets/images/animal-flashcard/image copy 4.png');
const HORSE_IMAGE = require('@/assets/images/animal-flashcard/image copy 5.png');
const DUCK_IMAGE = require('@/assets/images/animal-flashcard/image copy 6.png');
const DONKEY_IMAGE = require('@/assets/images/animal-flashcard/image copy 7.png');
const CHICKEN_IMAGE = require('@/assets/images/animal-flashcard/image copy 8.png');
const RABBIT_IMAGE = require('@/assets/images/animal-flashcard/image copy 9.png');
const LLAMA_IMAGE = require('@/assets/images/animal-flashcard/image copy 10.png');
const YAK_IMAGE = require('@/assets/images/animal-flashcard/image copy 11.png');
const CAMEL_IMAGE = require('@/assets/images/animal-flashcard/image copy 12.png');
const OX_IMAGE = require('@/assets/images/animal-flashcard/image copy 13.png');
const TURKEY_IMAGE = require('@/assets/images/animal-flashcard/image copy 14.png');

export const LEVEL_CONFIGS: Record<Level, LevelConfig> = {
  easy: {
    label: 'Easy',
    pairs: 4,
    columns: 3,
    lives: 6,
    durationSeconds: 90,
    pairPoints: 15,
    streakBonus: 3,
    completionBonus: 40,
  },
  medium: {
    label: 'Medium',
    pairs: 6,
    columns: 4,
    lives: 7,
    durationSeconds: 75,
    pairPoints: 20,
    streakBonus: 5,
    completionBonus: 60,
  },
  hard: {
    label: 'Hard',
    pairs: 8,
    columns: 4,
    lives: 8,
    durationSeconds: 60,
    pairPoints: 25,
    streakBonus: 8,
    completionBonus: 90,
  },
};

const LEVEL_ANIMAL_IDS: Record<Level, string[]> = {
  easy: ['pig', 'dog', 'horse', 'yak'],
  medium: ['pig', 'dog', 'horse', 'yak', 'cat', 'sheep'],
  hard: ['pig', 'dog', 'horse', 'yak', 'cat', 'sheep', 'cow', 'rabbit'],
};

export const ANIMALS: Animal[] = [
  { id: 'pig', name: 'Pig', emoji: '🐷', cardColor: '#FFD1DC', imageSource: PIG_IMAGE },
  { id: 'dog', name: 'Dog', emoji: '🐶', cardColor: '#DBEAFE', imageSource: DOG_IMAGE },
  { id: 'horse', name: 'Horse', emoji: '🐴', cardColor: '#FDE4CF', imageSource: HORSE_IMAGE },
  { id: 'yak', name: 'Yak', emoji: '🐂', cardColor: '#FAE0C8', imageSource: YAK_IMAGE },
  { id: 'cat', name: 'Cat', emoji: '🐱', cardColor: '#FFF1B7', imageSource: CAT_IMAGE },
  { id: 'sheep', name: 'Sheep', emoji: '🐑', cardColor: '#E7F9EF', imageSource: SHEEP_IMAGE },
  { id: 'cow', name: 'Cow', emoji: '🐮', cardColor: '#E9E7FF', imageSource: COW_IMAGE },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰', cardColor: '#FFE2EE', imageSource: RABBIT_IMAGE },
  { id: 'duck', name: 'Duck', emoji: '🦆', cardColor: '#E6F7FF', imageSource: DUCK_IMAGE },
  { id: 'donkey', name: 'Donkey', emoji: '🫏', cardColor: '#DFE9F7', imageSource: DONKEY_IMAGE },
  { id: 'chicken', name: 'Chicken', emoji: '🐔', cardColor: '#FBE7C7', imageSource: CHICKEN_IMAGE },
  { id: 'llama', name: 'Llama', emoji: '🦙', cardColor: '#FEE2C6', imageSource: LLAMA_IMAGE },
  { id: 'camel', name: 'Camel', emoji: '🐫', cardColor: '#F6DDB7', imageSource: CAMEL_IMAGE },
  { id: 'ox', name: 'Ox', emoji: '🐂', cardColor: '#E5D0D0', imageSource: OX_IMAGE },
  { id: 'turkey', name: 'Turkey', emoji: '🦃', cardColor: '#F5D5D5', imageSource: TURKEY_IMAGE },
];

const shuffle = <T,>(items: T[]): T[] => {
  const cloned = [...items];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
};

export const buildDeck = (level: Level, pairCount: number): AnimalCard[] => {
  const configuredIds = LEVEL_ANIMAL_IDS[level];
  const selectedFromConfig = configuredIds
    .map((id) => ANIMALS.find((animal) => animal.id === id))
    .filter(Boolean) as Animal[];

  let selectedAnimals = selectedFromConfig.slice(0, pairCount);
  if (selectedAnimals.length < pairCount) {
    const existingIds = new Set(selectedAnimals.map((animal) => animal.id));
    const extras = shuffle(ANIMALS.filter((animal) => !existingIds.has(animal.id)))
      .slice(0, pairCount - selectedAnimals.length);
    selectedAnimals = [...selectedAnimals, ...extras];
  }

  const duplicated = selectedAnimals.flatMap((animal) => [
    {
      ...animal,
      uid: `${animal.id}-A`,
      isFlipped: false,
      isMatched: false,
      shakeTick: 0,
    },
    {
      ...animal,
      uid: `${animal.id}-B`,
      isFlipped: false,
      isMatched: false,
      shakeTick: 0,
    },
  ]);

  return shuffle(duplicated);
};

