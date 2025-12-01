import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

// This is needed for Expo Go OAuth to work properly
WebBrowser.maybeCompleteAuthSession();

// Get the redirect URL for OAuth
const getRedirectUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  // For Expo Go and mobile, use the custom scheme
  // This creates a URL like: silaapp://
  return 'silaapp://';
};

export default function LoginScreen({ route, navigation }) {
  const { userType } = route.params;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verify user type matches
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', data.user.id)
        .single();

      if (profile?.user_type !== userType) {
        await supabase.auth.signOut();
        Alert.alert('Erreur', 'Ce compte n\'est pas de type ' + userType);
        return;
      }
    } catch (error) {
      Alert.alert('Erreur de connexion', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      console.log('Starting Google OAuth...');

      // Store user type for after redirect using AsyncStorage
      await AsyncStorage.setItem('pendingUserType', userType);
      console.log('Stored user type:', userType);

      const redirectUrl = getRedirectUrl();
      console.log('Using redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // We'll handle the browser opening manually
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      console.log('OAuth response:', { data, error });

      if (error) {
        console.error('OAuth error:', error);
        throw error;
      }

      // Open the OAuth URL in a browser
      if (data?.url) {
        console.log('Opening OAuth URL:', data.url);
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        console.log('WebBrowser result:', result);

        if (result.type === 'success') {
          // The URL should contain the auth tokens
          console.log('OAuth succeeded, URL:', result.url);
        } else if (result.type === 'cancel') {
          Alert.alert('Annulé', 'Vous avez annulé la connexion avec Google.');
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert(
        'Erreur OAuth',
        `Une erreur s'est produite: ${error.message}\n\nVérifiez que Google OAuth est bien configuré dans Supabase.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.userTypeBadge}>
            {userType === 'transporter' ? '🚚 Transporteur' : '📦 Client'}
          </Text>
        </View>

        <Text style={styles.title}>Connexion</Text>

        {/* OAuth Buttons */}
        <TouchableOpacity
          style={[styles.oauthButton, styles.googleButton]}
          onPress={handleGoogleLogin}
        >
          <View style={styles.googleLogo}>
            <Text style={styles.googleLogoText}>G</Text>
          </View>
          <Text style={styles.oauthButtonText}>Continuer avec Google</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou avec email</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email/Password Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleEmailLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => navigation.navigate('Signup', { userType })}
          >
            <Text style={styles.signupLinkText}>
              Pas de compte ? <Text style={styles.signupLinkBold}>Inscrivez-vous</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  userTypeBadge: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#333',
    marginBottom: 30,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleLogoText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  facebookLogo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 12,
  },
  oauthButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  facebookText: {
    color: '#ffffff',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999',
    fontSize: 14,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  loginButton: {
    backgroundColor: '#667eea',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  signupLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  signupLinkText: {
    fontSize: 16,
    color: '#666',
  },
  signupLinkBold: {
    fontWeight: '700',
    color: '#667eea',
  },
});
