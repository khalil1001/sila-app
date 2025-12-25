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
import {
  BRAND_COLORS,
  SPACING,
  RADIUS,
  SHADOWS,
  TYPOGRAPHY,
  isLargeScreen,
} from '../constants/theme';

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
    backgroundColor: BRAND_COLORS.BACKGROUND_LIGHT,
  },
  header: {
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    paddingTop: SPACING.XXL + SPACING.MD + SPACING.XS,
    paddingBottom: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  backButton: {
    marginBottom: SPACING.SM,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    color: BRAND_COLORS.PRIMARY_RED,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.TITLE_SMALL,
    fontWeight: TYPOGRAPHY.EXTRABOLD,
    color: BRAND_COLORS.TEXT_DARK,
  },
  content: {
    flex: 1,
    padding: SPACING.LG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  mockBanner: {
    backgroundColor: '#fef3c7',
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    marginBottom: SPACING.LG,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  mockBannerIcon: {
    fontSize: 40,
    marginBottom: SPACING.SM,
  },
  mockBannerTitle: {
    fontSize: TYPOGRAPHY.HEADING_LARGE + 2,
    fontWeight: TYPOGRAPHY.EXTRABOLD,
    color: '#92400e',
    marginBottom: SPACING.XS,
  },
  mockBannerText: {
    fontSize: TYPOGRAPHY.BODY_SMALL,
    color: '#92400e',
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  card: {
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    marginBottom: SPACING.MD,
    ...SHADOWS.SMALL,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_DARK,
    marginBottom: SPACING.MD,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.BODY_MEDIUM,
    color: BRAND_COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.BODY_MEDIUM,
    color: BRAND_COLORS.TEXT_DARK,
    fontWeight: TYPOGRAPHY.BOLD,
    textAlign: 'right',
    flex: 1,
    marginLeft: SPACING.LG,
  },
  divider: {
    height: 1,
    backgroundColor: BRAND_COLORS.BORDER_LIGHT,
    marginVertical: SPACING.SM,
  },
  locationContainer: {
    marginBottom: SPACING.SM,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  locationIcon: {
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    marginRight: SPACING.SM,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: TYPOGRAPHY.CAPTION,
    color: BRAND_COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    marginBottom: SPACING.XXS,
  },
  locationText: {
    fontSize: TYPOGRAPHY.BODY_MEDIUM,
    color: BRAND_COLORS.TEXT_DARK,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  priceCard: {
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    marginBottom: SPACING.MD,
    ...SHADOWS.SMALL,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.SM,
  },
  priceItemLabel: {
    fontSize: TYPOGRAPHY.BODY_MEDIUM,
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  priceItemValue: {
    fontSize: TYPOGRAPHY.BODY_MEDIUM,
    color: BRAND_COLORS.TEXT_DARK,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.HEADING_LARGE + 2,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_DARK,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.TITLE_SMALL,
    fontWeight: TYPOGRAPHY.EXTRABOLD,
    color: BRAND_COLORS.PRIMARY_RED,
  },
  infoCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    marginBottom: SPACING.LG,
    borderWidth: 1,
    borderColor: BRAND_COLORS.PRIMARY_RED,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_DARK,
    marginBottom: SPACING.SM,
  },
  infoText: {
    fontSize: TYPOGRAPHY.BODY_SMALL,
    color: BRAND_COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  payButton: {
    backgroundColor: BRAND_COLORS.SUCCESS,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG - 2,
    alignItems: 'center',
    marginBottom: SPACING.MD,
    ...SHADOWS.LARGE,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: BRAND_COLORS.TEXT_WHITE,
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  securityBadge: {
    alignItems: 'center',
    marginBottom: SPACING.XXL + SPACING.XS,
  },
  securityText: {
    fontSize: TYPOGRAPHY.BODY_SMALL,
    color: BRAND_COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
});
