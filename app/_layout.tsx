import '../global.css';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, LogBox } from 'react-native';
import { SplashScreen } from '../src/components/SplashScreen';
import { Audio } from 'expo-av';

LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
  'expo-av has been deprecated',
]);

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
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'SuperWonder': require('../src/assets/font/Super Wonder.ttf'),
  });

  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Configure audio
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

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
      <QueryClientProvider client={queryClient}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
