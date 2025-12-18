import { api } from './api';
import type { Pet } from './pet.service';
import type { SitterProfile } from './sitter.service';

export const VisitStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  PAID: 'PAID',
  CANCELED: 'CANCELED',
  COMPLETED: 'COMPLETED',
} as const;

export type VisitStatus = (typeof VisitStatus)[keyof typeof VisitStatus];

export interface Visit {
  id: string;
  ownerId: string;
  sitterId: string;
  sitterUserId: string;
  address: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  services?: string[];
  task?: string;
  status: VisitStatus;
  notesForSitter?: string;
  rejectionReason?: string;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  pets?: Pet[];
  sitter?: SitterProfile & {
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
  petIds: string[];
  address: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  services?: string[];
  task?: string;
  totalPrice: number;
  notesForSitter?: string;
}

export interface UpdateRejectedVisitData {
  petIds?: string[];
  address?: string;
  date?: string;
  timeStart?: string;
  timeEnd?: string;
  totalPrice?: number;
  notesForSitter?: string;
}

export interface BusySlot {
  date: string; // YYYY-MM-DD
  timeStart: string;
  timeEnd: string;
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

  async getBusySlots(params: {
    sitterProfileId: string;
    dateFrom: string;
    dateTo: string;
  }): Promise<BusySlot[]> {
    const search = new URLSearchParams({
      sitterProfileId: params.sitterProfileId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    });
    const response = await api.get<BusySlot[]>(`/visits/busy-slots?${search.toString()}`);
    return response.data;
  },

  // Atnaujinti statusą (kaip sitter)
  async updateStatus(visitId: string, status: VisitStatus): Promise<Visit> {
    const response = await api.patch<Visit>(`/visits/${visitId}/status`, { status });
    return response.data;
  },

  async rejectBooking(visitId: string, rejectionReason: string): Promise<Visit> {
    const response = await api.patch<Visit>(`/visits/${visitId}/reject`, { rejectionReason });
    return response.data;
  },

  async updateRejectedBooking(visitId: string, data: UpdateRejectedVisitData): Promise<Visit> {
    const response = await api.patch<Visit>(`/visits/${visitId}`, data);
    return response.data;
  },

  async resubmitBooking(visitId: string): Promise<Visit> {
    const response = await api.patch<Visit>(`/visits/${visitId}/resubmit`);
    return response.data;
  },

  async deleteRejectedBooking(visitId: string): Promise<{ success: true }> {
    const response = await api.delete<{ success: true }>(`/visits/${visitId}`);
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
    PAID: 'Apmokėta',
    CANCELED: 'Atšaukta',
    COMPLETED: 'Baigta',
  };
  return labels[status];
};

export const getStatusColor = (status: VisitStatus): string => {
  const colors: Record<VisitStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    PAID: 'bg-blue-100 text-blue-800',
    CANCELED: 'bg-gray-100 text-gray-800',
    COMPLETED: 'bg-purple-100 text-purple-800',
  };
  return colors[status];
};
