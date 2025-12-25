import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';
import {
  BRAND_COLORS,
  SPACING,
  RADIUS,
  SHADOWS,
  TYPOGRAPHY,
  isLargeScreen,
} from '../constants/theme';

export default function NewRequestScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    departureAddress: '',
    departureCoords: null,
    departureCountry: '',
    arrivalAddress: '',
    arrivalCoords: null,
    arrivalCountry: '',
    date: new Date(),
    weight: '',
  });
  const [loading, setLoading] = useState(false);

  // Autocomplete states
  const [departureSuggestions, setDepartureSuggestions] = useState([]);
  const [arrivalSuggestions, setArrivalSuggestions] = useState([]);
  const [departureSearch, setDepartureSearch] = useState('');
  const [arrivalSearch, setArrivalSearch] = useState('');

  // Map modal states
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapModalType, setMapModalType] = useState(null); // 'departure' or 'arrival'

  // Custom notification modal
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Show custom notification
  const showCustomNotification = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
      navigation.goBack();
    }, 2500);
  };

  // Update form data helper
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Get country flag emoji
  const getCountryFlag = (country) => {
    const flags = {
      'tunisia': '🇹🇳',
      'france': '🇫🇷',
      'italy': '🇮🇹',
      'spain': '🇪🇸',
      'germany': '🇩🇪',
    };
    return flags[country.toLowerCase()] || '🌍';
  };

  // Detect country from coordinates
  const detectCountry = (lat) => {
    if (lat >= 30 && lat <= 38) return 'Tunisia';
    if (lat >= 41 && lat <= 51) return 'France';
    if (lat >= 36 && lat <= 47) return 'Italy';
    return '';
  };

  // Search address with Nominatim
  const searchAddress = async (query, type) => {
    if (query.length < 3) {
      if (type === 'departure') setDepartureSuggestions([]);
      else setArrivalSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();

      const suggestions = data.map(item => ({
        address: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        country: detectCountry(parseFloat(item.lat)),
      }));

      if (type === 'departure') setDepartureSuggestions(suggestions);
      else setArrivalSuggestions(suggestions);
    } catch (error) {
      // Silent error handling for address search
    }
  };

  // Select address from suggestions
  const selectAddress = (suggestion, type) => {
    const coords = { lat: suggestion.lat, lng: suggestion.lng };

    if (type === 'departure') {
      updateFormData('departureAddress', suggestion.address);
      updateFormData('departureCoords', coords);
      updateFormData('departureCountry', suggestion.country);
      setDepartureSearch(suggestion.address);
      setDepartureSuggestions([]);
    } else {
      updateFormData('arrivalAddress', suggestion.address);
      updateFormData('arrivalCoords', coords);
      updateFormData('arrivalCountry', suggestion.country);
      setArrivalSearch(suggestion.address);
      setArrivalSuggestions([]);
    }
  };

  // Step navigation
  const goToNextStep = () => {
    if (currentStep === 1) {
      if (!formData.departureCoords || !formData.arrivalCoords) {
        if (Platform.OS === 'web') {
          alert('Veuillez sélectionner les adresses de départ et d\'arrivée');
        } else {
          Alert.alert('Attention', 'Veuillez sélectionner les adresses de départ et d\'arrivée sur la carte');
        }
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.weight) {
        if (Platform.OS === 'web') {
          alert('Veuillez indiquer le poids du colis');
        } else {
          Alert.alert('Attention', 'Veuillez indiquer le poids du colis');
        }
        return;
      }
      const weightNum = parseFloat(formData.weight);
      if (isNaN(weightNum) || weightNum <= 0) {
        if (Platform.OS === 'web') {
          alert('Le poids doit être un nombre positif');
        } else {
          Alert.alert('Erreur', 'Le poids doit être un nombre positif');
        }
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Handle map marker placement
  const handleMapPress = (coords, type) => {
    const country = detectCountry(coords.lat);

    if (type === 'departure') {
      updateFormData('departureCoords', coords);
      updateFormData('departureCountry', country);
      reverseGeocode(coords.lat, coords.lng, 'departure');
      setDepartureSearch('');
    } else {
      updateFormData('arrivalCoords', coords);
      updateFormData('arrivalCountry', country);
      reverseGeocode(coords.lat, coords.lng, 'arrival');
      setArrivalSearch('');
    }

    setShowMapModal(false);
  };

  // Reverse geocoding
  const reverseGeocode = async (lat, lng, type) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      if (data.display_name) {
        updateFormData(
          type === 'departure' ? 'departureAddress' : 'arrivalAddress',
          data.display_name
        );
        if (type === 'departure') {
          setDepartureSearch(data.display_name);
        } else {
          setArrivalSearch(data.display_name);
        }
      }
    } catch (error) {
      // Silent error handling for reverse geocoding
    }
  };

  // Submit request
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const weightNum = parseFloat(formData.weight);

      // Determine direction based on coordinates
      const isTunisia = (lat) => lat >= 30 && lat <= 38;
      const isFrance = (lat) => lat >= 41 && lat <= 51;

      let direction = 'tn_fr'; // default
      if (isTunisia(formData.departureCoords.lat) && isFrance(formData.arrivalCoords.lat)) {
        direction = 'tn_fr';
      } else if (isFrance(formData.departureCoords.lat) && isTunisia(formData.arrivalCoords.lat)) {
        direction = 'fr_tn';
      }

      // Find matching offers
      const { data: offers, error: offerError } = await supabase
        .from('transport_offers')
        .select('*')
        .eq('direction', direction)
        .gte('available_capacity_kg', weightNum)
        .gte('departure_date', new Date().toISOString())
        .order('departure_date', { ascending: true })
        .limit(1);

      if (offerError) {
        throw offerError;
      }

      if (!offers || offers.length === 0) {
        // No match found - create pending request
        const { error: requestError } = await supabase
          .from('transport_requests')
          .insert({
            client_id: user.id,
            weight_kg: weightNum,
            desired_date: formData.date.toISOString(),
            pickup_location: formData.departureAddress,
            pickup_coords: formData.departureCoords,
            dropoff_location: formData.arrivalAddress,
            dropoff_coords: formData.arrivalCoords,
            direction: direction,
            status: 'pending',
          });

        if (requestError) {
          throw requestError;
        }

        // Show custom notification
        showCustomNotification('Demande créée ! Nous vous notifierons quand un transporteur sera disponible.');
        return;
      }

      // Match found
      const matchedOffer = offers[0];
      const { data: request, error: requestError } = await supabase
        .from('transport_requests')
        .insert({
          client_id: user.id,
          weight_kg: weightNum,
          desired_date: formData.date.toISOString(),
          pickup_location: formData.departureAddress,
          pickup_coords: formData.departureCoords,
          dropoff_location: formData.arrivalAddress,
          dropoff_coords: formData.arrivalCoords,
          direction: direction,
          status: 'matched',
          matched_offer_id: matchedOffer.id,
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Update offer capacity
      await supabase
        .from('transport_offers')
        .update({
          available_capacity_kg: matchedOffer.available_capacity_kg - weightNum,
        })
        .eq('id', matchedOffer.id);

      navigation.navigate('MatchFound', {
        requestId: request.id,
        offerId: matchedOffer.id,
      });
    } catch (error) {
      // Use native browser alert on web
      if (Platform.OS === 'web') {
        alert('Erreur\n\n' + (error.message || 'Une erreur est survenue'));
      } else {
        Alert.alert('Erreur', error.message || 'Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  // Map click handler component
  function MapClickHandler({ onMapClick }) {
    useMapEvents({
      click: (e) => {
        onMapClick(e.latlng);
      },
    });
    return null;
  }

  // Render map component for web
  const renderMap = () => {
    const defaultCenter = { lat: 36.8, lng: 10.2 };

    // Fix Leaflet icon issue
    if (typeof window !== 'undefined' && window.L) {
      delete window.L.Icon.Default.prototype._getIconUrl;
      window.L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    }

    return (
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapClickHandler
          onMapClick={(latlng) => {
            const coords = { lat: latlng.lat, lng: latlng.lng };
            if (!formData.departureCoords) {
              handleMapPress(coords, 'departure');
            } else if (!formData.arrivalCoords) {
              handleMapPress(coords, 'arrival');
            }
          }}
        />
        {formData.departureCoords && (
          <Marker position={[formData.departureCoords.lat, formData.departureCoords.lng]} />
        )}
        {formData.arrivalCoords && (
          <Marker position={[formData.arrivalCoords.lat, formData.arrivalCoords.lng]} />
        )}
      </MapContainer>
    );
  };

  // Render Step 1: Route & Map
  const renderStep1 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Où souhaitez-vous envoyer un colis ?</Text>

      {/* Departure Address Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Adresse de départ</Text>
        <View style={styles.inputWithButton}>
          <TextInput
            style={styles.textInput}
            value={departureSearch}
            onChangeText={(text) => {
              setDepartureSearch(text);
              searchAddress(text, 'departure');
            }}
            placeholder="Tapez une adresse..."
            placeholderTextColor={BRAND_COLORS.TEXT_SECONDARY}
          />
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => {
              setMapModalType('departure');
              setShowMapModal(true);
            }}
          >
            <Text style={styles.mapButtonIcon}>🗺️</Text>
          </TouchableOpacity>
        </View>

        {/* Departure Autocomplete Suggestions */}
        {departureSuggestions.length > 0 && (
          <View style={styles.suggestionsDropdown}>
            {departureSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => selectAddress(suggestion, 'departure')}
              >
                <Text style={styles.suggestionText}>{suggestion.address}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Selected Departure Display */}
        {formData.departureAddress && !departureSearch && (
          <View style={styles.selectedAddress}>
            <Text style={styles.selectedAddressText}>
              {formData.departureCountry && getCountryFlag(formData.departureCountry)} {formData.departureAddress}
            </Text>
            <TouchableOpacity
              onPress={() => {
                updateFormData('departureAddress', '');
                updateFormData('departureCoords', null);
                updateFormData('departureCountry', '');
                setDepartureSearch('');
              }}
            >
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Arrow with Country Flags */}
      {formData.departureCountry && formData.arrivalCountry && (
        <View style={styles.routeArrowContainer}>
          <Text style={styles.routeArrow}>
            {getCountryFlag(formData.departureCountry)} → {getCountryFlag(formData.arrivalCountry)}
          </Text>
        </View>
      )}

      {/* Arrival Address Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Adresse d'arrivée</Text>
        <View style={styles.inputWithButton}>
          <TextInput
            style={styles.textInput}
            value={arrivalSearch}
            onChangeText={(text) => {
              setArrivalSearch(text);
              searchAddress(text, 'arrival');
            }}
            placeholder="Tapez une adresse..."
            placeholderTextColor={BRAND_COLORS.TEXT_SECONDARY}
          />
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => {
              setMapModalType('arrival');
              setShowMapModal(true);
            }}
          >
            <Text style={styles.mapButtonIcon}>🗺️</Text>
          </TouchableOpacity>
        </View>

        {/* Arrival Autocomplete Suggestions */}
        {arrivalSuggestions.length > 0 && (
          <View style={styles.suggestionsDropdown}>
            {arrivalSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => selectAddress(suggestion, 'arrival')}
              >
                <Text style={styles.suggestionText}>{suggestion.address}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Selected Arrival Display */}
        {formData.arrivalAddress && !arrivalSearch && (
          <View style={styles.selectedAddress}>
            <Text style={styles.selectedAddressText}>
              {formData.arrivalAddress} {formData.arrivalCountry && getCountryFlag(formData.arrivalCountry)}
            </Text>
            <TouchableOpacity
              onPress={() => {
                updateFormData('arrivalAddress', '');
                updateFormData('arrivalCoords', null);
                updateFormData('arrivalCountry', '');
                setArrivalSearch('');
              }}
            >
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.mapModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {mapModalType === 'departure' ? 'Sélectionner le point de départ' : 'Sélectionner le point d\'arrivée'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowMapModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalMapContainer}>
              {renderMap()}
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowMapModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );

  // Render Step 2: Details
  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Détails de l'expédition</Text>

      <View style={styles.detailsContainer}>
        {/* Weight */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Poids du colis (kg) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 15"
            placeholderTextColor={BRAND_COLORS.TEXT_SECONDARY}
            value={formData.weight}
            onChangeText={(text) => updateFormData('weight', text)}
            keyboardType="numeric"
          />
        </View>
      </View>
    </ScrollView>
  );

  // Render Step 3: Payment & Summary
  const renderStep3 = () => {
    const estimatedPrice = formData.weight ? Math.ceil(parseFloat(formData.weight) * 3) : 0;

    return (
      <ScrollView style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Paiement & Récapitulatif</Text>

        <View style={styles.summaryCard}>
          {/* Route */}
          <View style={styles.summarySection}>
            <Text style={styles.summarySectionTitle}>📍 Trajet</Text>
            <View style={styles.routeSummary}>
              <View style={styles.routePoint}>
                <View style={styles.routeDot} />
                <Text style={styles.routeText} numberOfLines={2}>
                  {formData.departureCountry && getCountryFlag(formData.departureCountry)} {formData.departureAddress}
                </Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, styles.routeDotEnd]} />
                <Text style={styles.routeText} numberOfLines={2}>
                  {formData.arrivalAddress} {formData.arrivalCountry && getCountryFlag(formData.arrivalCountry)}
                </Text>
              </View>
            </View>
          </View>

          {/* Details */}
          <View style={styles.summarySection}>
            <Text style={styles.summarySectionTitle}>📦 Détails</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Poids</Text>
              <Text style={styles.summaryValue}>{formData.weight} kg</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date souhaitée</Text>
              <Text style={styles.summaryValue}>{formData.date.toLocaleDateString('fr-FR')}</Text>
            </View>
          </View>

          {/* Price & Payment */}
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Montant du dépôt</Text>
            <Text style={styles.priceValue}>€{estimatedPrice}</Text>
            <Text style={styles.priceNote}>Un dépôt de garantie sera retenu jusqu'à la livraison</Text>
          </View>

          {/* Payment Method */}
          <View style={styles.paymentMethodSection}>
            <Text style={styles.summarySectionTitle}>💳 Méthode de paiement</Text>
            <View style={styles.paymentOption}>
              <View style={styles.radioSelected}>
                <View style={styles.radioDot} />
              </View>
              <View style={styles.paymentDetails}>
                <Text style={styles.paymentMethodText}>Carte bancaire</Text>
                <Text style={styles.paymentMethodSubtext}>Paiement sécurisé par Stripe</Text>
              </View>
              <Text style={styles.paymentIcon}>💳</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Étape {currentStep}/3</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentStep / 3) * 100}%` }]} />
          </View>
        </View>
      </View>

      {/* Step content */}
      <View style={styles.content}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </View>

      {/* Navigation buttons */}
      <View style={styles.navigationBar}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={goToPreviousStep}
          >
            <Text style={styles.secondaryButtonText}>Retour</Text>
          </TouchableOpacity>
        )}

        {currentStep < 3 ? (
          <TouchableOpacity
            style={[styles.primaryButton, currentStep === 1 && styles.primaryButtonFull]}
            onPress={goToNextStep}
          >
            <Text style={styles.primaryButtonText}>Continuer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, styles.primaryButtonFull, loading && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Envoi en cours...' : 'Confirmer la demande'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Custom Notification Modal */}
      <Modal
        visible={showNotification}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.notificationOverlay}>
          <View style={styles.notificationBox}>
            <View style={styles.notificationIcon}>
              <Text style={styles.notificationIconText}>✓</Text>
            </View>
            <Text style={styles.notificationTitle}>Succès !</Text>
            <Text style={styles.notificationMessage}>{notificationMessage}</Text>
          </View>
        </View>
      </Modal>
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
    paddingTop: SPACING.XXL + SPACING.MD,
    paddingBottom: SPACING.LG,
    paddingHorizontal: SPACING.SCREEN_PADDING,
    ...SHADOWS.SMALL,
  },
  backButton: {
    marginBottom: SPACING.MD,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    color: BRAND_COLORS.PRIMARY_RED,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  progressContainer: {
    gap: SPACING.SM,
  },
  progressText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_DARK,
  },
  progressBar: {
    height: 4,
    backgroundColor: BRAND_COLORS.BORDER_LIGHT,
    borderRadius: RADIUS.ROUND,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BRAND_COLORS.PRIMARY_RED,
    borderRadius: RADIUS.ROUND,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    padding: SPACING.SCREEN_PADDING,
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.TITLE_LARGE,
    fontWeight: TYPOGRAPHY.EXTRABOLD,
    color: BRAND_COLORS.TEXT_DARK,
    marginBottom: SPACING.XL,
    lineHeight: TYPOGRAPHY.TITLE_LARGE * 1.2,
  },

  // Step 1: Address cards
  addressInputsContainer: {
    marginBottom: SPACING.LG,
  },
  addressCard: {
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.XL,
    padding: SPACING.LG,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
    borderWidth: 2,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    ...SHADOWS.SMALL,
  },
  addressCardSelected: {
    borderColor: BRAND_COLORS.PRIMARY_RED,
    backgroundColor: '#fff5f5',
  },
  addressIconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.ROUND,
    backgroundColor: BRAND_COLORS.SUCCESS,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  addressIconContainerB: {
    backgroundColor: BRAND_COLORS.PRIMARY_RED,
  },
  addressIcon: {
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    fontWeight: TYPOGRAPHY.EXTRABOLD,
    color: BRAND_COLORS.TEXT_WHITE,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: TYPOGRAPHY.BODY_SMALL,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XXS,
  },
  addressValue: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: BRAND_COLORS.TEXT_DARK,
  },
  checkmark: {
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    color: BRAND_COLORS.SUCCESS,
    marginLeft: SPACING.SM,
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: SPACING.XS,
  },
  arrow: {
    fontSize: TYPOGRAPHY.TITLE_MEDIUM,
    color: BRAND_COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  mapInstruction: {
    fontSize: TYPOGRAPHY.BODY_MEDIUM,
    color: BRAND_COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.LG,
    fontWeight: TYPOGRAPHY.MEDIUM,
  },
  mapContainer: {
    height: isLargeScreen ? 500 : 400,
    borderRadius: RADIUS.XL,
    overflow: 'hidden',
    backgroundColor: BRAND_COLORS.BORDER_LIGHT,
    ...SHADOWS.MEDIUM,
  },

  // Step 2: Details
  detailsContainer: {
    gap: SPACING.XL,
  },
  inputGroup: {
    gap: SPACING.SM,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_DARK,
  },
  input: {
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.XL,
    padding: SPACING.LG,
    fontSize: TYPOGRAPHY.BODY_LARGE,
    borderWidth: 2,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    color: BRAND_COLORS.TEXT_DARK,
  },
  textArea: {
    height: 120,
    paddingTop: SPACING.LG,
  },

  // Step 3: Summary
  summaryCard: {
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.XL,
    padding: SPACING.XL,
    gap: SPACING.XL,
    ...SHADOWS.MEDIUM,
  },
  summarySection: {
    gap: SPACING.MD,
  },
  summarySectionTitle: {
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_DARK,
  },
  routeSummary: {
    gap: SPACING.SM,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.MD,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: RADIUS.ROUND,
    backgroundColor: BRAND_COLORS.SUCCESS,
    marginTop: 4,
  },
  routeDotEnd: {
    backgroundColor: BRAND_COLORS.PRIMARY_RED,
  },
  routeLine: {
    width: 2,
    height: SPACING.LG,
    backgroundColor: BRAND_COLORS.BORDER_LIGHT,
    marginLeft: 5,
  },
  routeText: {
    flex: 1,
    fontSize: TYPOGRAPHY.BODY_MEDIUM,
    color: BRAND_COLORS.TEXT_DARK,
    lineHeight: TYPOGRAPHY.BODY_MEDIUM * 1.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.BODY_MEDIUM,
    color: BRAND_COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.MEDIUM,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.BODY_MEDIUM,
    color: BRAND_COLORS.TEXT_DARK,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  priceSection: {
    paddingTop: SPACING.LG,
    borderTopWidth: 2,
    borderTopColor: BRAND_COLORS.BORDER_LIGHT,
    alignItems: 'center',
    gap: SPACING.XS,
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  priceValue: {
    fontSize: TYPOGRAPHY.TITLE_LARGE,
    fontWeight: TYPOGRAPHY.EXTRABOLD,
    color: BRAND_COLORS.PRIMARY_RED,
  },
  priceNote: {
    fontSize: TYPOGRAPHY.BODY_SMALL,
    color: BRAND_COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: SPACING.XS,
  },

  // Navigation
  navigationBar: {
    flexDirection: 'row',
    padding: SPACING.SCREEN_PADDING,
    gap: SPACING.MD,
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.BORDER_LIGHT,
    ...SHADOWS.MEDIUM,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: BRAND_COLORS.PRIMARY_RED,
    borderRadius: RADIUS.XL,
    padding: SPACING.LG,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.LARGE,
  },
  primaryButtonFull: {
    flex: 1,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: BRAND_COLORS.TEXT_WHITE,
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: RADIUS.XL,
    padding: SPACING.LG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
  },
  secondaryButtonText: {
    color: BRAND_COLORS.TEXT_DARK,
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
  },

  // New Step 1: Autocomplete styles
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  textInput: {
    flex: 1,
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.XL,
    padding: SPACING.LG,
    fontSize: TYPOGRAPHY.BODY_LARGE,
    borderWidth: 2,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    color: BRAND_COLORS.TEXT_DARK,
  },
  mapButton: {
    width: 56,
    height: 56,
    backgroundColor: BRAND_COLORS.PRIMARY_BLUE,
    borderRadius: RADIUS.XL,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.MEDIUM,
  },
  mapButtonIcon: {
    fontSize: 24,
  },
  suggestionsDropdown: {
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.XL,
    marginTop: SPACING.SM,
    borderWidth: 2,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    maxHeight: 200,
    overflow: 'scroll',
    ...SHADOWS.MEDIUM,
  },
  suggestionItem: {
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  suggestionText: {
    fontSize: TYPOGRAPHY.BODY_MEDIUM,
    color: BRAND_COLORS.TEXT_DARK,
  },
  selectedAddress: {
    backgroundColor: '#fff5f5',
    borderRadius: RADIUS.XL,
    padding: SPACING.MD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.SM,
    borderWidth: 2,
    borderColor: BRAND_COLORS.PRIMARY_RED,
  },
  selectedAddressText: {
    flex: 1,
    fontSize: TYPOGRAPHY.BODY_MEDIUM,
    color: BRAND_COLORS.TEXT_DARK,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  clearButton: {
    fontSize: TYPOGRAPHY.HEADING_MEDIUM,
    color: BRAND_COLORS.PRIMARY_RED,
    fontWeight: TYPOGRAPHY.BOLD,
    paddingHorizontal: SPACING.SM,
  },
  routeArrowContainer: {
    alignItems: 'center',
    marginVertical: SPACING.LG,
  },
  routeArrow: {
    fontSize: 32,
    fontWeight: TYPOGRAPHY.BOLD,
  },

  // Map Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.LG,
  },
  mapModalContainer: {
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.XL,
    width: '100%',
    maxWidth: 800,
    maxHeight: '90%',
    ...SHADOWS.LARGE,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.LG,
    borderBottomWidth: 2,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_DARK,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.ROUND,
    backgroundColor: BRAND_COLORS.BORDER_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    color: BRAND_COLORS.TEXT_DARK,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  modalMapContainer: {
    height: 500,
    overflow: 'hidden',
  },
  modalFooter: {
    padding: SPACING.LG,
    borderTopWidth: 2,
    borderTopColor: BRAND_COLORS.BORDER_LIGHT,
  },
  cancelButton: {
    backgroundColor: BRAND_COLORS.BORDER_LIGHT,
    borderRadius: RADIUS.XL,
    padding: SPACING.LG,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_DARK,
  },

  // Payment Method styles
  paymentMethodSection: {
    paddingTop: SPACING.LG,
    borderTopWidth: 2,
    borderTopColor: BRAND_COLORS.BORDER_LIGHT,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    borderRadius: RADIUS.XL,
    padding: SPACING.LG,
    marginTop: SPACING.MD,
    borderWidth: 2,
    borderColor: BRAND_COLORS.PRIMARY_BLUE,
  },
  radioSelected: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.ROUND,
    borderWidth: 2,
    borderColor: BRAND_COLORS.PRIMARY_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: RADIUS.ROUND,
    backgroundColor: BRAND_COLORS.PRIMARY_BLUE,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentMethodText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_DARK,
  },
  paymentMethodSubtext: {
    fontSize: TYPOGRAPHY.BODY_SMALL,
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XXS,
  },
  paymentIcon: {
    fontSize: 32,
  },

  // Custom Notification styles
  notificationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBox: {
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    borderRadius: RADIUS.XXL,
    padding: SPACING.XXL,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
    ...SHADOWS.LARGE,
  },
  notificationIcon: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.ROUND,
    backgroundColor: BRAND_COLORS.SUCCESS,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.LG,
  },
  notificationIconText: {
    fontSize: 48,
    color: BRAND_COLORS.TEXT_WHITE,
    fontWeight: TYPOGRAPHY.BOLD,
  },
  notificationTitle: {
    fontSize: TYPOGRAPHY.TITLE_LARGE,
    fontWeight: TYPOGRAPHY.EXTRABOLD,
    color: BRAND_COLORS.TEXT_DARK,
    marginBottom: SPACING.SM,
  },
  notificationMessage: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    color: BRAND_COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.BODY_LARGE * 1.5,
  },
});
