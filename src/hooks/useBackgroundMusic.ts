import { useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { AppState, type AppStateStatus } from 'react-native';

const BACKGROUND_MUSIC = require('../assets/sounds/learny_land_main_sound1.mp3');

/**
 * Module-level singleton reference.
 * This lives OUTSIDE the component lifecycle, so it survives re-mounts.
 * Only ONE sound instance can ever exist — the core fix for overlapping audio.
 */
let globalSound: Audio.Sound | null = null;
let isLoading = false; // Guard against concurrent load attempts

/**
 * Hook to manage background music as a true singleton.
 *
 * Must be called ONCE in _layout.tsx (root). It:
 * 1. Loads the music once on app startup
 * 2. Exposes mute/unmute via setMuted()
 * 3. Pauses on app background, resumes on foreground
 * 4. Cleans up only when the root layout unmounts (app close)
 */
export function useBackgroundMusic() {
  const isMutedRef = useRef(false);

  // ── Load & Play (once ever) ──────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const loadMusic = async () => {
      // Prevent double-loading if already loaded or currently loading
      if (globalSound || isLoading) return;

      isLoading = true;
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          BACKGROUND_MUSIC,
          {
            isLooping: true,
            volume: 0.5,
            shouldPlay: true,
          }
        );

        if (isMounted) {
          globalSound = sound;
        } else {
          // Component unmounted before load finished — clean up immediately
          await sound.unloadAsync();
        }
      } catch (error) {
        console.warn('[useBackgroundMusic] Load failed:', error);
      } finally {
        isLoading = false;
      }
    };

    loadMusic();

    // Cleanup only on true app teardown (root layout unmount)
    return () => {
      isMounted = false;
      if (globalSound) {
        globalSound.unloadAsync();
        globalSound = null;
      }
    };
  }, []); // Empty deps = runs once

  // ── App state listener: pause/resume on background/foreground ────────
  useEffect(() => {
    const handleAppState = async (nextState: AppStateStatus) => {
      if (!globalSound) return;

      try {
        const status = await globalSound.getStatusAsync();
        if (!status.isLoaded) return;

        if (nextState === 'active' && !isMutedRef.current) {
          // Returning to foreground — resume if not muted
          await globalSound.playAsync();
        } else if (nextState.match(/inactive|background/)) {
          // Going to background — always pause to save resources
          await globalSound.pauseAsync();
        }
      } catch (error) {
        console.warn('[useBackgroundMusic] AppState handler error:', error);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, []);

  // ── Mute / Unmute ────────────────────────────────────────────────────
  const setMuted = useCallback(async (muted: boolean) => {
    isMutedRef.current = muted;

    if (!globalSound) return;

    try {
      const status = await globalSound.getStatusAsync();
      if (!status.isLoaded) return;

      // Set volume instead of stop/start to avoid reload overhead
      await globalSound.setVolumeAsync(muted ? 0 : 0.5);
    } catch (error) {
      console.warn('[useBackgroundMusic] setMuted error:', error);
    }
  }, []);

  return { setMuted };
}
