import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, useTheme, Card, Button, Chip, IconButton, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { privateRequestsAPI } from '../../src/api/client';
import EmptyState from '../../src/components/EmptyState';

export default function MyRequestsScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async () => {
    try {
      const response = await privateRequestsAPI.getMine();
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

  const handleCancel = async (requestId: string) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await privateRequestsAPI.cancel(requestId);
              fetchRequests();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel request');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#FF9800';
      case 'responded': return '#4CAF50';
      case 'cancelled': return '#9E9E9E';
      case 'expired': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const renderRequest = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.headerRow}>
          <Text variant="titleMedium" style={{ fontWeight: '600', flex: 1 }}>
            {item.seats_needed} seat{item.seats_needed > 1 ? 's' : ''} needed
          </Text>
          <Chip 
            style={{ backgroundColor: getStatusColor(item.status) }} 
            textStyle={{ color: '#FFF' }}
            compact
          >
            {item.status.toUpperCase()}
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

        {item.status === 'active' && (
          <Button
            mode="outlined"
            onPress={() => handleCancel(item.id)}
            textColor={theme.colors.error}
            style={styles.cancelButton}
          >
            Cancel Request
          </Button>
        )}

        {item.status === 'responded' && item.ride_offer_id && (
          <Button
            mode="contained"
            onPress={() => router.push(`/ride/${item.ride_offer_id}`)}
            style={styles.viewButton}
            icon="car"
          >
            View Driver's Offer
          </Button>
        )}
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
        <Text variant="titleLarge" style={{ flex: 1 }}>My Requests</Text>
        <IconButton icon="plus" onPress={() => router.push('/private-request/create')} />
      </View>

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
            title="No requests yet"
            description="Create a private request when you can't find a suitable ride"
            actionLabel="Create Request"
            onAction={() => router.push('/private-request/create')}
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
  cancelButton: {
    borderRadius: 12,
  },
  viewButton: {
    borderRadius: 12,
  },
});
