import prisma from '../config/db';
import AppError from '../utils/AppError';

export const createUserPersonalization = async (data: {
  name: string;
  slug: string;
  screenType: string;
  sortOrder: number;
  status: boolean;
}) => {
  try {
    return await prisma.userPersonalization.create({
      data,
    });
  } catch (error) {
    throw new AppError('Failed to create user personalization', 500, { originalError: error });
  }
};

export const getAllUserPersonalizations = async () => {
  try {
    return await prisma.userPersonalization.findMany();
  } catch (error) {
    throw new AppError('Failed to fetch user personalizations', 500, { originalError: error });
  }
};

export const getUserPersonalizationById = async (id: string) => {
  const personalization = await prisma.userPersonalization.findUnique({
    where: { id },
  });

  if (!personalization) {
    throw new AppError('User personalization not found', 404);
  }
  return personalization;
};

export const updateUserPersonalization = async (id: string, updates: Record<string, unknown>) => {
  try {
    return await prisma.userPersonalization.update({
      where: { id },
      data: updates,
    });
  } catch (error) {
    throw new AppError('Failed to update user personalization', 500, { originalError: error });
  }
};

export const deleteUserPersonalization = async (id: string) => {
  try {
    return await prisma.userPersonalization.delete({
      where: { id },
    });
  } catch (error) {
    throw new AppError('Failed to delete user personalization', 500, { originalError: error });
  }
};
