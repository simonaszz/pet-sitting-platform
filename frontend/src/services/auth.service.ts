import { api } from './api';
import { useAuthStore } from '../store/auth.store';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'OWNER' | 'SITTER' | 'BOTH';
  phone?: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone: string | null;
    avatar: string | null;
    isEmailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    const { user, accessToken, refreshToken } = response.data;
    
    // Save to store
    useAuthStore.getState().setAuth(user, accessToken, refreshToken);
    
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    const { user, accessToken, refreshToken } = response.data;
    
    // Save to store
    useAuthStore.getState().setAuth(user, accessToken, refreshToken);
    
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout() {
    useAuthStore.getState().clearAuth();
  },
};