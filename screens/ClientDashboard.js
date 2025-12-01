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
        colors={['#667eea', '#764ba2']}
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
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  requestDirection: {
    fontSize: 24,
    fontWeight: '700',
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
  requestRoute: {
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
  requestDetails: {
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
  transporterInfo: {
    backgroundColor: '#f0f9ff',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  transporterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  transporterDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10b981',
  },
  payButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  paidInfo: {
    backgroundColor: '#f0fdf4',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  paidText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
});
