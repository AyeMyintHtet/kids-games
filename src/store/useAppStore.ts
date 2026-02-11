import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

// -----------------------------------------------------------------------------
// State Interfaces
// -----------------------------------------------------------------------------

interface UserSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface GameProgress {
  totalScore: number;
  gamesPlayed: number;
  lastPlayedAt: string | null;
}

interface AppState {
  // User settings
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;

  // Game progress
  progress: GameProgress;
  incrementScore: (points: number) => void;
  recordGamePlayed: () => void;
  resetProgress: () => void;
}

// -----------------------------------------------------------------------------
// Store Implementation
// -----------------------------------------------------------------------------

const initialSettings: UserSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  difficulty: 'easy',
};

const initialProgress: GameProgress = {
  totalScore: 0,
  gamesPlayed: 0,
  lastPlayedAt: null,
};

/**
 * Main app store using Zustand with AsyncStorage persistence.
 * Switched to AsyncStorage to ensure compatibility with Expo Go.
 * 
 * Usage:
 * const { settings, updateSettings } = useAppStore();
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Settings
      settings: initialSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      // Progress
      progress: initialProgress,
      incrementScore: (points) =>
        set((state) => ({
          progress: {
            ...state.progress,
            totalScore: state.progress.totalScore + points,
          },
        })),
      recordGamePlayed: () =>
        set((state) => ({
          progress: {
            ...state.progress,
            gamesPlayed: state.progress.gamesPlayed + 1,
            lastPlayedAt: new Date().toISOString(),
          },
        })),
      resetProgress: () =>
        set(() => ({
          progress: initialProgress,
        })),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
