import prisma from '../config/db';
import AppError from '../utils/AppError';

export const assignMultipleSubcategoriesToUser = async (
  userId: string,
  subcategories: string[],
) => {
  try {
    // Check if user exists
    const user = await prisma.individualUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Insert subcategories
    await prisma.individualUserSubCategory.createMany({
      data: subcategories.map((name) => ({
        userId,
        name,
      })),
      skipDuplicates: true,
    });

    // Fetch back user with their subcategories
    const userWithSubcategories = await prisma.individualUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        selectedSubcategories: {
          // 👈 correct relation name
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return userWithSubcategories;
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to assign subcategories', 500);
  }
};
