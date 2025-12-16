import { api } from './api';

export interface SitterProfile {
  id: string;
  userId: string;
  bio?: string;
  city: string;
  address?: string;
  hourlyRate: number;
  services?: string[];
  photos?: string[];
  availability?: unknown;
  maxPets?: number;
  experienceYears?: number;
  isVerified?: boolean;
  responseTime?: number;
  avgRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
}

export interface CreateSitterProfileData {
  bio?: string;
  city: string;
  address?: string;
  hourlyRate: number;
  services?: string[];
  photos?: string[];
  maxPets?: number;
  experienceYears?: number;
}

export interface UpdateSitterProfileData {
  bio?: string;
  city?: string;
  address?: string;
  hourlyRate?: number;
  services?: string[];
  photos?: string[];
  maxPets?: number;
  experienceYears?: number;
}

export const sitterService = {
  // Sukurti savo profilį
  async createProfile(data: CreateSitterProfileData): Promise<SitterProfile> {
    const response = await api.post<SitterProfile>('/sitter-profiles', data);
    return response.data;
  },

  // Gauti savo profilį
  async getMyProfile(): Promise<SitterProfile> {
    const response = await api.get<SitterProfile>('/sitter-profiles/me');
    return response.data;
  },

  // Atnaujinti savo profilį
  async updateProfile(data: UpdateSitterProfileData): Promise<SitterProfile> {
    const response = await api.patch<SitterProfile>('/sitter-profiles/me', data);
    return response.data;
  },

  // Ištrinti savo profilį
  async deleteProfile(): Promise<void> {
    await api.delete('/sitter-profiles/me');
  },

  // Gauti visus sitters (su filtrais)
  async getAll(filters?: {
    city?: string;
    minRate?: number;
    maxRate?: number;
    minRating?: number;
  }): Promise<SitterProfile[]> {
    const params = new URLSearchParams();
    if (filters?.city) params.append('city', filters.city);
    if (filters?.minRate) params.append('minRate', filters.minRate.toString());
    if (filters?.maxRate) params.append('maxRate', filters.maxRate.toString());
    if (filters?.minRating) params.append('minRating', filters.minRating.toString());

    const response = await api.get<SitterProfile[]>(`/sitter-profiles?${params.toString()}`);
    return response.data;
  },

  // Gauti vieną profilį
  async getById(id: string): Promise<SitterProfile> {
    const response = await api.get<SitterProfile>(`/sitter-profiles/${id}`);
    return response.data;
  },
};

// Helper funkcijos
export const AVAILABLE_SERVICES = [
  'DOG_WALKING',
  'PET_SITTING',
  'HOME_VISITS',
  'OVERNIGHT_CARE',
  'GROOMING',
];

export const getServiceLabel = (service: string): string => {
  const labels: Record<string, string> = {
    DOG_WALKING: '🐕 Pasivaikščiojimas',
    PET_SITTING: '🏠 Priežiūra namuose',
    HOME_VISITS: '🚪 Apsilankymai',
    OVERNIGHT_CARE: '🌙 Naktinė priežiūra',
    GROOMING: '✂️ Kirpimas',
  };
  return labels[service] || service;
};
