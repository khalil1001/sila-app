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

export default function ClientDashboard({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('transport_requests')
        .select(`
          *,
          transport_offers (
            pickup_location,
            dropoff_location,
            departure_date,
            arrival_date,
            transporter_id
          )
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch transporter details for matched requests
      const requestsWithTransporters = await Promise.all(
        data.map(async (request) => {
          if (request.matched_offer_id && request.transport_offers) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email, phone')
              .eq('id', request.transport_offers.transporter_id)
              .single();

            return {
              ...request,
              transporterInfo: profile,
            };
          }
          return request;
        })
      );

      setRequests(requestsWithTransporters);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
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

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'En attente', color: '#f59e0b' },
      matched: { text: 'Transporteur trouvé', color: '#10b981' },
      paid: { text: 'Payé', color: '#667eea' },
    };
    return badges[status] || badges.pending;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[BRAND_COLORS.PRIMARY_RED, '#b91c1c']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mes Demandes</Text>
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
          onPress={() => navigation.navigate('NewRequest')}
        >
          <Text style={styles.createButtonIcon}>+</Text>
          <Text style={styles.createButtonText}>Nouvelle demande</Text>
        </TouchableOpacity>

        {loading ? (
          <Text style={styles.loadingText}>Chargement...</Text>
        ) : requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📦</Text>
            <Text style={styles.emptyStateText}>Aucune demande créée</Text>
            <Text style={styles.emptyStateSubtext}>
              Créez votre première demande de transport
            </Text>
          </View>
        ) : (
          requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.requestDirection}>
                  {getDirectionLabel(request.direction)}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBadge(request.status).color },
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {getStatusBadge(request.status).text}
                  </Text>
                </View>
              </View>

              <View style={styles.requestRoute}>
                <View style={styles.locationRow}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <Text style={styles.locationText}>{request.pickup_location}</Text>
                </View>
                <View style={styles.locationRow}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <Text style={styles.locationText}>{request.dropoff_location}</Text>
                </View>
              </View>

              <View style={styles.requestDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Poids:</Text>
                  <Text style={styles.detailValue}>{request.weight_kg} kg</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date souhaitée:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(request.desired_date)} • {formatTime(request.desired_date)}
                  </Text>
                </View>
              </View>

              {request.status === 'matched' && request.transporterInfo && (
                <View style={styles.transporterInfo}>
                  <Text style={styles.transporterTitle}>Transporteur trouvé:</Text>
                  <Text style={styles.transporterDetail}>
                    📧 {request.transporterInfo.email}
                  </Text>
                  <Text style={styles.transporterDetail}>
                    📱 {request.transporterInfo.phone}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Prix:</Text>
                    <Text style={styles.priceValue}>€45</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() =>
                      navigation.navigate('Payment', {
                        requestId: request.id,
                        offerId: request.matched_offer_id,
                      })
                    }
                  >
                    <Text style={styles.payButtonText}>Payer maintenant</Text>
                  </TouchableOpacity>
                </View>
              )}

              {request.status === 'paid' && (
                <View style={styles.paidInfo}>
                  <Text style={styles.paidText}>✅ Paiement effectué</Text>
                </View>
              )}
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
    backgroundColor: BRAND_COLORS.PRIMARY_RED,
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
  requestCard: {
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    marginBottom: SPACING.MD,
    ...SHADOWS.SMALL,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  requestDirection: {
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  statusBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: RADIUS.MD,
  },
  statusBadgeText: {
    color: BRAND_COLORS.TEXT_WHITE,
    fontSize: TYPOGRAPHY.BODY_SMALL,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  requestRoute: {
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
  requestDetails: {
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
  transporterInfo: {
    backgroundColor: BRAND_COLORS.FEATURE_ICON_BG,
    padding: SPACING.MD,
    borderRadius: RADIUS.MD,
    marginTop: SPACING.SM,
  },
  transporterTitle: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_DARK,
    marginBottom: SPACING.SM,
  },
  transporterDetail: {
    fontSize: TYPOGRAPHY.BODY_MEDIUM,
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.SM,
    paddingTop: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.BORDER_LIGHT,
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_DARK,
  },
  priceValue: {
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    fontWeight: TYPOGRAPHY.EXTRABOLD,
    color: BRAND_COLORS.SUCCESS,
  },
  payButton: {
    backgroundColor: BRAND_COLORS.SUCCESS,
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    alignItems: 'center',
    marginTop: SPACING.SM,
  },
  payButtonText: {
    color: BRAND_COLORS.TEXT_WHITE,
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  paidInfo: {
    backgroundColor: '#f0fdf4',
    padding: SPACING.MD,
    borderRadius: RADIUS.MD,
    marginTop: SPACING.SM,
    alignItems: 'center',
  },
  paidText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.SUCCESS,
  },
});
