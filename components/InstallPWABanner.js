import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isPWAInstalled } from '../utils/deviceDetection';

const BANNER_DISMISSED_KEY = 'pwa_banner_dismissed';

export default function InstallPWABanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Only run on web
    if (Platform.OS !== 'web') return;

    const checkBannerStatus = async () => {
      try {
        // Check if PWA is already installed
        if (isPWAInstalled()) {
          return;
        }

        // Check if user previously dismissed the banner
        const dismissed = await AsyncStorage.getItem(BANNER_DISMISSED_KEY);
        if (dismissed === 'true') {
          return;
        }

        // Wait for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
          // Prevent the default browser prompt
          e.preventDefault();
          // Store the event for later use
          setDeferredPrompt(e);
          // Show our custom banner
          setShowBanner(true);
          // Animate in
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
      } catch (_error) {
        // Silent error handling for PWA banner check
      }
    };

    checkBannerStatus();
  }, [fadeAnim]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user's response
      await deferredPrompt.userChoice;

      // Clear the deferred prompt
      setDeferredPrompt(null);
      handleDismiss();
    } catch (_error) {
      // Silent error handling for PWA installation
    }
  };

  const handleDismiss = async () => {
    try {
      // Animate out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShowBanner(false);
      });

      // Save dismissal preference
      await AsyncStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    } catch (_error) {
      // Silent error handling for banner dismissal
    }
  };

  if (!showBanner) return null;

  return (
    <Animated.View style={[styles.banner, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.icon}>📥</Text>
          <View style={styles.messageContainer}>
            <Text style={styles.title}>Installer l&apos;application</Text>
            <Text style={styles.message}>
              Restez connecté et recevez des notifications
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.installButton}
            onPress={handleInstall}
            activeOpacity={0.8}
          >
            <Text style={styles.installButtonText}>Installer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            activeOpacity={0.6}
          >
            <Text style={styles.dismissButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  messageContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: '#e0e0ff',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  installButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  installButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  dismissButton: {
    padding: 4,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '300',
  },
});
