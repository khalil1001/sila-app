import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isLargeScreen = SCREEN_WIDTH > 768;
const isSmallScreen = SCREEN_WIDTH < 375; // Very small phones

// New Color Palette Suggestions
const BRAND_COLORS = {
    // Primary brand blue (from your Transporter button)
    PRIMARY_BLUE: '#1e3a8a',
    // Client red (from your Client button)
    PRIMARY_RED: '#dc2626',
    // New gradient colors for the background (Lighter, dynamic blue/cyan)
    GRADIENT_START: '#2d4f8eff', // Very light blue
    GRADIENT_END: '#fcd2d8ff',   // Extremely light cyan/white
    // Feature item background (to maintain contrast against the new gradient)
    FEATURE_BG: '#ffffff',
    FEATURE_ICON_BG: '#d9f0ff', // Light blue accent for icons
    // Dark text (from your original styles)
    TEXT_DARK: '#1a1a2e',
};


export default function WelcomeScreen({ navigation }) {
  // Animation for buttons - alternating shake effect
  const shakeAnim1 = useRef(new Animated.Value(0)).current; // For transporter button
  const shakeAnim2 = useRef(new Animated.Value(0)).current; // For client button

  useEffect(() => {
    // First button shake animation (starts immediately)
    const shakeAnimation1 = Animated.loop(
      Animated.sequence([
        // Wait for 3 seconds before first shake
        Animated.delay(3000),
        // Shake sequence
        Animated.timing(shakeAnim1, {
          toValue: -3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim1, {
          toValue: 3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim1, {
          toValue: -3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim1, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        // Wait 3 more seconds (during this time, button 2 will shake)
        Animated.delay(3000),
      ])
    );

    // Second button shake animation (starts after 1.5 seconds delay to alternate)
    const shakeAnimation2 = Animated.loop(
      Animated.sequence([
        // Wait 4.5 seconds (3s initial + 0.4s first shake + 1.1s offset)
        Animated.delay(4500),
        // Shake sequence
        Animated.timing(shakeAnim2, {
          toValue: -3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim2, {
          toValue: 3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim2, {
          toValue: -3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim2, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        // Wait to sync back with first animation
        Animated.delay(1500),
      ])
    );

    shakeAnimation1.start();
    shakeAnimation2.start();

    return () => {
      shakeAnimation1.stop();
      shakeAnimation2.stop();
    };
  }, [shakeAnim1, shakeAnim2]);

  return (
    <View style={styles.container}>
      {/* Left Half - Logo and Features (Updated Gradient) */}
      <LinearGradient
        // REPLACED OLD COLORS: ['#e8eef5', '#f5f5f5']
        colors={[BRAND_COLORS.GRADIENT_START, BRAND_COLORS.GRADIENT_END]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.leftHalf}
      >
        <View style={styles.leftContent}>
          {/* Logo with white background */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/sila-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* App Name */}
          <Text style={styles.appName}>SILA TRANSPORTATION</Text>

          {/* Main Title */}
          <Text style={styles.heroTitle}>
            🇹🇳 Tunisie ⇄ Europe 🇪🇺
          </Text>

          {/* Subtitle */}
          <Text style={styles.heroSubtitle}>
            Transport de colis rapide et sécurisé
          </Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>⚡</Text>
              </View>
              <Text style={styles.featureText}>Rapide et sécurisé</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>💳</Text>
              </View>
              <Text style={styles.featureText}>Paiement garanti</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>📍</Text>
              </View>
              <Text style={styles.featureText}>Suivi en temps réel</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Right Half - Choice Buttons */}
      <ScrollView
        style={styles.rightHalf}
        contentContainerStyle={styles.rightScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.rightContent}>
          {/* Question */}
          <Text style={styles.questionText}>Que voulez-vous faire ?</Text>
          <Text style={styles.questionSubtext}>Choisissez une option pour continuer</Text>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Transporter Button */}
            <Animated.View style={{ transform: [{ translateX: shakeAnim1 }] }}>
              <TouchableOpacity
                style={[styles.choiceButton, styles.transporterButton]}
                onPress={() => navigation.navigate('Login', { userType: 'transporter' })}
                activeOpacity={0.8}
              >
                <View style={styles.buttonIconCircle}>
                  <Text style={styles.buttonIconLarge}>🚚</Text>
                </View>
                <Text style={styles.choiceTitle}>Je suis TRANSPORTEUR</Text>
                <Text style={styles.choiceDescription}>
                  J'ai un véhicule et je veux transporter des colis
                </Text>
                <View style={styles.arrowContainer}>
                  <Text style={styles.arrow}>→</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Separator */}
            <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OU</Text>
              <View style={styles.orLine} />
            </View>

            {/* Client Button */}
            <Animated.View style={{ transform: [{ translateX: shakeAnim2 }] }}>
              <TouchableOpacity
                style={[styles.choiceButton, styles.clientButton]}
                onPress={() => navigation.navigate('Login', { userType: 'client' })}
                activeOpacity={0.8}
              >
                <View style={styles.buttonIconCircle}>
                  <Text style={styles.buttonIconLarge}>📦</Text>
                </View>
                <Text style={styles.choiceTitle}>Je suis CLIENT</Text>
                <Text style={styles.choiceDescription}>
                  Je veux envoyer un colis de la Tunisie vers l'Europe
                </Text>
                <View style={styles.arrowContainer}>
                  <Text style={styles.arrow}>→</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Help text */}
          <Text style={styles.helpText}>
            💡 Cliquez sur le bouton qui vous correspond
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: isLargeScreen ? 'row' : 'column',
    backgroundColor: '#ffffff',
  },

  // Left Half - Logo & Features
  leftHalf: {
    flex: isLargeScreen ? 1 : undefined,
    minHeight: isLargeScreen ? '100%' : SCREEN_HEIGHT * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    padding: isLargeScreen ? 40 : (isSmallScreen ? 16 : 24),
  },
  leftContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    backgroundColor: BRAND_COLORS.FEATURE_BG, // Kept white for contrast
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  logo: {
    width: isLargeScreen ? 100 : 80,
    height: isLargeScreen ? 100 : 80,
  },
  appName: {
    fontSize: isLargeScreen ? 40 : 32,
    fontWeight: '300',
    color: BRAND_COLORS.TEXT_DARK,
    letterSpacing: 1,
    marginBottom: 20,
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: isLargeScreen ? 28 : 22,
    fontWeight: '600',
    color: BRAND_COLORS.PRIMARY_BLUE,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: isLargeScreen ? 16 : 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '400',
  },
  featuresContainer: {
    alignItems: 'flex-start',
    width: '100%',
    maxWidth: isSmallScreen ? SCREEN_WIDTH - 40 : 300,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: BRAND_COLORS.FEATURE_BG, // Kept white for contrast
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconContainer: {
    // REPLACED OLD COLOR: '#f0f4f8' (old pale gray)
    backgroundColor: BRAND_COLORS.FEATURE_ICON_BG, // New light blue accent
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    fontSize: isLargeScreen ? 16 : 14,
    color: BRAND_COLORS.TEXT_DARK,
    fontWeight: '600',
    flex: 1,
  },

  // Right Half - Choice Buttons
  rightHalf: {
    flex: isLargeScreen ? 1 : undefined,
    minHeight: isLargeScreen ? '100%' : SCREEN_HEIGHT * 0.65,
    backgroundColor: '#ffffff',
  },
  rightScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: isLargeScreen ? 40 : (isSmallScreen ? 16 : 20),
  },
  rightContent: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  questionText: {
    fontSize: isLargeScreen ? 30 : 22,
    fontWeight: '800',
    color: BRAND_COLORS.TEXT_DARK,
    textAlign: 'center',
    marginBottom: 6,
  },
  questionSubtext: {
    fontSize: isLargeScreen ? 16 : 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonsContainer: {
    width: '100%',
  },
  choiceButton: {
    borderRadius: 20,
    paddingVertical: isLargeScreen ? 30 : (isSmallScreen ? 20 : 24),
    paddingHorizontal: isLargeScreen ? 30 : (isSmallScreen ? 16 : 24),
    alignItems: 'center',
    minHeight: 48, // Ensure touch target
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  transporterButton: {
    backgroundColor: BRAND_COLORS.PRIMARY_BLUE,
  },
  clientButton: {
    backgroundColor: BRAND_COLORS.PRIMARY_RED,
  },
  buttonIconCircle: {
    width: isLargeScreen ? 70 : (isSmallScreen ? 50 : 60),
    height: isLargeScreen ? 70 : (isSmallScreen ? 50 : 60),
    borderRadius: isLargeScreen ? 35 : (isSmallScreen ? 25 : 30),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonIconLarge: {
    fontSize: isLargeScreen ? 40 : 32,
  },
  choiceTitle: {
    fontSize: isLargeScreen ? 22 : 18,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  choiceDescription: {
    fontSize: isLargeScreen ? 14 : 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: isLargeScreen ? 20 : 18,
  },
  arrowContainer: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
  },

  // OR separator
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#dee2e6',
  },
  orText: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND_COLORS.TEXT_DARK,
    marginHorizontal: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#dee2e6',
  },

  // Help text
  helpText: {
    marginTop: 20,
    fontSize: isLargeScreen ? 15 : 13,
    color: '#6c757d',
    textAlign: 'center',
    fontWeight: '600',
  },
});
