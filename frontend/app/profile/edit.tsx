import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, Avatar, useTheme, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { userAPI, uploadAPI } from '../../src/api/client';
import { useAuthStore } from '../../src/store/authStore';

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  
  const [name, setName] = useState(user?.name || '');
  const [photo, setPhoto] = useState(user?.photo || '');
  const [carModel, setCarModel] = useState(user?.car_model || '');
  const [carNumber, setCarNumber] = useState(user?.car_number || '');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPhoto(base64Image);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        name: name.trim(),
      };
      
      if (photo && photo !== user?.photo) {
        updateData.photo = photo;
      }
      
      if (carModel.trim()) {
        updateData.car_model = carModel.trim();
      }
      
      if (carNumber.trim()) {
        updateData.car_number = carNumber.trim();
      }

      const response = await userAPI.updateProfile(updateData);
      updateUser(response.data);
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="close" onPress={() => router.back()} />
        <Text variant="titleLarge" style={{ flex: 1 }}>Edit Profile</Text>
        <Button mode="text" onPress={handleSave} loading={loading} disabled={loading}>
          Save
        </Button>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Profile Photo */}
          <View style={styles.photoSection}>
            {photo ? (
              <Avatar.Image size={120} source={{ uri: photo }} />
            ) : (
              <Avatar.Icon 
                size={120} 
                icon="account" 
                style={{ backgroundColor: theme.colors.primaryContainer }} 
              />
            )}
            <Button mode="text" onPress={pickImage} style={{ marginTop: 8 }}>
              Change Photo
            </Button>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              mode="outlined"
              label="Full Name *"
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Enter your name"
            />

            <TextInput
              mode="outlined"
              label="Phone Number"
              value={user?.phone || ''}
              style={styles.input}
              editable={false}
              disabled
            />

            <Text variant="titleMedium" style={styles.sectionTitle}>Car Details (Optional)</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
              Add your car details if you plan to offer rides
            </Text>

            <TextInput
              mode="outlined"
              label="Car Model"
              value={carModel}
              onChangeText={setCarModel}
              style={styles.input}
              placeholder="e.g., Toyota Camry 2020"
            />

            <TextInput
              mode="outlined"
              label="Car Number"
              value={carNumber}
              onChangeText={setCarNumber}
              style={styles.input}
              placeholder="e.g., ABC 1234"
            />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  form: {
    flex: 1,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
});
