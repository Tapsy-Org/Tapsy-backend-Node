import { CategoryAudience, Status } from '@prisma/client';

import prisma from '../config/db';
import AppError from '../utils/AppError';

export const createCategory = async (data: {
  name: string;
  slug: string;
  status: Status;
  audience: CategoryAudience;
  sort_order: number;
}) => {
  try {
    return await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        status: data.status,
        audience: data.audience,
        sort_order: data.sort_order,
      },
    });
  } catch (error: unknown) {
    const errorWithDetails = error as {
      message?: string;
      code?: string;
      meta?: unknown;
      stack?: string;
    };
    console.error('[Category] Create failed:', {
      message: errorWithDetails?.message,
      code: errorWithDetails?.code,
      meta: errorWithDetails?.meta,
      stack: errorWithDetails?.stack,
    });
    const err = error as { code?: string; meta?: unknown; message?: string } | null;
    if (err && err.code === 'P2002') {
      return Promise.reject(
        new AppError('Category already exists with the given unique field(s)', 409, {
          target: (err.meta as { target?: string[] })?.target,
        }),
      );
    }
    if (err && err.code) {
      return Promise.reject(
        new AppError('Database error while creating category', 500, {
          code: err.code,
          meta: err.meta,
          message: err.message,
        }),
      );
    }
    throw new AppError('Failed to create category', 500, { originalError: error });
  }
};

export const getCategories = async () => {
  try {
    return await prisma.category.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch categories', 500, { originalError: error });
  }
};

export const getActiveCategories = async () => {
  try {
    return await prisma.category.findMany({
      where: {
        status: Status.ACTIVE, // Only get active categories
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch active categories', 500, { originalError: error });
  }
};

export const getCategoriesWithBusinessCount = async () => {
  try {
    return await prisma.category.findMany({
      where: {
        status: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            users: {
              where: {
                user_type: 'BUSINESS',
                user: {
                  status: 'ACTIVE',
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch categories with business count', 500, {
      originalError: error,
    });
  }
};

export const getTopCategories = async (limit: number = 10) => {
  try {
    return await prisma.category.findMany({
      where: {
        status: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            users: {
              where: {
                user_type: 'BUSINESS',
                user: {
                  status: 'ACTIVE',
                },
              },
            },
          },
        },
      },
      orderBy: {
        users: {
          _count: 'desc',
        },
      },
      take: limit,
    });
  } catch (error) {
    throw new AppError('Failed to fetch top categories', 500, { originalError: error });
  }
};

export const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true,
        },
      },
    },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }
  return category;
};

export const updateCategory = async (id: string, updates: Record<string, unknown>) => {
  try {
    return await prisma.category.update({
      where: { id },
      data: updates,
    });
  } catch (error) {
    throw new AppError('Failed to update category', 500, { originalError: error });
  }
};

export const deleteCategory = async (id: string) => {
  // check if linked
  const linked = await prisma.userCategory.findFirst({ where: { categoryId: id } });
  if (linked) {
    throw new AppError(
      'Cannot delete this category because users are currently using it. Please update the category instead of deleting it.',
      400,
    );
  }

  try {
    return await prisma.category.delete({
      where: { id },
    });
  } catch (error) {
    throw new AppError('Failed to delete category', 500, { originalError: error });
  }
};
