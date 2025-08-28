// utils/types.ts
import { UserType } from '@prisma/client';
export type ExpiresIn = string | number;
export interface TokenPayload {
  id: string;
  role: UserType;
}
export interface CreateLocationData {
  location: string;
  latitude: number;
  longitude: number;
  location_type: 'HOME' | 'WORK' | 'OTHER';
  address?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface UpdateLocationData {
  location?: string;
  latitude?: number;
  longitude?: number;
  location_type?: 'HOME' | 'WORK' | 'OTHER';
  address?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  country?: string;
}
