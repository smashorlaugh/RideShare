import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, FlatList, TouchableOpacity } from 'react-native';
import { TextInput, Text, Button, useTheme, ActivityIndicator, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationPickerProps {
  label: string;
  value: string;
  onSelect: (location: { name: string; lat: number; lng: number }) => void;
  placeholder?: string;
}

export default function LocationPicker({ label, value, onSelect, placeholder }: LocationPickerProps) {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10`,
        {
          headers: {
            'User-Agent': 'RideShareApp/1.0',
          },
        }
      );
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchLocations(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelect = (item: LocationResult) => {
    onSelect({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    });
    setModalVisible(false);
    setSearchQuery('');
    setResults([]);
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocode
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            'User-Agent': 'RideShareApp/1.0',
          },
        }
      );
      const data = await response.json();

      onSelect({
        name: data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        lat: latitude,
        lng: longitude,
      });
      setModalVisible(false);
    } catch (error) {
      console.error('Location error:', error);
      alert('Could not get current location');
    } finally {
      setGettingLocation(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.7}>
        <TextInput
          label={label}
          value={value}
          placeholder={placeholder}
          mode="outlined"
          editable={false}
          right={<TextInput.Icon icon="map-marker" />}
          style={styles.input}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <IconButton icon="close" onPress={() => setModalVisible(false)} />
            <Text variant="titleLarge" style={{ flex: 1 }}>{label}</Text>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              mode="outlined"
              placeholder="Search location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              left={<TextInput.Icon icon="magnify" />}
              style={styles.searchInput}
              autoFocus
            />
          </View>

          <TouchableOpacity 
            style={[styles.currentLocationButton, { backgroundColor: theme.colors.primaryContainer }]}
            onPress={getCurrentLocation}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <ActivityIndicator size="small" />
            ) : (
              <>
                <Ionicons name="locate" size={24} color={theme.colors.primary} />
                <Text style={{ marginLeft: 12, color: theme.colors.primary, fontWeight: '600' }}>
                  Use Current Location
                </Text>
              </>
            )}
          </TouchableOpacity>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
            </View>
          )}

          <FlatList
            data={results}
            keyExtractor={(item, index) => `${item.lat}-${item.lon}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleSelect(item)}
              >
                <Ionicons name="location-outline" size={24} color={theme.colors.onSurface} />
                <Text style={styles.resultText} numberOfLines={2}>
                  {item.display_name}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              !loading && searchQuery.length >= 3 ? (
                <Text style={styles.emptyText}>No locations found</Text>
              ) : null
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: 'transparent',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resultText: {
    flex: 1,
    marginLeft: 12,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#9E9E9E',
  },
});
