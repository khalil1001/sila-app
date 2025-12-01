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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // Fetch user type from profiles
        fetchUserType(session.user.id);
      } else {
        setLoading(false);
      }
    });

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

    // Handle deep links for OAuth callback
    const handleDeepLink = async (event) => {
      const url = event.url;
      console.log('Deep link received:', url);

      if (url) {
        // Extract URL params (Supabase will include tokens in the URL)
        const params = new URLSearchParams(url.split('?')[1] || '');
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log('Setting session from deep link...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session:', error);
          } else {
            console.log('Session set successfully:', data.user?.email);
          }
        }
      }
    };

    // Listen for deep link events
    const subscription2 = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.unsubscribe();
      subscription2.remove();
    };
  }, []);

  const fetchUserType = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist - this might be an OAuth user
        // Check if there's a pending user type from OAuth signup
        const pendingType = await AsyncStorage.getItem('pendingUserType');

        if (pendingType) {
          // Create profile for OAuth user
          const { data: userData } = await supabase.auth.getUser();
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: userData.user.email,
              user_type: pendingType,
              phone: '', // OAuth users can update this later
            });

          if (!insertError) {
            setUserType(pendingType);
            await AsyncStorage.removeItem('pendingUserType');
          }
        }
      } else if (!error) {
        setUserType(data?.user_type);
      }
    } catch (error) {
      console.error('Error fetching user type:', error);
    } finally {
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
