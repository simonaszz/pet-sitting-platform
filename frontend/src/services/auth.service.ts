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
    phone?: string | null;
    address?: string | null;
    avatar?: string | null;
    isEmailVerified?: boolean;
    createdAt?: string;
  };
  accessToken: string;
  refreshToken: string;
}

interface CurrentUserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  address: string | null;
  avatar: string | null;
  isEmailVerified: boolean;
  createdAt: string;
}

interface UpdateMeData {
  name: string;
  phone?: string;
  address?: string;
  avatar?: string;
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
    const response = await api.get<CurrentUserResponse>('/auth/me');
    return response.data;
  },

  async updateMe(data: UpdateMeData) {
    const response = await api.patch<CurrentUserResponse>('/auth/me', data);
    useAuthStore.getState().updateUser(response.data);
    return response.data;
  },

  logout() {
    useAuthStore.getState().clearAuth();
  },
};