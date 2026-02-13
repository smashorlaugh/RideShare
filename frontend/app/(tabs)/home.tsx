import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, FlatList } from 'react-native';
import { Text, useTheme, Button, Card, Avatar, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { ridesAPI } from '../../src/api/client';
import RideCard from '../../src/components/RideCard';
import EmptyState from '../../src/components/EmptyState';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuthStore();
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRides = async () => {
    try {
      const response = await ridesAPI.getAll('active');
      setRides(response.data.slice(0, 10)); // Show latest 10
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRides();
  }, []);

  const QuickAction = ({ icon, label, onPress, color }: any) => (
    <Card style={styles.quickAction} onPress={onPress}>
      <Card.Content style={styles.quickActionContent}>
        <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text variant="labelMedium" style={styles.quickActionLabel}>{label}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
              Hello, {user?.name || 'Traveler'}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Where are you heading today?
            </Text>
          </View>
          {user?.photo ? (
            <Avatar.Image size={48} source={{ uri: user.photo }} />
          ) : (
            <Avatar.Icon size={48} icon="account" style={{ backgroundColor: theme.colors.primaryContainer }} />
          )}
        </View>

        {/* Search Bar */}
        <Searchbar
          placeholder="Search rides..."
          onFocus={() => router.push('/(tabs)/search')}
          style={styles.searchBar}
          elevation={1}
          value=""
        />

        {/* Quick Actions */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <QuickAction
            icon="car"
            label="Offer Ride"
            color="#4CAF50"
            onPress={() => router.push('/(tabs)/offer-ride')}
          />
          <QuickAction
            icon="search"
            label="Find Ride"
            color="#2196F3"
            onPress={() => router.push('/(tabs)/search')}
          />
          <QuickAction
            icon="hand-left"
            label="Request"
            color="#FF9800"
            onPress={() => router.push('/private-request/create')}
          />
          <QuickAction
            icon="list"
            label="Requests"
            color="#9C27B0"
            onPress={() => router.push('/private-request/list')}
          />
        </View>

        {/* Recent Rides */}
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Available Rides</Text>
          <Button mode="text" onPress={() => router.push('/(tabs)/search')} compact>
            See All
          </Button>
        </View>

        {loading ? (
          <Card style={styles.loadingCard}>
            <Card.Content>
              <Text style={{ textAlign: 'center' }}>Loading rides...</Text>
            </Card.Content>
          </Card>
        ) : rides.length > 0 ? (
          rides.map((ride) => (
            <RideCard
              key={ride.id}
              ride={ride}
              onPress={() => router.push(`/ride/${ride.id}`)}
            />
          ))
        ) : (
          <EmptyState
            icon="car-outline"
            title="No rides available"
            description="Be the first to offer a ride!"
            actionLabel="Offer a Ride"
            onAction={() => router.push('/(tabs)/offer-ride')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 8,
    marginTop: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  quickAction: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  quickActionContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    textAlign: 'center',
  },
  loadingCard: {
    margin: 16,
    borderRadius: 12,
  },
});
