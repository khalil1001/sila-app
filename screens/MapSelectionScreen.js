import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

export default function MapSelectionScreen({ route, navigation }) {
  const { mapType, initialCoords } = route.params;
  const [selectedCoords, setSelectedCoords] = useState(initialCoords || null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // Get address from coordinates (reverse geocoding)
  const getAddressFromCoords = async (lat, lng) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();

      if (data.display_name) {
        setAddress(data.display_name);
      }
    } catch (error) {
      // Silent error handling for reverse geocoding
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    const coords = {
      lat: parseFloat(latitude.toFixed(6)),
      lng: parseFloat(longitude.toFixed(6)),
    };

    setSelectedCoords(coords);

    // Get address from coordinates
    await getAddressFromCoords(coords.lat, coords.lng);
  };

  const handleConfirm = () => {
    if (selectedCoords) {
      const returnParams = {
        coords: selectedCoords,
        address: address,
        mapType,
      };

      // Pass form data back if it was provided
      if (route.params?.formData) {
        returnParams.formData = route.params.formData;
      }

      navigation.navigate({
        name: route.params.returnScreen || (mapType === 'pickup' || mapType === 'dropoff' ? 'CreateOffer' : 'NewRequest'),
        params: returnParams,
        merge: true,
      });
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
        <Text style={styles.headerTitle}>
          {mapType === 'pickup' ? 'Ramassage' : 'Dépôt'}
        </Text>
      </View>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: initialCoords?.lat || 36.8,
          longitude: initialCoords?.lng || 10.2,
          latitudeDelta: initialCoords ? 0.5 : 8,
          longitudeDelta: initialCoords ? 0.5 : 12,
        }}
        onPress={handleMapPress}
      >
        {selectedCoords && (
          <Marker
            coordinate={{
              latitude: selectedCoords.lat,
              longitude: selectedCoords.lng,
            }}
            title={mapType === 'pickup' ? 'Ramassage' : 'Dépôt'}
          />
        )}
      </MapView>

      {selectedCoords && (
        <View style={styles.coordsContainer}>
          <View style={styles.coordsCard}>
            <Text style={styles.coordsTitle}>Emplacement sélectionné</Text>
            {loading ? (
              <Text style={styles.coordsText}>Chargement de l'adresse...</Text>
            ) : address ? (
              <Text style={styles.addressText}>📍 {address}</Text>
            ) : null}
            <Text style={styles.coordsText}>
              Latitude: {selectedCoords.lat}°
            </Text>
            <Text style={styles.coordsText}>
              Longitude: {selectedCoords.lng}°
            </Text>
          </View>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>
              Confirmer l'emplacement
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  map: {
    flex: 1,
    margin: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  coordsContainer: {
    padding: 20,
  },
  coordsCard: {
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
  coordsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  coordsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  addressText: {
    fontSize: 15,
    color: '#10b981',
    marginBottom: 10,
    fontWeight: '600',
    lineHeight: 22,
  },
  confirmButton: {
    backgroundColor: '#10b981',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
