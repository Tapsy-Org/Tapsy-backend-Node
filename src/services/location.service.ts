import prisma from '../config/db';
import AppError from '../utils/AppError';

export interface CreateLocationData {
  location: string;
  latitude: number;
  longitude: number;
  location_type: 'HOME' | 'WORK' | 'OTHER';
  city?: string;
  state?: string;
  country?: string;
}

export interface UpdateLocationData {
  location?: string;
  latitude?: number;
  longitude?: number;
  location_type?: 'HOME' | 'WORK' | 'OTHER';
  city?: string;
  state?: string;
  country?: string;
}

export const createLocationForUser = async (userId: string, locationData: CreateLocationData) => {
  try {
    const location = await prisma.location.create({
      data: {
        userId,
        ...locationData,
      },
    });

    return location;
  } catch {
    throw new AppError('Failed to create location', 500);
  }
};

export const getUserLocations = async (userId: string) => {
  try {
    const locations = await prisma.location.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return locations;
  } catch {
    throw new AppError('Failed to fetch user locations', 500);
  }
};

export const getLocationById = async (locationId: string, userId: string) => {
  try {
    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        userId,
      },
    });

    if (!location) {
      throw new AppError('Location not found', 404);
    }

    return location;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch location', 500);
  }
};

export const updateLocation = async (
  locationId: string,
  userId: string,
  updateData: UpdateLocationData,
) => {
  try {
    // First check if location exists and belongs to user
    const existingLocation = await prisma.location.findFirst({
      where: {
        id: locationId,
        userId,
      },
    });

    if (!existingLocation) {
      throw new AppError('Location not found', 404);
    }

    const updatedLocation = await prisma.location.update({
      where: { id: locationId },
      data: updateData,
    });

    return updatedLocation;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update location', 500);
  }
};

export const deleteLocation = async (locationId: string, userId: string) => {
  try {
    // First check if location exists and belongs to user
    const existingLocation = await prisma.location.findFirst({
      where: {
        id: locationId,
        userId,
      },
    });

    if (!existingLocation) {
      throw new AppError('Location not found', 404);
    }

    await prisma.location.delete({
      where: { id: locationId },
    });

    return { message: 'Location deleted successfully' };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete location', 500);
  }
};

export const getNearbyLocations = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
) => {
  try {
    // Convert radius from km to degrees (approximate)
    const radiusDegrees = radiusKm / 111;

    const nearbyLocations = await prisma.location.findMany({
      where: {
        latitude: {
          gte: latitude - radiusDegrees,
          lte: latitude + radiusDegrees,
        },
        longitude: {
          gte: longitude - radiusDegrees,
          lte: longitude + radiusDegrees,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            user_type: true,
            logo_url: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return nearbyLocations;
  } catch {
    throw new AppError('Failed to fetch nearby locations', 500);
  }
};
