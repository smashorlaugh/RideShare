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
        router.push({
          pathname: '/(auth)/verify',
          params: { phone },
        });
      }
    } catch (err: any) {
      console.error('OTP Error:', err);
      const message = err.response?.data?.detail || err.message || 'Failed to send OTP';
      setError(message);
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

            <View style={styles.footer}>
              <Text variant="labelMedium" style={[styles.madeInIndia, { color: theme.colors.onSurfaceVariant }]}>
                Made in India 🇮🇳
              </Text>
            </View>
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
  footer: {
    marginTop: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  madeInIndia: {
    opacity: 0.8,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
});
