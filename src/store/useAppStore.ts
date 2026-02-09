import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * MMKV Storage instance.
 * Using MMKV for high-speed encrypted storage (COPPA/GDPR compliant).
 * 
 * SECURITY NOTE: Never store PII in unencrypted storage.
 * Use encryption for any user-identifiable data.
 */
const storage = new MMKV({
  id: 'kids-games-storage',
  // Enable encryption for production
  // encryptionKey: 'your-secure-key-from-env',
});

/**
 * Zustand storage adapter for MMKV.
 * Enables persistence of state across app restarts.
 */
const mmkvStorage = createJSONStorage<AppState>(() => ({
  setItem: (name, value) => storage.set(name, value),
  getItem: (name) => storage.getString(name) ?? null,
  removeItem: (name) => storage.delete(name),
}));

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
 * Main app store using Zustand with MMKV persistence.
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
      storage: mmkvStorage,
    }
  )
);
