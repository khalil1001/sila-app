import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { supabase } from './lib/supabase';
import { isMobileDevice } from './utils/deviceDetection';

// Import screens
import InstallPWABanner from './components/InstallPWABanner';
import ClientDashboard from './screens/ClientDashboard';
import CreateOfferScreen from './screens/CreateOfferScreen';
import LoginScreen from './screens/LoginScreen';
import MapSelectionScreen from './screens/MapSelectionScreen';
import MatchFoundScreen from './screens/MatchFoundScreen';
import NewRequestScreen from './screens/NewRequestScreen';
import PaymentScreen from './screens/PaymentScreen';
import SignupScreen from './screens/SignupScreen';
import TermsScreen from './screens/TermsScreen';
import TransporterDashboard from './screens/TransporterDashboard';
import ViewBookingsScreen from './screens/ViewBookingsScreen';
import WelcomeScreen from './screens/WelcomeScreen';

const Stack = createNativeStackNavigator();

/**
 * COMPOSANT 1 : Navigation pour l'utilisateur connecté
 * Gère la logique "Transporteur vs Client" à l'intérieur, sans bloquer l'app globale.
 */
function AuthorizedNavigator({ session }) {
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    const resolveUserType = async () => {
      // 1. PRIORITÉ ABSOLUE : Métadonnées de session (Instantané)
      // C'est l'info qu'on a passée lors du Login/Signup. Fiable à 100%.
      const metaType = session?.user?.user_metadata?.user_type;
      
      if (metaType) {
        setUserType(metaType);
        return;
      }

      // 2. FALLBACK : Base de données (Si pas de métadonnées)
      // Uniquement pour les vieux comptes.
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', session.user.id)
          .single();
        
        if (data?.user_type) {
          setUserType(data.user_type);
        } else {
          // Si rien trouvé (ex: bug trigger), par défaut Transporteur pour ne pas bloquer
          setUserType('transporter');
        }
      } catch (err) {
        setUserType('transporter'); // Sécurité
      }
    };

    resolveUserType();
  }, [session]);

  // Petit chargement interne juste le temps de lire le type (ms)
  if (!userType) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#667eea" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
    </Stack.Navigator>
  );
}

/**
 * COMPOSANT PRINCIPAL : Point d'entrée
 * Ne s'occupe QUE de la Session. Ne bloque JAMAIS sur le profil.
 */
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(null);

  useEffect(() => {
    // Detection Mobile/Web
    if (Platform.OS === 'web') {
      setIsMobile(isMobileDevice());
    } else {
      setIsMobile(true);
    }

    // 1. Initialisation Session (Rapide)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false); // On arrête de charger dès qu'on a la réponse Auth
    }).catch(() => {
      setLoading(false); // On ouvre quand même l'app en mode "Pas connecté"
    });

    // 2. Écouteur de changements (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // 3. Gestion Deep Links (Mobile natif uniquement)
    let linkSubscription;
    if (Platform.OS !== 'web') {
      const handleDeepLink = (event) => {
        const url = event.url;
        if (url && url.includes('code=')) {
          // Supabase gère l'échange de code automatiquement via l'écouteur onAuthStateChange
        }
      };
      linkSubscription = Linking.addEventListener('url', handleDeepLink);
    }

    return () => {
      subscription.unsubscribe();
      if (linkSubscription) linkSubscription.remove();
    };
  }, []);

  if (loading || isMobile === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <>
      {Platform.OS === 'web' && isMobile && <InstallPWABanner />}
      <NavigationContainer>
        {/* ROUTING SIMPLE : Si session -> AuthorizedNavigator. Sinon -> Ecrans Auth. */}
        {!session ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="Terms" component={TermsScreen} />
          </Stack.Navigator>
        ) : (
          <AuthorizedNavigator session={session} />
        )}
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
});