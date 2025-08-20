import prisma from '../config/db';
import AppError from '../utils/AppError';

export const getAllLocations = async () => {
  try {
    return await prisma.location.findMany({
      orderBy: {
        created_at: 'desc',
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch locations', 500, { originalError: error });
  }
};

export const getLocationById = async (id: string) => {
  try {
    const location = await prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      throw new AppError('Location not found', 404);
    }

    return location;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch location', 500, { originalError: error });
  }
};
