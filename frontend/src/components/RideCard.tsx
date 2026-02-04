import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Avatar, useTheme, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface RideCardProps {
  ride: {
    id: string;
    driver_name: string;
    driver_photo: string | null;
    driver_rating: number;
    pickup_location: string;
    drop_location: string;
    date: string;
    time: string;
    available_seats: number;
    booked_seats: number;
    price_per_seat: number;
    status: string;
  };
  onPress: () => void;
  showStatus?: boolean;
}

export default function RideCard({ ride, onPress, showStatus = false }: RideCardProps) {
  const theme = useTheme();
  const availableSeats = ride.available_seats - ride.booked_seats;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          {/* Driver Info */}
          <View style={styles.driverRow}>
            <View style={styles.driverInfo}>
              {ride.driver_photo ? (
                <Avatar.Image size={48} source={{ uri: ride.driver_photo }} />
              ) : (
                <Avatar.Icon size={48} icon="account" style={{ backgroundColor: theme.colors.primaryContainer }} />
              )}
              <View style={styles.driverText}>
                <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                  {ride.driver_name || 'Driver'}
                </Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#FFB800" />
                  <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant }}>
                    {ride.driver_rating > 0 ? ride.driver_rating.toFixed(1) : 'New'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.priceContainer}>
              <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                ${ride.price_per_seat}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                per seat
              </Text>
            </View>
          </View>

          {/* Route */}
          <View style={styles.routeContainer}>
            <View style={styles.routeIcons}>
              <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
              <View style={styles.line} />
              <View style={[styles.dot, { backgroundColor: '#F44336' }]} />
            </View>
            <View style={styles.routeText}>
              <Text variant="bodyMedium" numberOfLines={1} style={styles.locationText}>
                {ride.pickup_location}
              </Text>
              <Text variant="bodyMedium" numberOfLines={1} style={[styles.locationText, { marginTop: 16 }]}>
                {ride.drop_location}
              </Text>
            </View>
          </View>

          {/* Date, Time, Seats */}
          <View style={styles.detailsRow}>
            <Chip icon="calendar" compact style={styles.chip}>
              {ride.date}
            </Chip>
            <Chip icon="clock-outline" compact style={styles.chip}>
              {ride.time}
            </Chip>
            <Chip 
              icon="seat-passenger" 
              compact 
              style={[styles.chip, availableSeats === 0 && styles.chipFull]}
            >
              {availableSeats} left
            </Chip>
          </View>

          {showStatus && (
            <View style={styles.statusRow}>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getStatusColor(ride.status) }]}
                textStyle={{ color: '#FFFFFF' }}
              >
                {ride.status.toUpperCase()}
              </Chip>
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  driverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverText: {
    marginLeft: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
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
    marginLeft: 12,
  },
  locationText: {
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    height: 28,
  },
  chipFull: {
    backgroundColor: '#FFEBEE',
  },
  statusRow: {
    marginTop: 12,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
});
