import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BRAND_COLORS,
  RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
  isLargeScreen
} from '../constants/theme.js';
import { supabase } from '../lib/supabase';

export default function TransporterDashboard({ navigation }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('transport_offers')
        .select('*')
        .eq('transporter_id', user.id)
        .order('departure_date', { ascending: false });

      if (error) throw error;

      // Fetch booking counts for each offer
      const offersWithCounts = await Promise.all(
        data.map(async (offer) => {
          const { count } = await supabase
            .from('transport_requests')
            .select('*', { count: 'exact', head: true })
            .eq('matched_offer_id', offer.id);

          return { ...offer, bookingCount: count || 0 };
        })
      );

      setOffers(offersWithCounts);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOffers();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[BRAND_COLORS.PRIMARY_BLUE, '#1e40af']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mes Offres</Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateOffer')}
        >
          <Text style={styles.createButtonIcon}>+</Text>
          <Text style={styles.createButtonText}>Créer une nouvelle offre</Text>
        </TouchableOpacity>

        {loading ? (
          <Text style={styles.loadingText}>Chargement...</Text>
        ) : offers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📦</Text>
            <Text style={styles.emptyStateText}>Aucune offre créée</Text>
            <Text style={styles.emptyStateSubtext}>
              Créez votre première offre de transport
            </Text>
          </View>
        ) : (
          offers.map((offer) => (
            <View key={offer.id} style={styles.offerCard}>
              <View style={styles.offerHeader}>
                <Text style={styles.offerDirection}>
                  {getDirectionLabel(offer.direction)}
                </Text>
                <View style={styles.bookingBadge}>
                  <Text style={styles.bookingBadgeText}>
                    {offer.bookingCount} réservation{offer.bookingCount !== 1 ? 's' : ''}
                  </Text>
                </View>
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

              <TouchableOpacity
                style={styles.viewBookingsButton}
                onPress={() => navigation.navigate('ViewBookings', { offerId: offer.id })}
              >
                <Text style={styles.viewBookingsButtonText}>
                  Voir les réservations
                </Text>
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
    paddingTop: isLargeScreen ? SPACING.XXL : 50,
    paddingBottom: SPACING.LG,
    paddingHorizontal: SPACING.SCREEN_PADDING,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: isLargeScreen ? 1200 : '100%',
    width: '100%',
    alignSelf: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.TITLE_MEDIUM,
    fontWeight: TYPOGRAPHY.EXTRABOLD,
    color: BRAND_COLORS.TEXT_WHITE,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderRadius: RADIUS.MD,
  },
  logoutButtonText: {
    color: BRAND_COLORS.TEXT_WHITE,
    fontSize: TYPOGRAPHY.BODY_MEDIUM,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  content: {
    flex: 1,
    padding: SPACING.SCREEN_PADDING,
    maxWidth: isLargeScreen ? 1200 : '100%',
    width: '100%',
    alignSelf: 'center',
  },
  createButton: {
    backgroundColor: BRAND_COLORS.PRIMARY_BLUE,
    borderRadius: RADIUS.LG,
    padding: isLargeScreen ? SPACING.LG : SPACING.MD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.LG,
    ...SHADOWS.MEDIUM,
  },
  createButtonIcon: {
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    color: BRAND_COLORS.TEXT_WHITE,
    marginRight: SPACING.SM,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  createButtonText: {
    fontSize: TYPOGRAPHY.HEADING_MEDIUM,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_WHITE,
  },
  loadingText: {
    textAlign: 'center',
    color: BRAND_COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.BODY_LARGE,
    marginTop: SPACING.XXXL,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: isLargeScreen ? 80 : 60,
  },
  emptyStateIcon: {
    fontSize: isLargeScreen ? 80 : 60,
    marginBottom: SPACING.MD,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_DARK,
    marginBottom: SPACING.XS,
  },
  emptyStateSubtext: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  offerCard: {
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    marginBottom: SPACING.MD,
    ...SHADOWS.SMALL,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  offerDirection: {
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  bookingBadge: {
    backgroundColor: BRAND_COLORS.SUCCESS,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: RADIUS.MD,
  },
  bookingBadgeText: {
    color: BRAND_COLORS.TEXT_WHITE,
    fontSize: TYPOGRAPHY.BODY_SMALL,
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
    marginBottom: SPACING.MD,
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
    fontSize: TYPOGRAPHY.BODY_MEDIUM,
    color: BRAND_COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.BODY_MEDIUM,
    color: BRAND_COLORS.TEXT_DARK,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  viewBookingsButton: {
    backgroundColor: BRAND_COLORS.PRIMARY_BLUE,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    alignItems: 'center',
  },
  viewBookingsButtonText: {
    color: BRAND_COLORS.TEXT_WHITE,
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
  },
});
