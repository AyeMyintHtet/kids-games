import '../global.css';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { SplashScreen } from '../src/components/SplashScreen';

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

/**
 * Root Layout Component.
 * Provides global providers and navigation structure.
 */
export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    /**
     * Simulates app initialization (loading fonts, assets, etc.)
     * In a real app, you'd load actual resources here.
     */
    const initializeApp = async () => {
      // TODO: Add actual initialization logic (fonts, assets, etc.)
      await new Promise((resolve) => setTimeout(resolve, 5000));
      setIsLoading(false);
    };

    initializeApp();
  }, []);

  // Show splash screen while loading
  if (isLoading) {
    return <SplashScreen />;
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
