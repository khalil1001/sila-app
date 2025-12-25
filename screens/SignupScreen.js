import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BRAND_COLORS,
  RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
  isLargeScreen
} from '../constants/theme.js';
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
      // Create auth user with metadata (triggers database profile creation)
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType,
            phone: phone,
          }
        }
      });

      if (authError) throw authError;

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
      // Store userType in AsyncStorage as fallback for after redirect
      await AsyncStorage.setItem('pendingUserType', userType);

      const redirectUrl = getRedirectUrl();

      // On web, let Supabase handle the redirect naturally
      if (Platform.OS === 'web') {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
            // Pass user_type in metadata (for database trigger)
            data: {
              user_type: userType,
            },
          },
        });

        if (error) {
          throw error;
        }
        // Supabase will automatically redirect to Google and back
        // The session will be picked up by App.js
      } else {
        // On native mobile, use WebBrowser popup
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true, // We'll handle the browser opening manually
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
            // Pass user_type in metadata (for database trigger)
            data: {
              user_type: userType,
            },
          },
        });

        if (error) {
          throw error;
        }

        // Open the OAuth URL in a browser
        if (data?.url) {
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl
          );

          if (result.type === 'success') {
            // The URL should contain the auth tokens
          } else if (result.type === 'cancel') {
            Alert.alert('Annulé', 'Vous avez annulé l\'inscription avec Google.');
          }
        }
      }
    } catch (error) {
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

          <TouchableOpacity
            style={styles.termsLink}
            onPress={() => navigation.navigate('Terms')}
          >
            <Text style={styles.termsLinkText}>
              Conditions Générales & Politique de Remboursement
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
    backgroundColor: BRAND_COLORS.BACKGROUND_LIGHT,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.SCREEN_PADDING,
    justifyContent: 'center',
    maxWidth: isLargeScreen ? 500 : '100%',
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginTop: isLargeScreen ? SPACING.XL : SPACING.XXL,
    marginBottom: SPACING.LG,
  },
  backButton: {
    marginBottom: SPACING.MD,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    color: BRAND_COLORS.PRIMARY_BLUE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  userTypeBadge: {
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_DARK,
  },
  title: {
    fontSize: TYPOGRAPHY.TITLE_LARGE,
    fontWeight: TYPOGRAPHY.EXTRABOLD,
    color: BRAND_COLORS.TEXT_DARK,
    marginBottom: SPACING.XXL,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.LG,
    padding: isLargeScreen ? 18 : 16,
    marginBottom: SPACING.SM,
    ...SHADOWS.SMALL,
  },
  googleButton: {
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
  },
  googleLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.SM,
  },
  googleLogoText: {
    color: BRAND_COLORS.TEXT_WHITE,
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  oauthButtonText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: BRAND_COLORS.TEXT_DARK,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.XL,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BRAND_COLORS.BORDER_MEDIUM,
  },
  dividerText: {
    marginHorizontal: SPACING.MD,
    color: BRAND_COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.BODY_MEDIUM,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.MD,
    padding: isLargeScreen ? 16 : 14,
    marginBottom: SPACING.SM,
    fontSize: TYPOGRAPHY.BODY_LARGE,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    color: BRAND_COLORS.TEXT_DARK,
  },
  signupButton: {
    backgroundColor: BRAND_COLORS.PRIMARY_BLUE,
    borderRadius: RADIUS.LG,
    padding: isLargeScreen ? 18 : 16,
    alignItems: 'center',
    marginTop: SPACING.MD,
    ...SHADOWS.MEDIUM,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: BRAND_COLORS.TEXT_WHITE,
    fontSize: TYPOGRAPHY.HEADING_MEDIUM,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  loginLink: {
    marginTop: SPACING.LG,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  loginLinkBold: {
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.PRIMARY_BLUE,
  },
  termsLink: {
    marginTop: SPACING.XL,
    alignItems: 'center',
  },
  termsLinkText: {
    fontSize: TYPOGRAPHY.BODY_SMALL,
    color: BRAND_COLORS.TEXT_SECONDARY,
    textDecorationLine: 'underline',
  },
});
