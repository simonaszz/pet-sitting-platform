import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token to every request
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = String(error.config?.url ?? '');
      const isAuthRequest = url.startsWith('/auth/login') || url.startsWith('/auth/register');

      if (isAuthRequest) {
        return Promise.reject(error);
      }

      // Token expired or invalid - clear auth
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);