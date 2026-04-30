import axios from 'axios';
import { Platform } from 'react-native';

// Use local IP for physical devices, localhost for emulator
// ⚠️ Update this if your machine's IP changes (run `ipconfig` to find it)
const API_URL = 'http://192.168.1.110:5001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for Auth
api.interceptors.request.use(async (config) => {
  // We will get the token from Zustand store or secure storage here
  // const token = useAuthStore.getState().token;
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);
