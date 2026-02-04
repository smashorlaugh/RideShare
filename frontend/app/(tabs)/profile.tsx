import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Avatar, Button, Card, useTheme, List, Divider, Dialog, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { userAPI } from '../../src/api/client';

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await userAPI.deleteAccount();
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
      setDeleteDialogVisible(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {user?.photo ? (
            <Avatar.Image size={96} source={{ uri: user.photo }} />
          ) : (
            <Avatar.Icon 
              size={96} 
              icon="account" 
              style={{ backgroundColor: theme.colors.primaryContainer }} 
            />
          )}
          <Text variant="headlineSmall" style={styles.name}>
            {user?.name || 'Set your name'}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {user?.phone}
          </Text>
          
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={20} color="#FFB800" />
            <Text variant="titleMedium" style={{ marginLeft: 4, fontWeight: '600' }}>
              {user?.rating ? user.rating.toFixed(1) : 'New'}
            </Text>
            {user?.total_ratings ? (
              <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant }}>
                ({user.total_ratings} reviews)
              </Text>
            ) : null}
          </View>

          <Button 
            mode="contained" 
            onPress={() => router.push('/profile/edit')}
            style={styles.editButton}
            icon="pencil"
          >
            Edit Profile
          </Button>
        </View>

        {/* Stats Card */}
        <Card style={styles.statsCard}>
          <Card.Content style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                {user?.total_rides_as_driver || 0}
              </Text>
              <Text variant="bodySmall">Rides Given</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.outline }]} />
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                {user?.total_rides_as_passenger || 0}
              </Text>
              <Text variant="bodySmall">Rides Taken</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Menu */}
        <Card style={styles.menuCard}>
          <List.Item
            title="My Private Requests"
            description="View your ride requests"
            left={props => <List.Icon {...props} icon="hand-wave" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/private-request/my-requests')}
          />
          <Divider />
          <List.Item
            title="Nearby Requests"
            description="View requests from passengers"
            left={props => <List.Icon {...props} icon="map-marker-radius" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/private-request/list')}
          />
          <Divider />
          <List.Item
            title="My Reviews"
            description="See what others say about you"
            left={props => <List.Icon {...props} icon="star" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push(`/reviews/${user?.id}`)}
          />
        </Card>

        {/* Settings */}
        <Card style={styles.menuCard}>
          <List.Item
            title="Privacy Policy"
            left={props => <List.Icon {...props} icon="shield-account" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="Terms of Service"
            left={props => <List.Icon {...props} icon="file-document" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
        </Card>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.actionButton}
            icon="logout"
          >
            Logout
          </Button>
          <Button
            mode="text"
            onPress={() => setDeleteDialogVisible(true)}
            textColor={theme.colors.error}
            style={styles.actionButton}
            icon="delete"
          >
            Delete Account
          </Button>
        </View>

        <Text variant="bodySmall" style={styles.version}>
          RideShare v1.0.0
        </Text>
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Icon icon="alert" />
          <Dialog.Title>Delete Account?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              This action cannot be undone. All your data, rides, and bookings will be permanently deleted.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button 
              onPress={handleDeleteAccount} 
              textColor={theme.colors.error}
              loading={loading}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontWeight: '600',
    marginTop: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  editButton: {
    marginTop: 16,
    borderRadius: 20,
  },
  statsCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  menuCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  actionsContainer: {
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    borderRadius: 12,
  },
  version: {
    textAlign: 'center',
    marginTop: 24,
    color: '#9E9E9E',
  },
});
