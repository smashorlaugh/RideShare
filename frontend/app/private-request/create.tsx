import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, useTheme, Snackbar, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { privateRequestsAPI } from '../../src/api/client';
import LocationPicker from '../../src/components/LocationPicker';

export default function CreatePrivateRequestScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [from, setFrom] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [to, setTo] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [seats, setSeats] = useState('1');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const handleSubmit = async () => {
    if (!from || !to) {
      setSnackbar({ visible: true, message: 'Please select both locations' });
      return;
    }

    setLoading(true);
    try {
      await privateRequestsAPI.create({
        from_location: from.name,
        from_lat: from.lat,
        from_lng: from.lng,
        to_location: to.name,
        to_lat: to.lat,
        to_lng: to.lng,
        preferred_date: format(date, 'yyyy-MM-dd'),
        preferred_time: format(time, 'HH:mm'),
        seats_needed: parseInt(seats),
        message: message || null,
      });
      
      setSnackbar({ visible: true, message: 'Request created! Drivers will be notified.' });
      setTimeout(() => {
        router.push('/private-request/my-requests');
      }, 1500);
    } catch (error: any) {
      setSnackbar({ 
        visible: true, 
        message: error.response?.data?.detail || 'Failed to create request' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={{ flex: 1 }}>Create Request</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
            Can't find a suitable ride? Create a private request and nearby drivers will see it.
          </Text>

          <LocationPicker
            label="From Location"
            value={from?.name || ''}
            onSelect={setFrom}
            placeholder="Where do you need pickup?"
          />

          <LocationPicker
            label="To Location"
            value={to?.name || ''}
            onSelect={setTo}
            placeholder="Where are you going?"
          />

          <TextInput
            mode="outlined"
            label="Preferred Date"
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

          <TextInput
            mode="outlined"
            label="Preferred Time"
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

          <TextInput
            mode="outlined"
            label="Seats Needed"
            value={seats}
            onChangeText={setSeats}
            keyboardType="number-pad"
            style={styles.input}
            maxLength={1}
          />

          <TextInput
            mode="outlined"
            label="Message for Drivers (Optional)"
            value={message}
            onChangeText={setMessage}
            style={styles.input}
            multiline
            numberOfLines={3}
            placeholder="Any special requirements or notes..."
          />

          <View style={[styles.infoBox, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
              Your request will be visible to drivers for 24 hours. No personal contact details will be shared until a driver accepts.
            </Text>
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            icon="hand-wave"
          >
            Create Request
          </Button>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  description: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  submitButton: {
    borderRadius: 12,
  },
  submitButtonContent: {
    height: 56,
  },
});
