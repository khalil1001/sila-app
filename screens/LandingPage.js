import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { QRCodeSVG } from 'qrcode.react';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LandingPage() {
  const [appUrl, setAppUrl] = useState('https://votre-app.vercel.app');

  useEffect(() => {
    // Get the current URL on web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      setAppUrl(window.location.href);
    }
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero Section */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroContent}>
          <Text style={styles.logo}>Sila</Text>
          <Text style={styles.heroTitle}>Transport Tunisie-France</Text>
          <Text style={styles.heroSubtitle}>
            L'application qui connecte transporteurs et clients
          </Text>
        </View>
      </LinearGradient>

      {/* Mobile-Only Message */}
      <View style={styles.section}>
        <View style={styles.mobileOnlyCard}>
          <Text style={styles.mobileIcon}>📱</Text>
          <Text style={styles.mobileTitle}>
            Cette application nécessite un smartphone
          </Text>
          <Text style={styles.mobileMessage}>
            Scannez le QR code ci-dessous ou visitez cette adresse sur votre téléphone :
          </Text>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <QRCodeSVG
              value={appUrl}
              size={200}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#667eea"
            />
          </View>

          {/* URL */}
          <View style={styles.urlContainer}>
            <Text style={styles.urlLabel}>Ou visitez :</Text>
            <Text style={styles.urlText}>{appUrl}</Text>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fonctionnalités</Text>
        <View style={styles.featuresGrid}>
          {/* Feature 1 */}
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🚛</Text>
            <Text style={styles.featureTitle}>Transporteurs</Text>
            <Text style={styles.featureDescription}>
              Proposez vos trajets entre la Tunisie et la France et maximisez vos revenus
            </Text>
          </View>

          {/* Feature 2 */}
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📦</Text>
            <Text style={styles.featureTitle}>Clients</Text>
            <Text style={styles.featureDescription}>
              Trouvez un transporteur fiable pour vos colis en toute sécurité
            </Text>
          </View>

          {/* Feature 3 */}
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🗺️</Text>
            <Text style={styles.featureTitle}>Suivi en temps réel</Text>
            <Text style={styles.featureDescription}>
              Suivez vos trajets et colis avec des cartes interactives
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 Sila</Text>
        <View style={styles.footerLinks}>
          <Text style={styles.footerLink}>Contact</Text>
          <Text style={styles.footerDivider}>•</Text>
          <Text style={styles.footerLink}>Confidentialité</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flexGrow: 1,
  },
  hero: {
    paddingVertical: 80,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  heroContent: {
    maxWidth: 800,
    alignItems: 'center',
  },
  logo: {
    fontSize: 72,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 20,
    letterSpacing: -2,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 20,
    color: '#e0e0ff',
    textAlign: 'center',
    lineHeight: 28,
  },
  section: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  mobileOnlyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 48,
    maxWidth: 600,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  mobileIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  mobileTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  mobileMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 32,
  },
  urlContainer: {
    alignItems: 'center',
  },
  urlLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  urlText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#667eea',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#333',
    marginBottom: 48,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 32,
    maxWidth: 1200,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    width: SCREEN_WIDTH > 900 ? 320 : SCREEN_WIDTH > 600 ? 280 : '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  featureIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  footer: {
    paddingVertical: 40,
    paddingHorizontal: 40,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  footerDivider: {
    fontSize: 14,
    color: '#ccc',
    marginHorizontal: 12,
  },
});
