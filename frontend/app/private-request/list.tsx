import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, useTheme, Card, Button, Chip, IconButton, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { privateRequestsAPI } from '../../../src/api/client';
import EmptyState from '../../../src/components/EmptyState';

export default function NearbyRequestsScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const response = await privateRequestsAPI.getNearby();
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests();
  }, []);

  const handleRespond = async (requestId: string) => {
    setRespondingId(requestId);
    try {
      const response = await privateRequestsAPI.respond(requestId, {
        request_id: requestId,
        message: 'I can offer this ride!',
      });
      
      Alert.alert(
        'Success',
        'You have responded to this request. A ride has been created.',
        [{ text: 'View Ride', onPress: () => router.push(`/ride/${response.data.ride.id}`) }]
      );
      fetchRequests();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to respond');
    } finally {
      setRespondingId(null);
    }
  };

  const renderRequest = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.headerRow}>
          <View style={styles.passengerInfo}>
            <Ionicons name="person-circle" size={40} color={theme.colors.primary} />
            <View style={{ marginLeft: 12 }}>
              <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                {item.passenger_name || 'Passenger'}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {item.seats_needed} seat{item.seats_needed > 1 ? 's' : ''} needed
              </Text>
            </View>
          </View>
          <Chip compact style={{ backgroundColor: '#FF9800' }} textStyle={{ color: '#FFF' }}>
            REQUEST
          </Chip>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.routeIcons}>
            <Ionicons name="location" size={18} color="#4CAF50" />
            <View style={styles.line} />
            <Ionicons name="flag" size={18} color="#F44336" />
          </View>
          <View style={styles.routeText}>
            <Text variant="bodyMedium" numberOfLines={2}>{item.from_location}</Text>
            <Text variant="bodyMedium" numberOfLines={2} style={{ marginTop: 12 }}>
              {item.to_location}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <Chip icon="calendar" compact style={styles.chip}>
            {item.preferred_date}
          </Chip>
          <Chip icon="clock-outline" compact style={styles.chip}>
            {item.preferred_time}
          </Chip>
        </View>

        {item.message && (
          <View style={[styles.messageBox, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="bodySmall">"{item.message}"</Text>
          </View>
        )}

        <Button
          mode="contained"
          onPress={() => handleRespond(item.id)}
          loading={respondingId === item.id}
          disabled={respondingId === item.id}
          style={styles.respondButton}
          icon="car"
        >
          Offer This Ride
        </Button>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={{ flex: 1 }}>Ride Requests</Text>
      </View>

      <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Passengers looking for rides. Offer yours!
      </Text>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequest}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="hand-wave-outline"
            title="No requests nearby"
            description="When passengers create ride requests, they'll appear here"
          />
        }
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  routeIcons: {
    width: 24,
    alignItems: 'center',
  },
  line: {
    width: 2,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginVertical: 2,
  },
  routeText: {
    flex: 1,
    marginLeft: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    height: 28,
  },
  messageBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  respondButton: {
    borderRadius: 12,
  },
});
