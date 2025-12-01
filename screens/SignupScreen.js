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

export default function SignupScreen({ route, navigation }) {
  const { userType } = route.params;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSignup = async () => {
    if (!email || !password || !phone) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          user_type: userType,
          phone,
        });

      if (profileError) throw profileError;

      Alert.alert(
        'Compte créé',
        'Votre compte a été créé avec succès !',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Erreur d\'inscription', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      console.log('Starting Google OAuth signup...');

      // Store userType in AsyncStorage for after redirect
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
          Alert.alert('Annulé', 'Vous avez annulé l\'inscription avec Google.');
        }
      }
    } catch (error) {
      console.error('Google signup error:', error);
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

        <Text style={styles.title}>Inscription</Text>

        {/* OAuth Buttons */}
        <TouchableOpacity
          style={[styles.oauthButton, styles.googleButton]}
          onPress={handleGoogleSignup}
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
            placeholder="Téléphone"
            placeholderTextColor="#999"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Mot de passe (min. 6 caractères)"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.signupButton, loading && styles.signupButtonDisabled]}
            onPress={handleEmailSignup}
            disabled={loading}
          >
            <Text style={styles.signupButtonText}>
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.loginLinkText}>
              Déjà un compte ? <Text style={styles.loginLinkBold}>Connectez-vous</Text>
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
  signupButton: {
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
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 16,
    color: '#666',
  },
  loginLinkBold: {
    fontWeight: '700',
    color: '#667eea',
  },
});
