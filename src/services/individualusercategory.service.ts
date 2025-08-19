import prisma from '../config/db';
import AppError from '../utils/AppError';

export const assignCategoryToUser = async (userId: string, categoryId: string) => {
  try {
    // Check if user exists
    const user = await prisma.individualUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.individualUserCategory.findFirst({
      where: {
        userId,
        categoryId,
      },
    });

    if (existingAssignment) {
      throw new AppError('Category already assigned to this user', 409);
    }

    // Create the assignment
    const assignment = await prisma.individualUserCategory.create({
      data: {
        userId,
        categoryId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            mobile_number: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    return assignment;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to assign category to user', 500, { originalError: error });
  }
};

export const getUserCategories = async (userId: string) => {
  try {
    // Check if user exists
    const user = await prisma.individualUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const userCategories = await prisma.individualUserCategory.findMany({
      where: {
        userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            created_at: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return userCategories;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch user categories', 500, { originalError: error });
  }
};

export const removeCategoryFromUser = async (userId: string, categoryId: string) => {
  try {
    // Check if assignment exists
    const assignment = await prisma.individualUserCategory.findFirst({
      where: {
        userId,
        categoryId,
      },
    });

    if (!assignment) {
      throw new AppError('Category assignment not found', 404);
    }

    // Remove the assignment
    await prisma.individualUserCategory.delete({
      where: {
        id: assignment.id,
      },
    });

    return { message: 'Category removed from user successfully' };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to remove category from user', 500, { originalError: error });
  }
};

export const assignMultipleCategoriesToUser = async (userId: string, categoryIds: string[]) => {
  try {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      throw new AppError('No categories provided', 400);
    }

    // Check if user exists
    const user = await prisma.individualUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check which categories are already assigned
    const existingAssignments = await prisma.individualUserCategory.findMany({
      where: { userId, categoryId: { in: categoryIds } },
      select: { categoryId: true },
    });

    const alreadyAssignedIds = existingAssignments.map((e) => e.categoryId);

    // Filter out categories that are already assigned
    const newCategoryIds = categoryIds.filter((id) => !alreadyAssignedIds.includes(id));

    if (newCategoryIds.length === 0) {
      throw new AppError('All categories already assigned to user', 409);
    }

    // Create multiple assignments
    await prisma.individualUserCategory.createMany({
      data: newCategoryIds.map((categoryId) => ({
        userId,
        categoryId,
      })),
      skipDuplicates: true,
    });

    // Fetch the inserted records with relations
    const assignments = await prisma.individualUserCategory.findMany({
      where: { userId, categoryId: { in: newCategoryIds } },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            mobile_number: true,
          },
        },
      },
    });

    return assignments;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to assign categories to user', 500, {
      originalError: error,
    });
  }
};
