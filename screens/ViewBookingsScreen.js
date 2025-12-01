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
  offerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 15,
  },
  offerHeader: {
    marginBottom: 15,
  },
  offerDirection: {
    fontSize: 24,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
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
    textAlign: 'center',
  },
  bookingCard: {
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
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  bookingId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  bookingDetails: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bookingRoute: {
    marginBottom: 15,
  },
  contactButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
