import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../src/api/client';

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    if (phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.sendOTP(phone);
      if (response.data.success) {
        // Pass debug_otp for MVP testing (remove in production)
        router.push({
          pathname: '/(auth)/verify',
          params: { phone, debugOtp: response.data.debug_otp },
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send OTP');
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
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="car-sport" size={48} color="#FFFFFF" />
            </View>
            <Text variant="headlineLarge" style={styles.title}>RideShare</Text>
            <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Your trusted carpooling companion
            </Text>
          </View>

          <View style={styles.form}>
            <Text variant="titleMedium" style={styles.formTitle}>Enter your phone number</Text>
            <Text variant="bodyMedium" style={[styles.formSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              We'll send you a verification code
            </Text>

            <TextInput
              mode="outlined"
              label="Phone Number"
              value={phone}
              onChangeText={(text) => {
                setPhone(text.replace(/[^0-9+]/g, ''));
                setError('');
              }}
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone" />}
              style={styles.input}
              maxLength={15}
              placeholder="+1234567890"
            />

            {error ? (
              <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
            ) : null}

            <Button
              mode="contained"
              onPress={handleSendOTP}
              loading={loading}
              disabled={loading || phone.length < 10}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Continue
            </Button>

            <Text variant="bodySmall" style={[styles.terms, { color: theme.colors.onSurfaceVariant }]}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  formTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  formSubtitle: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  error: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    borderRadius: 12,
  },
  buttonContent: {
    height: 56,
  },
  terms: {
    textAlign: 'center',
    marginTop: 24,
  },
});
