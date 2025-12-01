import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';

export default function CreateOfferScreen({ navigation, route }) {
  const [direction, setDirection] = useState('tn_fr');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [departureDate, setDepartureDate] = useState(new Date());
  const [arrivalDate, setArrivalDate] = useState(new Date());
  const [capacity, setCapacity] = useState('');
  const [showDepartureDatePicker, setShowDepartureDatePicker] = useState(false);
  const [showDepartureTimePicker, setShowDepartureTimePicker] = useState(false);
  const [showArrivalDatePicker, setShowArrivalDatePicker] = useState(false);
  const [showArrivalTimePicker, setShowArrivalTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Address autocomplete states
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    // Restore form data if returning from map
    if (route.params?.formData) {
      const data = route.params.formData;
      setDirection(data.direction || 'tn_fr');
      setPickupLocation(data.pickupLocation || '');
      setDropoffLocation(data.dropoffLocation || '');
      setCapacity(data.capacity || '');
      if (data.departureDate) setDepartureDate(new Date(data.departureDate));
      if (data.arrivalDate) setArrivalDate(new Date(data.arrivalDate));
      if (data.pickupCoords) setPickupCoords(data.pickupCoords);
      if (data.dropoffCoords) setDropoffCoords(data.dropoffCoords);
    }

    // Update coords and address from map selection (this should override formData)
    if (route.params?.coords && route.params?.mapType) {
      if (route.params.mapType === 'pickup') {
        setPickupCoords(route.params.coords);
        // Set address if provided from map
        if (route.params.address) {
          setPickupLocation(route.params.address);
        }
      } else if (route.params.mapType === 'dropoff') {
        setDropoffCoords(route.params.coords);
        // Set address if provided from map
        if (route.params.address) {
          setDropoffLocation(route.params.address);
        }
      }
    }
  }, [route.params]);

  const handleCreateOffer = async () => {
    if (!pickupLocation || !dropoffLocation || !capacity) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!pickupCoords || !dropoffCoords) {
      Alert.alert('Erreur', 'Veuillez sélectionner les emplacements sur la carte');
      return;
    }

    const capacityNum = parseFloat(capacity);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      Alert.alert('Erreur', 'La capacité doit être un nombre positif');
      return;
    }

    if (arrivalDate <= departureDate) {
      Alert.alert('Erreur', 'La date d\'arrivée doit être après la date de départ');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('transport_offers').insert({
        transporter_id: user.id,
        pickup_location: pickupLocation,
        pickup_coords: pickupCoords,
        dropoff_location: dropoffLocation,
        dropoff_coords: dropoffCoords,
        departure_date: departureDate.toISOString(),
        arrival_date: arrivalDate.toISOString(),
        total_capacity_kg: capacityNum,
        available_capacity_kg: capacityNum,
        direction: direction,
      });

      if (error) throw error;

      Alert.alert('Succès', 'Offre créée avec succès !', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Search for address suggestions (forward geocoding)
  const searchAddress = async (query, isPickup) => {
    if (!query || query.length < 3) {
      if (isPickup) {
        setPickupSuggestions([]);
        setShowPickupSuggestions(false);
      } else {
        setDropoffSuggestions([]);
        setShowDropoffSuggestions(false);
      }
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await response.json();

      const suggestions = data.map(item => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));

      if (isPickup) {
        setPickupSuggestions(suggestions);
        setShowPickupSuggestions(suggestions.length > 0);
      } else {
        setDropoffSuggestions(suggestions);
        setShowDropoffSuggestions(suggestions.length > 0);
      }
    } catch (error) {
      console.error('Error searching address:', error);
    }
  };

  // Handle address input with debouncing
  const handleAddressChange = (text, isPickup) => {
    if (isPickup) {
      setPickupLocation(text);
    } else {
      setDropoffLocation(text);
    }

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for search
    const timeout = setTimeout(() => {
      searchAddress(text, isPickup);
    }, 500); // Wait 500ms after user stops typing

    setSearchTimeout(timeout);
  };

  // Select suggestion from dropdown
  const selectSuggestion = (suggestion, isPickup) => {
    if (isPickup) {
      setPickupLocation(suggestion.display_name);
      setPickupCoords({ lat: suggestion.lat, lng: suggestion.lng });
      setShowPickupSuggestions(false);
    } else {
      setDropoffLocation(suggestion.display_name);
      setDropoffCoords({ lat: suggestion.lat, lng: suggestion.lng });
      setShowDropoffSuggestions(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créer une offre</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Direction */}
        <Text style={styles.label}>Direction</Text>
        <View style={styles.directionButtons}>
          <TouchableOpacity
            style={[
              styles.directionButton,
              direction === 'tn_fr' && styles.directionButtonActive,
            ]}
            onPress={() => setDirection('tn_fr')}
          >
            <Text
              style={[
                styles.directionButtonText,
                direction === 'tn_fr' && styles.directionButtonTextActive,
              ]}
            >
              🇹🇳 → 🇫🇷
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.directionButton,
              direction === 'fr_tn' && styles.directionButtonActive,
            ]}
            onPress={() => setDirection('fr_tn')}
          >
            <Text
              style={[
                styles.directionButtonText,
                direction === 'fr_tn' && styles.directionButtonTextActive,
              ]}
            >
              🇫🇷 → 🇹🇳
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pickup Location */}
        <Text style={styles.label}>Lieu de ramassage</Text>
        <View style={styles.addressContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ex: Tunis, Tunisia"
            placeholderTextColor="#999"
            value={pickupLocation}
            onChangeText={(text) => handleAddressChange(text, true)}
          />
          {showPickupSuggestions && pickupSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView style={styles.suggestionsList} keyboardShouldPersistTaps="handled">
                {pickupSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => selectSuggestion(suggestion, true)}
                  >
                    <Text style={styles.suggestionText}>{suggestion.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.mapButton, pickupCoords && styles.mapButtonSelected]}
          onPress={() => navigation.navigate('MapSelection', {
            mapType: 'pickup',
            returnScreen: 'CreateOffer',
            initialCoords: pickupCoords,
            formData: {
              direction,
              pickupLocation,
              dropoffLocation,
              capacity,
              departureDate: departureDate.toISOString(),
              arrivalDate: arrivalDate.toISOString(),
              pickupCoords,
              dropoffCoords,
            }
          })}
        >
          <Text style={[styles.mapButtonText, pickupCoords && styles.mapButtonTextSelected]}>
            📍 Choisir sur la carte
            {pickupCoords && ' ✓'}
          </Text>
        </TouchableOpacity>
        {pickupCoords && (
          <Text style={styles.coordsInfo}>
            Coordonnées: {pickupCoords.lat}°, {pickupCoords.lng}°
          </Text>
        )}

        {/* Dropoff Location */}
        <Text style={styles.label}>Lieu de dépôt</Text>
        <View style={styles.addressContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ex: Paris, France"
            placeholderTextColor="#999"
            value={dropoffLocation}
            onChangeText={(text) => handleAddressChange(text, false)}
          />
          {showDropoffSuggestions && dropoffSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView style={styles.suggestionsList} keyboardShouldPersistTaps="handled">
                {dropoffSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => selectSuggestion(suggestion, false)}
                  >
                    <Text style={styles.suggestionText}>{suggestion.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.mapButton, dropoffCoords && styles.mapButtonSelected]}
          onPress={() => navigation.navigate('MapSelection', {
            mapType: 'dropoff',
            returnScreen: 'CreateOffer',
            initialCoords: dropoffCoords,
            formData: {
              direction,
              pickupLocation,
              dropoffLocation,
              capacity,
              departureDate: departureDate.toISOString(),
              arrivalDate: arrivalDate.toISOString(),
              pickupCoords,
              dropoffCoords,
            }
          })}
        >
          <Text style={[styles.mapButtonText, dropoffCoords && styles.mapButtonTextSelected]}>
            📍 Choisir sur la carte
            {dropoffCoords && ' ✓'}
          </Text>
        </TouchableOpacity>
        {dropoffCoords && (
          <Text style={styles.coordsInfo}>
            Coordonnées: {dropoffCoords.lat}°, {dropoffCoords.lng}°
          </Text>
        )}

        {/* Departure Date & Time */}
        <Text style={styles.label}>Date et heure de départ</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowDepartureDatePicker(true)}
          >
            <Text style={styles.dateTimeButtonText}>{formatDate(departureDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowDepartureTimePicker(true)}
          >
            <Text style={styles.dateTimeButtonText}>{formatTime(departureDate)}</Text>
          </TouchableOpacity>
        </View>

        {showDepartureDatePicker && (
          <DateTimePicker
            value={departureDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDepartureDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                const newDate = new Date(departureDate);
                newDate.setFullYear(selectedDate.getFullYear());
                newDate.setMonth(selectedDate.getMonth());
                newDate.setDate(selectedDate.getDate());
                setDepartureDate(newDate);
              }
            }}
          />
        )}

        {showDepartureTimePicker && (
          <DateTimePicker
            value={departureDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDepartureTimePicker(Platform.OS === 'ios');
              if (selectedDate) {
                const newDate = new Date(departureDate);
                newDate.setHours(selectedDate.getHours());
                newDate.setMinutes(selectedDate.getMinutes());
                setDepartureDate(newDate);
              }
            }}
          />
        )}

        {/* Arrival Date & Time */}
        <Text style={styles.label}>Date et heure d'arrivée</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowArrivalDatePicker(true)}
          >
            <Text style={styles.dateTimeButtonText}>{formatDate(arrivalDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowArrivalTimePicker(true)}
          >
            <Text style={styles.dateTimeButtonText}>{formatTime(arrivalDate)}</Text>
          </TouchableOpacity>
        </View>

        {showArrivalDatePicker && (
          <DateTimePicker
            value={arrivalDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowArrivalDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                const newDate = new Date(arrivalDate);
                newDate.setFullYear(selectedDate.getFullYear());
                newDate.setMonth(selectedDate.getMonth());
                newDate.setDate(selectedDate.getDate());
                setArrivalDate(newDate);
              }
            }}
          />
        )}

        {showArrivalTimePicker && (
          <DateTimePicker
            value={arrivalDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowArrivalTimePicker(Platform.OS === 'ios');
              if (selectedDate) {
                const newDate = new Date(arrivalDate);
                newDate.setHours(selectedDate.getHours());
                newDate.setMinutes(selectedDate.getMinutes());
                setArrivalDate(newDate);
              }
            }}
          />
        )}

        {/* Capacity */}
        <Text style={styles.label}>Capacité disponible (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 50"
          placeholderTextColor="#999"
          value={capacity}
          onChangeText={setCapacity}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateOffer}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Création...' : 'Créer l\'offre'}
          </Text>
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
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
    marginTop: 5,
  },
  directionButtons: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  directionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 16,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  directionButtonActive: {
    borderColor: '#667eea',
    backgroundColor: '#667eea',
  },
  directionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  directionButtonTextActive: {
    color: '#ffffff',
  },
  addressContainer: {
    position: 'relative',
    zIndex: 1,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  mapButton: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 14,
    borderWidth: 1,
    borderColor: '#667eea',
    marginBottom: 10,
  },
  mapButtonSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    textAlign: 'center',
  },
  mapButtonTextSelected: {
    color: '#ffffff',
  },
  coordsInfo: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  dateTimeRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dateTimeButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateTimeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#667eea',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
