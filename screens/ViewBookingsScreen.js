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

export default function ViewBookingsScreen({ route, navigation }) {
  const { offerId } = route.params;
  const [offer, setOffer] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOfferAndBookings();
  }, []);

  const fetchOfferAndBookings = async () => {
    try {
      // Fetch offer details
      const { data: offerData, error: offerError } = await supabase
        .from('transport_offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (offerError) throw offerError;
      setOffer(offerData);

      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('transport_requests')
        .select('*')
        .eq('matched_offer_id', offerId);

      if (bookingsError) throw bookingsError;

      // Fetch client profiles
      const bookingsWithProfiles = await Promise.all(
        bookingsData.map(async (booking) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, phone')
            .eq('id', booking.client_id)
            .single();

          return { ...booking, clientProfile: profile };
        })
      );

      setBookings(bookingsWithProfiles);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = (booking) => {
    Alert.alert(
      'Contacter le client',
      `Email: ${booking.clientProfile?.email}\nTéléphone: ${booking.clientProfile?.phone}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'OK' },
      ]
    );
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

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'En attente', color: '#f59e0b' },
      matched: { text: 'Confirmé', color: '#10b981' },
      paid: { text: 'Payé', color: '#667eea' },
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
        </View>
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
        <Text style={styles.headerTitle}>Réservations</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Offer Details Card */}
        {offer && (
          <View style={styles.offerCard}>
            <Text style={styles.offerTitle}>Détails de l'offre</Text>
            <View style={styles.offerHeader}>
              <Text style={styles.offerDirection}>
                {getDirectionLabel(offer.direction)}
              </Text>
            </View>

            <View style={styles.offerRoute}>
              <View style={styles.locationRow}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>{offer.pickup_location}</Text>
              </View>
              <View style={styles.locationRow}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>{offer.dropoff_location}</Text>
              </View>
            </View>

            <View style={styles.offerDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Départ:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(offer.departure_date)} • {formatTime(offer.departure_date)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Arrivée:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(offer.arrival_date)} • {formatTime(offer.arrival_date)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Capacité:</Text>
                <Text style={styles.detailValue}>
                  {offer.available_capacity_kg} / {offer.total_capacity_kg} kg
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Bookings Section */}
        <Text style={styles.sectionTitle}>
          Réservations ({bookings.length})
        </Text>

        {bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📦</Text>
            <Text style={styles.emptyStateText}>Aucune réservation</Text>
            <Text style={styles.emptyStateSubtext}>
              Les clients verront votre offre et pourront réserver
            </Text>
          </View>
        ) : (
          bookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingId}>
                  Réservation #{booking.id.slice(0, 8)}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBadge(booking.status).color },
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {getStatusBadge(booking.status).text}
                  </Text>
                </View>
              </View>

              <View style={styles.bookingDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Client:</Text>
                  <Text style={styles.detailValue}>
                    {booking.clientProfile?.email?.split('@')[0]}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Téléphone:</Text>
                  <Text style={styles.detailValue}>
                    {booking.clientProfile?.phone}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Poids:</Text>
                  <Text style={styles.detailValue}>{booking.weight_kg} kg</Text>
                </View>
              </View>

              <View style={styles.bookingRoute}>
                <View style={styles.locationRow}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <Text style={styles.locationText}>{booking.pickup_location}</Text>
                </View>
                <View style={styles.locationRow}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <Text style={styles.locationText}>{booking.dropoff_location}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => handleContact(booking)}
              >
                <Text style={styles.contactButtonText}>Contacter</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
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
    color: BRAND_COLORS.PRIMARY_BLUE,
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
  offerCard: {
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    marginBottom: SPACING.XL + SPACING.XS,
    ...SHADOWS.SMALL,
  },
  offerTitle: {
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.PRIMARY_BLUE,
    marginBottom: SPACING.MD,
  },
  offerHeader: {
    marginBottom: SPACING.MD,
  },
  offerDirection: {
    fontSize: TYPOGRAPHY.TITLE_XSMALL,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  offerRoute: {
    marginBottom: SPACING.MD,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  locationIcon: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    marginRight: SPACING.XS,
  },
  locationText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    color: BRAND_COLORS.TEXT_DARK,
    flex: 1,
  },
  offerDetails: {
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.BORDER_LIGHT,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.XS,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.BODY_SMALL,
    color: BRAND_COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.BODY_SMALL,
    color: BRAND_COLORS.TEXT_DARK,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.HEADING_LARGE + 2,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_DARK,
    marginBottom: SPACING.MD,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: SPACING.XXL + SPACING.XS,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: SPACING.MD,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.HEADING_LARGE + 2,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_DARK,
    marginBottom: SPACING.XS,
  },
  emptyStateSubtext: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    color: BRAND_COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    marginBottom: SPACING.MD,
    ...SHADOWS.SMALL,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  bookingId: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_DARK,
  },
  statusBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS - 2,
    borderRadius: RADIUS.SM,
  },
  statusBadgeText: {
    color: BRAND_COLORS.TEXT_WHITE,
    fontSize: TYPOGRAPHY.CAPTION,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  bookingDetails: {
    marginBottom: SPACING.MD,
    paddingBottom: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  bookingRoute: {
    marginBottom: SPACING.MD,
  },
  contactButton: {
    backgroundColor: BRAND_COLORS.PRIMARY_BLUE,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD - 2,
    alignItems: 'center',
  },
  contactButtonText: {
    color: BRAND_COLORS.TEXT_WHITE,
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
  },
});
