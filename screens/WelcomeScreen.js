import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen({ navigation }) {
  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>🚚 Sila</Text>
        <Text style={styles.subtitle}>Transport entre la Tunisie et la France</Text>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login', { userType: 'transporter' })}
          >
            <Text style={styles.buttonIcon}>🚚</Text>
            <Text style={styles.buttonText}>Transporteur</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login', { userType: 'client' })}
          >
            <Text style={styles.buttonIcon}>📦</Text>
            <Text style={styles.buttonText}>Client</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    fontSize: 60,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 60,
    opacity: 0.9,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 320,
  },
  button: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#667eea',
  },
});
