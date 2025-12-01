import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function MatchFoundScreen({ route, navigation }) {
  const { requestId, offerId } = route.params;
  const [offer, setOffer] = useState(null);
  const [transporter, setTransporter] = useState(null);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
    try {
      // Fetch offer details
      const { data: offerData, error: offerError } = await supabase
        .from('transport_offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (offerError) throw offerError;
      setOffer(offerData);

      // Fetch transporter profile
      const { data: transporterData, error: transporterError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', offerData.transporter_id)
        .single();

      if (transporterError) throw transporterError;
      setTransporter(transporterData);

      // Fetch request details
      const { data: requestData, error: requestError } = await supabase
        .from('transport_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;
      setRequest(requestData);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAndPay = () => {
    navigation.navigate('Payment', {
      requestId,
      offerId,
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDirectionLabel = (direction) => {
    return direction === 'tn_fr' ? '🇹🇳 → 🇫🇷' : '🇫🇷 → 🇹🇳';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('ClientDashboard')}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transporteur trouvé !</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Success Banner */}
        <View style={styles.successBanner}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Transporteur trouvé</Text>
          <Text style={styles.successSubtitle}>
            Nous avons trouvé un transporteur pour votre colis
          </Text>
        </View>

        {/* Offer Details */}
        {offer && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Détails du transport</Text>
            <View style={styles.directionRow}>
              <Text style={styles.direction}>{getDirectionLabel(offer.direction)}</Text>
            </View>

            <View style={styles.routeContainer}>
              <View style={styles.locationRow}>
                <Text style={styles.locationIcon}>📍</Text>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Ramassage</Text>
                  <Text style={styles.locationText}>{offer.pickup_location}</Text>
                </View>
              </View>

              <View style={styles.locationDivider} />

              <View style={styles.locationRow}>
                <Text style={styles.locationIcon}>📍</Text>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Dépôt</Text>
                  <Text style={styles.locationText}>{offer.dropoff_location}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>🗓️ Départ</Text>
                <Text style={styles.detailValue}>
                  {formatDate(offer.departure_date)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>🕐 Heure</Text>
                <Text style={styles.detailValue}>
                  {formatTime(offer.departure_date)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>📅 Arrivée</Text>
                <Text style={styles.detailValue}>
                  {formatDate(offer.arrival_date)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>🕐 Heure</Text>
                <Text style={styles.detailValue}>
                  {formatTime(offer.arrival_date)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Transporter Info */}
        {transporter && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informations du transporteur</Text>
            <View style={styles.transporterInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📧</Text>
                <Text style={styles.infoText}>{transporter.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📱</Text>
                <Text style={styles.infoText}>{transporter.phone}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Your Package Info */}
        {request && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Votre colis</Text>
            <View style={styles.packageInfo}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>⚖️ Poids</Text>
                <Text style={styles.detailValue}>{request.weight_kg} kg</Text>
              </View>
            </View>
          </View>
        )}

        {/* Price Section */}
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Prix total</Text>
            <Text style={styles.priceValue}>€45</Text>
          </View>
          <Text style={styles.priceNote}>
            Prix fixe pour ce trajet
          </Text>
        </View>

        <TouchableOpacity
          style={styles.payButton}
          onPress={handleConfirmAndPay}
        >
          <Text style={styles.payButtonText}>Confirmer et payer</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  successBanner: {
    backgroundColor: '#10b981',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  successIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 5,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  directionRow: {
    marginBottom: 15,
  },
  direction: {
    fontSize: 28,
    fontWeight: '700',
  },
  routeContainer: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 3,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  locationDivider: {
    height: 20,
    width: 2,
    backgroundColor: '#e0e0e0',
    marginLeft: 10,
    marginVertical: 5,
  },
  detailsContainer: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '700',
  },
  transporterInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  packageInfo: {
    gap: 10,
  },
  priceCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  priceValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#667eea',
  },
  priceNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  payButton: {
    backgroundColor: '#667eea',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
