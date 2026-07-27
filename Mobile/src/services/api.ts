import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

let customBaseUrl: string | null = null;

export const setCustomApiBase = (url: string) => {
  customBaseUrl = url;
};

export const getApiBaseUrl = () => {
  if (customBaseUrl) return customBaseUrl;

  // Tự động phát hiện IP máy tính (host) đang chạy Metro Bundler để kết nối backend
  const hostUri = Constants.expoConfig?.hostUri;
  let host = 'localhost';

  if (hostUri) {
    host = hostUri.split(':')[0];
  } else {
    // Dự phòng khi chạy độc lập
    host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  }

  const apiBase = process.env.EXPO_PUBLIC_API_URL || `http://172.16.32.115:8080`;

  console.log('Using API Base URL:', apiBase);
  return apiBase;
};




const api = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  },
});

// Request Interceptor: Attach JWT token
api.interceptors.request.use(
  async (config) => {
    // Dynamically set baseURL on each request in case base URL was customized
    config.baseURL = getApiBaseUrl();

    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      console.warn('API returned 401, logging out user...');
      await useAuthStore.getState().logout();
    }
    // Extract readable error message
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
    return Promise.reject(new Error(errorMsg));
  }
);

export default api;
