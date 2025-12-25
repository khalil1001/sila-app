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
  successBanner: {
    backgroundColor: BRAND_COLORS.SUCCESS,
    borderRadius: RADIUS.LG,
    padding: SPACING.XL + SPACING.XS,
    alignItems: 'center',
    marginBottom: SPACING.LG,
    ...SHADOWS.LARGE,
  },
  successIcon: {
    fontSize: 50,
    marginBottom: SPACING.SM,
  },
  successTitle: {
    fontSize: TYPOGRAPHY.TITLE_XSMALL,
    fontWeight: TYPOGRAPHY.EXTRABOLD,
    color: BRAND_COLORS.TEXT_WHITE,
    marginBottom: SPACING.XS,
  },
  successSubtitle: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    color: BRAND_COLORS.TEXT_WHITE,
    opacity: 0.9,
    textAlign: 'center',
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
  directionRow: {
    marginBottom: SPACING.MD,
  },
  direction: {
    fontSize: TYPOGRAPHY.TITLE_SMALL,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  routeContainer: {
    marginBottom: SPACING.MD,
    paddingBottom: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    fontSize: TYPOGRAPHY.HEADING_LARGE + 2,
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
    fontSize: TYPOGRAPHY.BODY_LARGE,
    color: BRAND_COLORS.TEXT_DARK,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  locationDivider: {
    height: 20,
    width: 2,
    backgroundColor: BRAND_COLORS.BORDER_LIGHT,
    marginLeft: SPACING.SM,
    marginVertical: SPACING.XS,
  },
  detailsContainer: {
    gap: SPACING.SM,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.BODY_MEDIUM,
    color: BRAND_COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.BODY_MEDIUM,
    color: BRAND_COLORS.TEXT_DARK,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  transporterInfo: {
    gap: SPACING.SM,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    marginRight: SPACING.SM,
  },
  infoText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    color: BRAND_COLORS.TEXT_DARK,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  packageInfo: {
    gap: SPACING.SM,
  },
  priceCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    marginBottom: SPACING.LG,
    borderWidth: 2,
    borderColor: BRAND_COLORS.PRIMARY_RED,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_DARK,
  },
  priceValue: {
    fontSize: TYPOGRAPHY.TITLE_LARGE - 4,
    fontWeight: TYPOGRAPHY.EXTRABOLD,
    color: BRAND_COLORS.PRIMARY_RED,
  },
  priceNote: {
    fontSize: TYPOGRAPHY.BODY_SMALL,
    color: BRAND_COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
  },
  payButton: {
    backgroundColor: BRAND_COLORS.PRIMARY_RED,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG - 2,
    alignItems: 'center',
    marginBottom: SPACING.XXL + SPACING.XS,
    ...SHADOWS.LARGE,
  },
  payButtonText: {
    color: BRAND_COLORS.TEXT_WHITE,
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
  },
});
