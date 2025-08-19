import prisma from '../config/db';
import AppError from '../utils/AppError';

export const createSubCategory = async (data: {
  name: string;
  slug?: string;
  categoryId: string;
  generated_by_ai?: boolean;
}) => {
  try {
    console.log('[SubCategory] Create payload:', data);
    return await prisma.subCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        categoryId: data.categoryId,
        generated_by_ai: data.generated_by_ai ?? true,
      },
      include: {
        category: true,
      },
    });
  } catch (error: unknown) {
    const errorWithDetails = error as {
      message?: string;
      code?: string;
      meta?: unknown;
      stack?: string;
    };
    console.error('[SubCategory] Create failed:', errorWithDetails);
    const err = error as { code?: string; meta?: unknown; message?: string } | null;
    if (err && err.code === 'P2002') {
      return Promise.reject(
        new AppError('SubCategory already exists with the given unique field(s)', 409, {
          target: (err.meta as { target?: string[] })?.target,
        }),
      );
    }
    throw new AppError('Failed to create subcategory', 500, { originalError: error });
  }
};

export const getSubCategories = async (categoryId?: string) => {
  try {
    const where = categoryId ? { categoryId } : {};
    return await prisma.subCategory.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: {
            selectedByUsers: true,
            selectedByBusinesses: true,
          },
        },
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch subcategories', 500, { originalError: error });
  }
};

export const getSubCategoryById = async (id: string) => {
  const subCategory = await prisma.subCategory.findUnique({
    where: { id },
    include: {
      category: true,
      _count: {
        select: {
          selectedByUsers: true,
          selectedByBusinesses: true,
        },
      },
    },
  });

  if (!subCategory) {
    throw new AppError('SubCategory not found', 404);
  }
  return subCategory;
};

export const updateSubCategory = async (id: string, updates: Record<string, unknown>) => {
  try {
    return await prisma.subCategory.update({
      where: { id },
      data: updates,
      include: {
        category: true,
      },
    });
  } catch (error) {
    throw new AppError('Failed to update subcategory', 500, { originalError: error });
  }
};

export const deleteSubCategory = async (id: string) => {
  try {
    return await prisma.subCategory.delete({
      where: { id },
    });
  } catch (error) {
    throw new AppError('Failed to delete subcategory', 500, { originalError: error });
  }
};
