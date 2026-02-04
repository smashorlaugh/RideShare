import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, useTheme, Searchbar, Button, Chip, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ridesAPI } from '../../src/api/client';
import RideCard from '../../src/components/RideCard';
import EmptyState from '../../src/components/EmptyState';
import LocationPicker from '../../src/components/LocationPicker';

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [pickup, setPickup] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [drop, setDrop] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [date, setDate] = useState('');
  const [seats, setSeats] = useState('1');
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    
    try {
      const searchParams: any = {
        seats_needed: parseInt(seats),
      };
      
      if (pickup) {
        searchParams.pickup_lat = pickup.lat;
        searchParams.pickup_lng = pickup.lng;
      }
      
      if (drop) {
        searchParams.drop_lat = drop.lat;
        searchParams.drop_lng = drop.lng;
      }
      
      if (date) {
        searchParams.date = date;
      }
      
      const response = await ridesAPI.search(searchParams);
      setRides(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadAll = async () => {
    setLoading(true);
    setSearched(true);
    
    try {
      const response = await ridesAPI.getAll('active');
      setRides(response.data);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleLoadAll();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>Find a Ride</Text>
        </View>

        <View style={styles.searchForm}>
          <LocationPicker
            label="Pickup Location"
            value={pickup?.name || ''}
            onSelect={setPickup}
            placeholder="Where from?"
          />
          
          <LocationPicker
            label="Drop Location"
            value={drop?.name || ''}
            onSelect={setDrop}
            placeholder="Where to?"
          />

          <View style={styles.row}>
            <Text variant="labelLarge" style={{ marginRight: 12 }}>Seats:</Text>
            <SegmentedButtons
              value={seats}
              onValueChange={setSeats}
              buttons={[
                { value: '1', label: '1' },
                { value: '2', label: '2' },
                { value: '3', label: '3' },
                { value: '4', label: '4+' },
              ]}
              style={styles.segmented}
            />
          </View>

          <Button
            mode="contained"
            onPress={handleSearch}
            loading={loading}
            style={styles.searchButton}
            contentStyle={styles.searchButtonContent}
            icon="magnify"
          >
            Search Rides
          </Button>
        </View>

        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RideCard
              ride={item}
              onPress={() => router.push(`/ride/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            searched && !loading ? (
              <EmptyState
                icon="car-outline"
                title="No rides found"
                description="Try adjusting your search or create a private request"
                actionLabel="Create Request"
                onAction={() => router.push('/private-request/create')}
              />
            ) : null
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  searchForm: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  segmented: {
    flex: 1,
  },
  searchButton: {
    borderRadius: 12,
  },
  searchButtonContent: {
    height: 48,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
});
