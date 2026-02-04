import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, useTheme, Chip, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface BookingCardProps {
  booking: {
    id: string;
    passenger_name?: string;
    pickup_location: string;
    drop_location: string;
    date: string;
    time: string;
    seats: number;
    total_price: number;
    status: string;
    message?: string;
  };
  type: 'passenger' | 'driver';
  onPress?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  onChat?: () => void;
}

export default function BookingCard({ 
  booking, 
  type, 
  onPress, 
  onAccept, 
  onReject, 
  onCancel,
  onChat 
}: BookingCardProps) {
  const theme = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'accepted': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'cancelled': return '#9E9E9E';
      case 'completed': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          {/* Header with status */}
          <View style={styles.headerRow}>
            {type === 'driver' && booking.passenger_name && (
              <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                {booking.passenger_name}
              </Text>
            )}
            <Chip 
              style={[styles.statusChip, { backgroundColor: getStatusColor(booking.status) }]}
              textStyle={{ color: '#FFFFFF', fontSize: 12 }}
            >
              {booking.status.toUpperCase()}
            </Chip>
          </View>

          {/* Route */}
          <View style={styles.routeContainer}>
            <View style={styles.routeIcons}>
              <Ionicons name="location" size={18} color="#4CAF50" />
              <View style={styles.line} />
              <Ionicons name="flag" size={18} color="#F44336" />
            </View>
            <View style={styles.routeText}>
              <Text variant="bodyMedium" numberOfLines={1}>
                {booking.pickup_location}
              </Text>
              <Text variant="bodyMedium" numberOfLines={1} style={{ marginTop: 12 }}>
                {booking.drop_location}
              </Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={{ marginLeft: 4 }}>{booking.date}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={{ marginLeft: 4 }}>{booking.time}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={{ marginLeft: 4 }}>{booking.seats} seats</Text>
            </View>
            <View style={styles.detailItem}>
              <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                ${booking.total_price}
              </Text>
            </View>
          </View>

          {/* Message if exists */}
          {booking.message && (
            <View style={styles.messageContainer}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                "{booking.message}"
              </Text>
            </View>
          )}

          {/* Actions */}
          {booking.status === 'pending' && type === 'driver' && (
            <View style={styles.actionsRow}>
              <Button mode="contained" onPress={onAccept} style={styles.actionButton} buttonColor="#4CAF50">
                Accept
              </Button>
              <Button mode="outlined" onPress={onReject} style={styles.actionButton} textColor="#F44336">
                Reject
              </Button>
            </View>
          )}

          {booking.status === 'pending' && type === 'passenger' && (
            <View style={styles.actionsRow}>
              <Button mode="outlined" onPress={onCancel} style={styles.actionButton} textColor="#F44336">
                Cancel Request
              </Button>
            </View>
          )}

          {(booking.status === 'accepted' || booking.status === 'pending') && onChat && (
            <Button 
              mode="text" 
              onPress={onChat} 
              icon="chat-outline"
              style={{ marginTop: 8 }}
            >
              Chat
            </Button>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusChip: {
    height: 24,
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  routeIcons: {
    width: 24,
    alignItems: 'center',
  },
  line: {
    width: 2,
    height: 16,
    backgroundColor: '#E0E0E0',
    marginVertical: 2,
  },
  routeText: {
    flex: 1,
    marginLeft: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
});
