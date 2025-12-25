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
import {
  BRAND_COLORS,
  SPACING,
  RADIUS,
  SHADOWS,
  TYPOGRAPHY,
  isLargeScreen,
} from '../constants/theme';

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
      // Silent error handling for address search
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
            placeholderTextColor={BRAND_COLORS.TEXT_SECONDARY}
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
            placeholderTextColor={BRAND_COLORS.TEXT_SECONDARY}
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
          placeholderTextColor={BRAND_COLORS.TEXT_SECONDARY}
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
  label: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_DARK,
    marginBottom: SPACING.SM,
    marginTop: SPACING.XS,
  },
  directionButtons: {
    flexDirection: 'row',
    marginBottom: SPACING.LG,
  },
  directionButton: {
    flex: 1,
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.LG,
    padding: SPACING.MD,
    marginRight: SPACING.SM,
    borderWidth: 2,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    alignItems: 'center',
  },
  directionButtonActive: {
    borderColor: BRAND_COLORS.PRIMARY_BLUE,
    backgroundColor: BRAND_COLORS.PRIMARY_BLUE,
  },
  directionButtonText: {
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_DARK,
  },
  directionButtonTextActive: {
    color: BRAND_COLORS.TEXT_WHITE,
  },
  addressContainer: {
    position: 'relative',
    zIndex: 1,
  },
  input: {
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.LG,
    padding: SPACING.MD,
    fontSize: TYPOGRAPHY.BODY_LARGE,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    marginBottom: SPACING.SM,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.LG,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    maxHeight: 200,
    zIndex: 1000,
    ...SHADOWS.MEDIUM,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  suggestionText: {
    fontSize: TYPOGRAPHY.BODY_SMALL,
    color: BRAND_COLORS.TEXT_DARK,
  },
  mapButton: {
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.LG,
    padding: SPACING.MD - 2,
    borderWidth: 1,
    borderColor: BRAND_COLORS.PRIMARY_BLUE,
    marginBottom: SPACING.SM,
  },
  mapButtonSelected: {
    backgroundColor: BRAND_COLORS.SUCCESS,
    borderColor: BRAND_COLORS.SUCCESS,
  },
  mapButtonText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: BRAND_COLORS.PRIMARY_BLUE,
    textAlign: 'center',
  },
  mapButtonTextSelected: {
    color: BRAND_COLORS.TEXT_WHITE,
  },
  coordsInfo: {
    fontSize: TYPOGRAPHY.CAPTION,
    color: BRAND_COLORS.SUCCESS,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    marginBottom: SPACING.MD,
    textAlign: 'center',
  },
  dateTimeRow: {
    flexDirection: 'row',
    marginBottom: SPACING.LG,
  },
  dateTimeButton: {
    flex: 1,
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.LG,
    padding: SPACING.MD,
    marginRight: SPACING.SM,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
  },
  dateTimeButtonText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: BRAND_COLORS.TEXT_DARK,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: BRAND_COLORS.PRIMARY_BLUE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG - 2,
    alignItems: 'center',
    marginTop: SPACING.LG,
    marginBottom: SPACING.XXL + SPACING.XS,
    ...SHADOWS.LARGE,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: BRAND_COLORS.TEXT_WHITE,
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
  },
});
