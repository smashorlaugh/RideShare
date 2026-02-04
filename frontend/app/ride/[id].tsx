import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Avatar, useTheme, Chip, Divider, ActivityIndicator, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ridesAPI, bookingsAPI } from '../../src/api/client';
import { useAuthStore } from '../../src/store/authStore';

export default function RideDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  
  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [seats, setSeats] = useState(1);

  useEffect(() => {
    fetchRide();
  }, [id]);

  const fetchRide = async () => {
    try {
      const response = await ridesAPI.getById(id);
      setRide(response.data);
    } catch (error) {
      console.error('Error fetching ride:', error);
      Alert.alert('Error', 'Failed to load ride details');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    setBooking(true);
    try {
      await bookingsAPI.create({
        ride_id: id,
        seats: seats,
      });
      Alert.alert('Success', 'Booking request sent!', [
        { text: 'OK', onPress: () => router.push('/(tabs)/trips') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to book ride');
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await ridesAPI.cancel(id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel ride');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text variant="titleLarge">Ride not found</Text>
          <Button mode="contained" onPress={() => router.back()} style={{ marginTop: 16 }}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const isDriver = ride.driver_id === user?.id;
  const availableSeats = ride.available_seats - ride.booked_seats;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={{ flex: 1 }}>Ride Details</Text>
        {isDriver && ride.status === 'active' && (
          <IconButton icon="pencil" onPress={() => {}} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Driver Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.driverRow}>
              {ride.driver_photo ? (
                <Avatar.Image size={64} source={{ uri: ride.driver_photo }} />
              ) : (
                <Avatar.Icon size={64} icon="account" style={{ backgroundColor: theme.colors.primaryContainer }} />
              )}
              <View style={styles.driverInfo}>
                <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                  {ride.driver_name || 'Driver'}
                </Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color="#FFB800" />
                  <Text variant="bodyMedium" style={{ marginLeft: 4 }}>
                    {ride.driver_rating > 0 ? ride.driver_rating.toFixed(1) : 'New Driver'}
                  </Text>
                </View>
                {isDriver && (
                  <Chip compact style={{ marginTop: 4, alignSelf: 'flex-start' }}>You</Chip>
                )}
              </View>
              <View style={styles.priceContainer}>
                <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  ${ride.price_per_seat}
                </Text>
                <Text variant="bodySmall">per seat</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Route Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ fontWeight: '600', marginBottom: 16 }}>Route</Text>
            
            <View style={styles.routeContainer}>
              <View style={styles.routeIcons}>
                <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
                <View style={styles.line} />
                <View style={[styles.dot, { backgroundColor: '#F44336' }]} />
              </View>
              <View style={styles.routeText}>
                <View>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>PICKUP</Text>
                  <Text variant="bodyLarge">{ride.pickup_location}</Text>
                </View>
                <View style={{ marginTop: 24 }}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>DROP</Text>
                  <Text variant="bodyLarge">{ride.drop_location}</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Trip Details Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ fontWeight: '600', marginBottom: 16 }}>Trip Details</Text>
            
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar" size={24} color={theme.colors.primary} />
                <View style={{ marginLeft: 12 }}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>DATE</Text>
                  <Text variant="bodyLarge">{ride.date}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="time" size={24} color={theme.colors.primary} />
                <View style={{ marginLeft: 12 }}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>TIME</Text>
                  <Text variant="bodyLarge">{ride.time}</Text>
                </View>
              </View>
            </View>

            <Divider style={{ marginVertical: 16 }} />

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="people" size={24} color={theme.colors.primary} />
                <View style={{ marginLeft: 12 }}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>SEATS</Text>
                  <Text variant="bodyLarge">{availableSeats} of {ride.available_seats} available</Text>
                </View>
              </View>
            </View>

            {ride.car_model && (
              <>
                <Divider style={{ marginVertical: 16 }} />
                <View style={styles.detailItem}>
                  <Ionicons name="car" size={24} color={theme.colors.primary} />
                  <View style={{ marginLeft: 12 }}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>CAR</Text>
                    <Text variant="bodyLarge">{ride.car_model} {ride.car_number && `• ${ride.car_number}`}</Text>
                  </View>
                </View>
              </>
            )}

            {ride.notes && (
              <>
                <Divider style={{ marginVertical: 16 }} />
                <View>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>NOTES</Text>
                  <Text variant="bodyMedium">{ride.notes}</Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Status */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.statusRow}>
              <Text variant="titleMedium">Status</Text>
              <Chip 
                style={{ 
                  backgroundColor: ride.status === 'active' ? '#4CAF50' : 
                                   ride.status === 'completed' ? '#2196F3' : '#9E9E9E' 
                }}
                textStyle={{ color: '#FFFFFF' }}
              >
                {ride.status.toUpperCase()}
              </Chip>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Bottom Action */}
      {!isDriver && ride.status === 'active' && availableSeats > 0 && (
        <View style={[styles.bottomAction, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.seatsSelector}>
            <Text variant="bodyMedium">Seats:</Text>
            <View style={styles.seatsBtns}>
              <IconButton 
                icon="minus" 
                mode="contained-tonal" 
                size={16}
                onPress={() => setSeats(Math.max(1, seats - 1))} 
              />
              <Text variant="titleMedium" style={{ marginHorizontal: 12 }}>{seats}</Text>
              <IconButton 
                icon="plus" 
                mode="contained-tonal" 
                size={16}
                onPress={() => setSeats(Math.min(availableSeats, seats + 1))} 
              />
            </View>
          </View>
          <View style={styles.bookingInfo}>
            <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
              ${(ride.price_per_seat * seats).toFixed(2)}
            </Text>
            <Button 
              mode="contained" 
              onPress={handleBook} 
              loading={booking}
              disabled={booking}
              style={styles.bookButton}
            >
              Book Now
            </Button>
          </View>
        </View>
      )}

      {isDriver && ride.status === 'active' && (
        <View style={[styles.bottomAction, { backgroundColor: theme.colors.surface }]}>
          <Button 
            mode="outlined" 
            onPress={handleCancel} 
            textColor={theme.colors.error}
            style={{ flex: 1, marginRight: 8 }}
          >
            Cancel Ride
          </Button>
          <Button 
            mode="contained" 
            onPress={() => router.push('/(tabs)/trips')}
            style={{ flex: 1, marginLeft: 8 }}
          >
            View Requests
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverInfo: {
    flex: 1,
    marginLeft: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  routeContainer: {
    flexDirection: 'row',
  },
  routeIcons: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
  },
  routeText: {
    flex: 1,
    marginLeft: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  seatsSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatsBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  bookingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bookButton: {
    marginLeft: 16,
    borderRadius: 12,
  },
});
