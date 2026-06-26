import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Platform } from 'react-native';

let customBaseUrl: string | null = null;

export const setCustomApiBase = (url: string) => {
  customBaseUrl = url;
};

export const getApiBaseUrl = () => {
  if (customBaseUrl) return customBaseUrl;
  
  // ⚠️ Cập nhật IP này thành IP máy tính trên cùng mạng WiFi với điện thoại.
  // IP hiện tại: 172.16.40.148
  const apiBase = 'http://172.16.40.148:8080';
  
  console.log('Using API Base URL:', apiBase);
  return apiBase;
};




const api = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
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
