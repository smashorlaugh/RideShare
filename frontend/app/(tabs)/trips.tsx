import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, useTheme, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ridesAPI, bookingsAPI } from '../../src/api/client';
import RideCard from '../../src/components/RideCard';
import BookingCard from '../../src/components/BookingCard';
import EmptyState from '../../src/components/EmptyState';

export default function TripsScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [view, setView] = useState('my-rides');
  const [myRides, setMyRides] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [ridesRes, bookingsRes, requestsRes] = await Promise.all([
        ridesAPI.getMyRides(),
        bookingsAPI.getMyBookings(),
        bookingsAPI.getRequests(),
      ]);
      
      setMyRides(ridesRes.data);
      setMyBookings(bookingsRes.data);
      setBookingRequests(requestsRes.data);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const handleAccept = async (bookingId: string) => {
    try {
      await bookingsAPI.updateStatus(bookingId, 'accepted');
      fetchData();
    } catch (error) {
      console.error('Error accepting booking:', error);
    }
  };

  const handleReject = async (bookingId: string) => {
    try {
      await bookingsAPI.updateStatus(bookingId, 'rejected');
      fetchData();
    } catch (error) {
      console.error('Error rejecting booking:', error);
    }
  };

  const handleCancel = async (bookingId: string) => {
    try {
      await bookingsAPI.updateStatus(bookingId, 'cancelled');
      fetchData();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    switch (view) {
      case 'my-rides':
        return (
          <FlatList
            data={myRides}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RideCard
                ride={item}
                onPress={() => router.push(`/ride/${item.id}`)}
                showStatus
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="car-outline"
                title="No rides offered"
                description="Start sharing your rides with others"
                actionLabel="Offer a Ride"
                onAction={() => router.push('/(tabs)/offer-ride')}
              />
            }
          />
        );
        
      case 'my-bookings':
        return (
          <FlatList
            data={myBookings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BookingCard
                booking={item}
                type="passenger"
                onCancel={() => handleCancel(item.id)}
                onChat={() => router.push(`/chat/${item.id}?type=booking`)}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="ticket-outline"
                title="No bookings"
                description="Find a ride and book your seat"
                actionLabel="Search Rides"
                onAction={() => router.push('/(tabs)/search')}
              />
            }
          />
        );
        
      case 'requests':
        return (
          <FlatList
            data={bookingRequests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BookingCard
                booking={item}
                type="driver"
                onAccept={() => handleAccept(item.id)}
                onReject={() => handleReject(item.id)}
                onChat={() => router.push(`/chat/${item.id}?type=booking`)}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="inbox-outline"
                title="No booking requests"
                description="When passengers book your rides, they'll appear here"
              />
            }
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>My Trips</Text>
      </View>

      <SegmentedButtons
        value={view}
        onValueChange={setView}
        buttons={[
          { value: 'my-rides', label: 'My Rides' },
          { value: 'my-bookings', label: 'Bookings' },
          { value: 'requests', label: 'Requests' },
        ]}
        style={styles.segmented}
      />

      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  segmented: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
