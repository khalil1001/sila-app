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

export default function PaymentScreen({ route, navigation }) {
  const { requestId, offerId } = route.params;
  const [offer, setOffer] = useState(null);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

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

  const handleMockPayment = async () => {
    setProcessing(true);
    try {
      // Update request status to paid
      const { error } = await supabase
        .from('transport_requests')
        .update({ status: 'paid' })
        .eq('id', requestId);

      if (error) throw error;

      // Show success message
      Alert.alert(
        'Paiement réussi ! 🎉',
        'Votre réservation a été confirmée. Le transporteur vous contactera bientôt.',
        [
          {
            text: 'Retour au tableau de bord',
            onPress: () => navigation.navigate('ClientDashboard'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setProcessing(false);
    }
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
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Mock Payment Banner */}
        <View style={styles.mockBanner}>
          <Text style={styles.mockBannerIcon}>⚠️</Text>
          <Text style={styles.mockBannerTitle}>PAIEMENT FICTIF</Text>
          <Text style={styles.mockBannerText}>
            Intégration Stripe à venir
          </Text>
        </View>

        {/* Transport Summary */}
        {offer && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Résumé du transport</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Direction</Text>
              <Text style={styles.summaryValue}>
                {getDirectionLabel(offer.direction)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.locationContainer}>
              <View style={styles.locationRow}>
                <Text style={styles.locationIcon}>📍</Text>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>De</Text>
                  <Text style={styles.locationText}>{offer.pickup_location}</Text>
                </View>
              </View>
              <View style={styles.locationRow}>
                <Text style={styles.locationIcon}>📍</Text>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>À</Text>
                  <Text style={styles.locationText}>{offer.dropoff_location}</Text>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Départ</Text>
              <Text style={styles.summaryValue}>
                {formatDate(offer.departure_date)} {formatTime(offer.departure_date)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Arrivée</Text>
              <Text style={styles.summaryValue}>
                {formatDate(offer.arrival_date)} {formatTime(offer.arrival_date)}
              </Text>
            </View>
          </View>
        )}

        {/* Package Details */}
        {request && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Détails du colis</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Poids</Text>
              <Text style={styles.summaryValue}>{request.weight_kg} kg</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ramassage</Text>
              <Text style={styles.summaryValue}>{request.pickup_location}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Dépôt</Text>
              <Text style={styles.summaryValue}>{request.dropoff_location}</Text>
            </View>
          </View>
        )}

        {/* Price Breakdown */}
        <View style={styles.priceCard}>
          <Text style={styles.cardTitle}>Détails du prix</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceItemLabel}>Transport</Text>
            <Text style={styles.priceItemValue}>€40,00</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceItemLabel}>Frais de service</Text>
            <Text style={styles.priceItemValue}>€5,00</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>€45,00</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💳 Mode de paiement</Text>
          <Text style={styles.infoText}>
            Actuellement en mode démonstration. L'intégration Stripe sera disponible prochainement pour des paiements sécurisés.
          </Text>
        </View>

        {/* Mock Payment Button */}
        <TouchableOpacity
          style={[styles.payButton, processing && styles.payButtonDisabled]}
          onPress={handleMockPayment}
          disabled={processing}
        >
          <Text style={styles.payButtonText}>
            {processing ? 'Traitement...' : 'Marquer comme payé (Mock)'}
          </Text>
        </TouchableOpacity>

        <View style={styles.securityBadge}>
          <Text style={styles.securityText}>🔒 Paiement sécurisé</Text>
        </View>
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
  mockBanner: {
    backgroundColor: '#fef3c7',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  mockBannerIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  mockBannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 5,
  },
  mockBannerText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '600',
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  locationContainer: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationIcon: {
    fontSize: 18,
    marginRight: 10,
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
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  priceCard: {
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
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceItemLabel: {
    fontSize: 15,
    color: '#666',
  },
  priceItemValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#667eea',
  },
  infoCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  payButton: {
    backgroundColor: '#10b981',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  securityBadge: {
    alignItems: 'center',
    marginBottom: 40,
  },
  securityText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
});
