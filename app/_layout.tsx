import '../global.css';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, LogBox } from 'react-native';
import { SplashScreen } from '../src/components/SplashScreen';
import { useBackgroundMusic } from '../src/hooks/useBackgroundMusic';
import { CloudTransition } from '../src/components/CloudTransition';
import { CloudTransitionProvider, useCloudTransition } from '../src/hooks/useCloudTransition';

LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
  'expo-av has been deprecated',
]);

/**
 * Context to expose music mute control to any child screen.
 */
type MusicContextType = {
  isMuted: boolean;
  toggleMute: () => void;
};

const MusicContext = createContext<MusicContextType>({
  isMuted: false,
  toggleMute: () => { },
});

/** Consumer hook — use this in any screen to toggle music */
export const useMusic = () => useContext(MusicContext);

/**
 * TanStack Query client for data fetching and caching.
 * Configured with sensible defaults for a children's app.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

import { useFonts } from 'expo-font';
import * as SplashScreenModule from 'expo-splash-screen';

// Prevent auto-hiding the splash screen
SplashScreenModule.preventAutoHideAsync();

/**
 * Root Layout Component.
 * Provides global providers and navigation structure.
 * Background music lives HERE so it never re-mounts on navigation.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'SuperWonder': require('../src/assets/font/Super Wonder.ttf'),
  });

  const [isAppReady, setIsAppReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Singleton music — plays once, survives all navigation
  const { setMuted } = useBackgroundMusic();

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    setMuted(newMuted);
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Add minimum delay for splash animation
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (e) {
        console.warn('Initialization failed:', e);
      } finally {
        setIsAppReady(true);
      }
    };

    initializeApp();
  }, []);

  // Hide native splash screen once fonts are loaded so our custom one can show
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreenModule.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded || !isAppReady) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <SplashScreen />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <MusicContext.Provider value={{ isMuted, toggleMute }}>
        <QueryClientProvider client={queryClient}>
          <CloudTransitionProvider>
            <StackWithCloudOverlay />
          </CloudTransitionProvider>
        </QueryClientProvider>
      </MusicContext.Provider>
    </GestureHandlerRootView>
  );
}

/**
 * Inner component that reads the cloud transition context
 * and renders the Stack + CloudTransition overlay.
 */
function StackWithCloudOverlay() {
  const { isActive, handleCovered, handleFinished } = useCloudTransition();

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none', // Disable native animation — cloud transition replaces it
        }}
      />
      <CloudTransition
        isActive={isActive}
        onCovered={handleCovered}
        onFinished={handleFinished}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
