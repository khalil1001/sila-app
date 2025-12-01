import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
        colors={['#667eea', '#764ba2']}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  createButton: {
    backgroundColor: '#667eea',
    borderRadius: 15,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonIcon: {
    fontSize: 24,
    color: '#ffffff',
    marginRight: 10,
    fontWeight: '700',
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  loadingText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#999',
  },
  offerCard: {
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
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  offerDirection: {
    fontSize: 24,
    fontWeight: '700',
  },
  bookingBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  bookingBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  offerRoute: {
    marginBottom: 15,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  offerDetails: {
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  viewBookingsButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  viewBookingsButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
