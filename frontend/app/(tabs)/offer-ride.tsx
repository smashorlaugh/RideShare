import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, useTheme, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ridesAPI } from '../../src/api/client';
import LocationPicker from '../../src/components/LocationPicker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

export default function OfferRideScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [pickup, setPickup] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [drop, setDrop] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [seats, setSeats] = useState('3');
  const [price, setPrice] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const handleSubmit = async () => {
    if (!pickup || !drop) {
      setSnackbar({ visible: true, message: 'Please select pickup and drop locations' });
      return;
    }

    if (!price || parseFloat(price) < 0) {
      setSnackbar({ visible: true, message: 'Please enter a valid price' });
      return;
    }

    setLoading(true);

    try {
      const rideData = {
        pickup_location: pickup.name,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        drop_location: drop.name,
        drop_lat: drop.lat,
        drop_lng: drop.lng,
        date: format(date, 'yyyy-MM-dd'),
        time: format(time, 'HH:mm'),
        available_seats: parseInt(seats),
        price_per_seat: parseFloat(price),
        car_model: carModel || null,
        car_number: carNumber || null,
        notes: notes || null,
      };

      const response = await ridesAPI.create(rideData);
      setSnackbar({ visible: true, message: 'Ride published successfully!' });
      
      // Reset form
      setPickup(null);
      setDrop(null);
      setPrice('');
      setNotes('');
      
      // Navigate to ride details
      setTimeout(() => {
        router.push(`/ride/${response.data.id}`);
      }, 1000);
    } catch (error: any) {
      setSnackbar({ 
        visible: true, 
        message: error.response?.data?.detail || 'Failed to publish ride' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>Offer a Ride</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Share your journey with fellow travelers
            </Text>
          </View>

          <View style={styles.form}>
            <LocationPicker
              label="Pickup Location"
              value={pickup?.name || ''}
              onSelect={setPickup}
              placeholder="Where are you starting?"
            />

            <LocationPicker
              label="Drop Location"
              value={drop?.name || ''}
              onSelect={setDrop}
              placeholder="Where are you going?"
            />

            {/* Date Picker */}
            <TextInput
              mode="outlined"
              label="Date"
              value={format(date, 'MMM dd, yyyy')}
              onPressIn={() => setShowDatePicker(true)}
              right={<TextInput.Icon icon="calendar" />}
              style={styles.input}
              editable={false}
            />
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}

            {/* Time Picker */}
            <TextInput
              mode="outlined"
              label="Time"
              value={format(time, 'hh:mm a')}
              onPressIn={() => setShowTimePicker(true)}
              right={<TextInput.Icon icon="clock" />}
              style={styles.input}
              editable={false}
            />
            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (selectedTime) setTime(selectedTime);
                }}
              />
            )}

            <View style={styles.row}>
              <TextInput
                mode="outlined"
                label="Available Seats"
                value={seats}
                onChangeText={setSeats}
                keyboardType="number-pad"
                style={[styles.input, styles.halfInput]}
                maxLength={1}
              />
              <TextInput
                mode="outlined"
                label="Price per Seat ($)"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                style={[styles.input, styles.halfInput]}
                placeholder="0.00"
              />
            </View>

            <TextInput
              mode="outlined"
              label="Car Model (Optional)"
              value={carModel}
              onChangeText={setCarModel}
              style={styles.input}
              placeholder="e.g., Toyota Camry"
            />

            <TextInput
              mode="outlined"
              label="Car Number (Optional)"
              value={carNumber}
              onChangeText={setCarNumber}
              style={styles.input}
              placeholder="e.g., ABC 1234"
            />

            <TextInput
              mode="outlined"
              label="Notes (Optional)"
              value={notes}
              onChangeText={setNotes}
              style={styles.input}
              multiline
              numberOfLines={3}
              placeholder="Any additional info for passengers..."
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
              icon="car"
            >
              Publish Ride
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
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
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  form: {
    flex: 1,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  submitButtonContent: {
    height: 56,
  },
});
