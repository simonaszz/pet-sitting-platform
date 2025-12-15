import { api } from './api';
import type { Pet } from './pet.service';
import type { SitterProfile } from './sitter.service';

export const VisitStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type VisitStatus = (typeof VisitStatus)[keyof typeof VisitStatus];

export interface Visit {
  id: string;
  ownerId: string;
  sitterProfileId: string;
  petId: string;
  startDate: string;
  endDate: string;
  status: VisitStatus;
  notes?: string;
  totalPrice?: number;
  createdAt: string;
  updatedAt: string;
  pet?: Pet;
  sitterProfile?: SitterProfile & {
    user?: {
      id: string;
      name: string;
      phone?: string;
    };
  };
  owner?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
}

export interface CreateVisitData {
  sitterProfileId: string;
  petId: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export const bookingService = {
  // Sukurti rezervaciją (kaip owner)
  async createBooking(data: CreateVisitData): Promise<Visit> {
    const response = await api.post<Visit>('/visits', data);
    return response.data;
  },

  // Gauti mano rezervacijas (kaip owner)
  async getMyBookings(): Promise<Visit[]> {
    const response = await api.get<Visit[]>('/visits/my-bookings');
    return response.data;
  },

  // Gauti mano darbus (kaip sitter)
  async getMyJobs(): Promise<Visit[]> {
    const response = await api.get<Visit[]>('/visits/my-jobs');
    return response.data;
  },

  // Atnaujinti statusą (kaip sitter)
  async updateStatus(visitId: string, status: VisitStatus): Promise<Visit> {
    const response = await api.patch<Visit>(`/visits/${visitId}/status`, { status });
    return response.data;
  },

  // Atšaukti rezervaciją (kaip owner)
  async cancelBooking(visitId: string): Promise<Visit> {
    const response = await api.patch<Visit>(`/visits/${visitId}/cancel`);
    return response.data;
  },
};

// Helper funkcijos
export const getStatusLabel = (status: VisitStatus): string => {
  const labels: Record<VisitStatus, string> = {
    PENDING: 'Laukiama',
    ACCEPTED: 'Priimta',
    REJECTED: 'Atmesta',
    COMPLETED: 'Baigta',
    CANCELLED: 'Atšaukta',
  };
  return labels[status];
};

export const getStatusColor = (status: VisitStatus): string => {
  const colors: Record<VisitStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };
  return colors[status];
};
