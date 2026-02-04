import axios from 'axios';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// API functions
export const authAPI = {
  sendOTP: (phone: string) => apiClient.post('/api/auth/send-otp', { phone }),
  verifyOTP: (phone: string, otp: string) => apiClient.post('/api/auth/verify-otp', { phone, otp }),
};

export const userAPI = {
  getProfile: () => apiClient.get('/api/users/profile'),
  updateProfile: (data: any) => apiClient.put('/api/users/profile', data),
  deleteAccount: () => apiClient.delete('/api/users/account'),
  getUser: (userId: string) => apiClient.get(`/api/users/${userId}`),
};

export const ridesAPI = {
  create: (data: any) => apiClient.post('/api/rides', data),
  getAll: (status?: string) => apiClient.get('/api/rides', { params: { status } }),
  getMyRides: () => apiClient.get('/api/rides/my-rides'),
  search: (data: any) => apiClient.post('/api/rides/search', data),
  getById: (id: string) => apiClient.get(`/api/rides/${id}`),
  update: (id: string, data: any) => apiClient.put(`/api/rides/${id}`, data),
  cancel: (id: string) => apiClient.delete(`/api/rides/${id}`),
};

export const bookingsAPI = {
  create: (data: any) => apiClient.post('/api/bookings', data),
  getMyBookings: () => apiClient.get('/api/bookings'),
  getRequests: () => apiClient.get('/api/bookings/requests'),
  updateStatus: (id: string, status: string) => 
    apiClient.put(`/api/bookings/${id}/status`, { status }),
};

export const privateRequestsAPI = {
  create: (data: any) => apiClient.post('/api/private-requests', data),
  getMine: () => apiClient.get('/api/private-requests'),
  getNearby: () => apiClient.get('/api/private-requests/nearby'),
  respond: (id: string, data: any) => apiClient.post(`/api/private-requests/${id}/respond`, data),
  cancel: (id: string) => apiClient.delete(`/api/private-requests/${id}`),
};

export const chatAPI = {
  sendMessage: (data: any) => apiClient.post('/api/chats/message', data),
  getMessages: (type: string, id: string) => apiClient.get(`/api/chats/${type}/${id}`),
};

export const reviewsAPI = {
  create: (data: any) => apiClient.post('/api/reviews', data),
  getUserReviews: (userId: string) => apiClient.get(`/api/reviews/user/${userId}`),
};

export const uploadAPI = {
  uploadImage: async (uri: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);
    return apiClient.post('/api/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
