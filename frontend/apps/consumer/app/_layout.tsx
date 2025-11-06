import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/stores/auth.store';
import { supabase } from '../src/lib/supabase';

export default function RootLayout() {
  const { isAuthenticated, setSession, initialize, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Initialize auth state
    initialize();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && inTabsGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to dashboard if already authenticated
      router.replace('/(tabs)/dashboard');
    } else if (isAuthenticated && segments.length === 0) {
      // Initial navigation for authenticated users
      router.replace('/(tabs)/dashboard');
    } else if (!isAuthenticated && segments.length === 0) {
      // Initial navigation for unauthenticated users
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, segments, isLoading]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </>
  );
}
