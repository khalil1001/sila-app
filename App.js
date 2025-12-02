import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { supabase } from './lib/supabase';
import { isMobileDevice } from './utils/deviceDetection';

// Import screens
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import TransporterDashboard from './screens/TransporterDashboard';
import ClientDashboard from './screens/ClientDashboard';
import CreateOfferScreen from './screens/CreateOfferScreen';
import MapSelectionScreen from './screens/MapSelectionScreen';
import ViewBookingsScreen from './screens/ViewBookingsScreen';
import NewRequestScreen from './screens/NewRequestScreen';
import MatchFoundScreen from './screens/MatchFoundScreen';
import PaymentScreen from './screens/PaymentScreen';
import LandingPage from './screens/LandingPage';
import InstallPWABanner from './components/InstallPWABanner';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(null);

  useEffect(() => {
    // Detect device type on web
    if (Platform.OS === 'web') {
      setIsMobile(isMobileDevice());
    } else {
      // On native platforms (iOS/Android), always show mobile UI
      setIsMobile(true);
    }

    // Get initial session
    // On web, wait a bit for Supabase to process OAuth callback in URL
    const initSession = async () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const hasCode = window.location.search.includes('code=') || window.location.hash.includes('access_token=');
        if (hasCode) {
          console.log('OAuth callback detected in URL, waiting for Supabase to process...');
          // Give Supabase time to process the OAuth callback
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      console.log('Initial session:', session?.user?.email || 'No session');
      setSession(session);
      if (session) {
        // Fetch user type from profiles
        await fetchUserType(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      setSession(session);
      if (session) {
        await fetchUserType(session.user.id);
      } else {
        setUserType(null);
        setLoading(false);
      }
    });

    // Handle deep links for OAuth callback (native mobile only)
    let subscription2;
    if (Platform.OS !== 'web') {
      const handleDeepLink = async (event) => {
        const url = event.url;
        console.log('Deep link received (mobile):', url);

        if (url) {
          // Mobile uses custom scheme (silaapp://)
          // Extract the code parameter
          const params = new URLSearchParams(url.split('?')[1] || '');
          const code = params.get('code');

          if (code) {
            console.log('Exchanging PKCE code for session...');
            try {
              const { error } = await supabase.auth.exchangeCodeForSession(code);
              if (error) {
                console.error('Error exchanging code:', error);
              } else {
                console.log('Session created successfully from deep link');
              }
            } catch (err) {
              console.error('Error in code exchange:', err);
            }
          }
        }
      };

      // Listen for deep link events on mobile
      subscription2 = Linking.addEventListener('url', handleDeepLink);

      // Check if app was opened with a deep link
      Linking.getInitialURL().then((url) => {
        if (url) {
          handleDeepLink({ url });
        }
      });
    }

    return () => {
      subscription.unsubscribe();
      if (subscription2) {
        subscription2.remove();
      }
    };
  }, []);

  const fetchUserType = async (userId) => {
    try {
      console.log('Fetching user type for:', userId);

      // Add timeout to prevent infinite loading
      const timeoutMs = 10000;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout fetching profile after ' + timeoutMs + 'ms')), timeoutMs)
      );

      const fetchPromise = supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();

      let data, error;
      try {
        const result = await Promise.race([fetchPromise, timeoutPromise]);
        data = result.data;
        error = result.error;
      } catch (timeoutError) {
        console.error('Profile fetch timeout:', timeoutError.message);
        error = { code: 'TIMEOUT', message: timeoutError.message };
        data = null;
      }

      console.log('Profile fetch result:', { data, error: error ? { code: error.code, message: error.message } : null });

      if (error && (error.code === 'PGRST116' || error.code === 'TIMEOUT')) {
        // Profile doesn't exist or timeout
        console.log('Profile not found (or timeout), checking for pending user type...');
        const pendingType = await AsyncStorage.getItem('pendingUserType');
        console.log('Pending user type from AsyncStorage:', pendingType);

        if (pendingType) {
          // TEMPORARY FIX: Just use pendingType without trying to create profile
          // Since Supabase queries are timing out, use the cached value
          console.log('⚠️ Using pendingUserType directly due to Supabase timeout');
          setUserType(pendingType);
          await AsyncStorage.removeItem('pendingUserType');

          // Try to create profile in background (non-blocking)
          console.log('📝 Attempting to create/update profile in background...');
          supabase.auth.getUser().then(({ data: userData }) => {
            if (userData?.user) {
              console.log('Got user data:', userData.user.email);
              // Try to insert, but don't wait for it
              supabase
                .from('profiles')
                .upsert({
                  id: userId,
                  email: userData.user.email,
                  user_type: pendingType,
                  phone: '',
                }, { onConflict: 'id' })
                .then(({ error: upsertError }) => {
                  if (upsertError) {
                    console.error('❌ Background profile upsert failed:', upsertError);
                  } else {
                    console.log('✅ Background profile upsert succeeded');
                  }
                });
            }
          });
        } else {
          // No pending type and no profile - log out the user
          console.warn('⚠️ No profile and no pending user type - logging out');
          await supabase.auth.signOut();
        }
      } else if (error) {
        console.error('❌ Error fetching profile:', error);
        // Try fallback
        const pendingType = await AsyncStorage.getItem('pendingUserType');
        if (pendingType) {
          console.warn('⚠️ Using pending user type as fallback:', pendingType);
          setUserType(pendingType);
          await AsyncStorage.removeItem('pendingUserType');
        }
      } else {
        console.log('✅ User type found:', data?.user_type);
        setUserType(data?.user_type);
      }
    } catch (error) {
      console.error('❌ Unexpected error in fetchUserType:', error);
    } finally {
      console.log('🏁 Finished fetchUserType, setting loading to false');
      setLoading(false);
    }
  };

  if (loading || isMobile === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // Desktop: Show landing page
  if (Platform.OS === 'web' && !isMobile) {
    return <LandingPage />;
  }

  // Mobile: Show app with PWA banner
  return (
    <>
      {Platform.OS === 'web' && <InstallPWABanner />}
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!session ? (
            // Unauthenticated screens
            <>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
            </>
          ) : (
            // Authenticated screens
            <>
              {userType === 'transporter' ? (
                <>
                  <Stack.Screen name="TransporterDashboard" component={TransporterDashboard} />
                  <Stack.Screen name="CreateOffer" component={CreateOfferScreen} />
                  <Stack.Screen name="ViewBookings" component={ViewBookingsScreen} />
                  <Stack.Screen name="MapSelection" component={MapSelectionScreen} />
                </>
              ) : (
                <>
                  <Stack.Screen name="ClientDashboard" component={ClientDashboard} />
                  <Stack.Screen name="NewRequest" component={NewRequestScreen} />
                  <Stack.Screen name="MapSelection" component={MapSelectionScreen} />
                  <Stack.Screen name="MatchFound" component={MatchFoundScreen} />
                  <Stack.Screen name="Payment" component={PaymentScreen} />
                </>
              )}
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
});
