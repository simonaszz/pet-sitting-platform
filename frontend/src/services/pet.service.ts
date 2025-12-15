import { api } from './api';

export enum PetType {
  DOG = 'DOG',
  CAT = 'CAT',
  BIRD = 'BIRD',
  RABBIT = 'RABBIT',
  OTHER = 'OTHER',
}

export interface Pet {
  id: string;
  name: string;
  type: PetType;
  breed?: string;
  age?: number;
  photo?: string;
  notes?: string;
  medicalNotes?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePetData {
  name: string;
  type: PetType;
  breed?: string;
  age?: number;
  photo?: string;
  notes?: string;
  medicalNotes?: string;
}

export interface UpdatePetData {
  name?: string;
  type?: PetType;
  breed?: string;
  age?: number;
  photo?: string;
  notes?: string;
  medicalNotes?: string;
}

export const petService = {
  // Gauti visus vartotojo augintinius
  async getAll(): Promise<Pet[]> {
    const response = await api.get<Pet[]>('/pets');
    return response.data;
  },

  // Gauti vieną augintinį
  async getOne(id: string): Promise<Pet> {
    const response = await api.get<Pet>(`/pets/${id}`);
    return response.data;
  },

  // Sukurti naują augintinį
  async create(data: CreatePetData): Promise<Pet> {
    const response = await api.post<Pet>('/pets', data);
    return response.data;
  },

  // Atnaujinti augintinį
  async update(id: string, data: UpdatePetData): Promise<Pet> {
    const response = await api.patch<Pet>(`/pets/${id}`, data);
    return response.data;
  },

  // Ištrinti augintinį
  async delete(id: string): Promise<void> {
    await api.delete(`/pets/${id}`);
  },
};

// Helper funkcija tipų pavadinimams lietuviškai
export const getPetTypeLabel = (type: PetType): string => {
  const labels: Record<PetType, string> = {
    [PetType.DOG]: '🐕 Šuo',
    [PetType.CAT]: '🐈 Katė',
    [PetType.BIRD]: '🐦 Paukštis',
    [PetType.RABBIT]: '🐰 Triušis',
    [PetType.OTHER]: '🐾 Kita',
  };
  return labels[type];
};
