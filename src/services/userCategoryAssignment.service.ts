import prisma from '../config/db';
import AppError from '../utils/AppError';

export const assignCategoriesToIndividualUser = async (userId: string, categoryIds: string[]) => {
  try {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      throw new AppError('No categories provided', 400);
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

    // Fetch the inserted records with relations (optional)
    const assignments = await prisma.individualUserCategory.findMany({
      where: { userId, categoryId: { in: newCategoryIds } },
      include: {
        category: true,
        user: { select: { id: true, username: true } },
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

export const assignSubCategoryToIndividualUser = async (userId: string, subCategoryId: string) => {
  try {
    // Check if assignment already exists
    const existing = await prisma.individualUserSubCategory.findFirst({
      where: { userId, subCategoryId },
    });

    if (existing) {
      throw new AppError('SubCategory already assigned to user', 409);
    }

    return await prisma.individualUserSubCategory.create({
      data: { userId, subCategoryId },
      include: {
        subCategory: {
          include: { category: true },
        },
        user: { select: { id: true, username: true } },
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to assign subcategory to user', 500, { originalError: error });
  }
};

// Business user can only have ONE category (direct field assignment)
export const assignCategoryToBusinessUser = async (businessId: string, categoryId: string) => {
  try {
    // Update the business user's category directly
    const updatedBusiness = await prisma.businessUser.update({
      where: { id: businessId },
      data: { categoryId },
      include: {
        category: true,
      },
    });

    return updatedBusiness;
  } catch (error) {
    throw new AppError('Failed to assign category to business', 500, { originalError: error });
  }
};

export const assignSubCategoryToBusinessUser = async (
  businessId: string,
  subCategoryId: string,
) => {
  try {
    // Check if assignment already exists
    const existing = await prisma.businessUserSubCategory.findFirst({
      where: { businessId, subCategoryId },
    });

    if (existing) {
      throw new AppError('SubCategory already assigned to business', 409);
    }

    return await prisma.businessUserSubCategory.create({
      data: { businessId, subCategoryId },
      include: {
        subCategory: {
          include: { category: true },
        },
        business: { select: { id: true, business_name: true } },
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to assign subcategory to business', 500, { originalError: error });
  }
};

export const assignMultipleSubCategoriesToBusinessUser = async (
  businessId: string,
  subCategoryIds: string[],
) => {
  try {
    if (!Array.isArray(subCategoryIds) || subCategoryIds.length === 0) {
      throw new AppError('No subcategories provided', 400);
    }

    // Check which subcategories are already assigned
    const existingAssignments = await prisma.businessUserSubCategory.findMany({
      where: { businessId, subCategoryId: { in: subCategoryIds } },
      select: { subCategoryId: true },
    });

    const alreadyAssignedIds = existingAssignments.map((e) => e.subCategoryId);

    // Filter out subcategories that are already assigned
    const newSubCategoryIds = subCategoryIds.filter((id) => !alreadyAssignedIds.includes(id));

    if (newSubCategoryIds.length === 0) {
      throw new AppError('All subcategories already assigned to business', 409);
    }

    // Create multiple assignments
    await prisma.businessUserSubCategory.createMany({
      data: newSubCategoryIds.map((subCategoryId) => ({
        businessId,
        subCategoryId,
      })),
      skipDuplicates: true,
    });

    // Fetch the inserted records with relations
    const assignments = await prisma.businessUserSubCategory.findMany({
      where: { businessId, subCategoryId: { in: newSubCategoryIds } },
      include: {
        subCategory: {
          include: { category: true },
        },
        business: { select: { id: true, business_name: true } },
      },
    });

    return assignments;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to assign subcategories to business', 500, { originalError: error });
  }
};

export const getUserCategories = async (userId: string) => {
  try {
    const categories = await prisma.individualUserCategory.findMany({
      where: { userId },
      include: {
        category: {
          include: {
            subcategories: true,
          },
        },
      },
    });

    const subCategories = await prisma.individualUserSubCategory.findMany({
      where: { userId },
      include: {
        subCategory: {
          include: {
            category: true,
          },
        },
      },
    });

    return { categories, subCategories };
  } catch (error) {
    throw new AppError('Failed to fetch user categories', 500, { originalError: error });
  }
};

export const getBusinessCategories = async (businessId: string) => {
  try {
    // Get business with its single category
    const business = await prisma.businessUser.findUnique({
      where: { id: businessId },
      include: {
        category: true,
      },
    });

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    // Get business subcategories
    const subCategories = await prisma.businessUserSubCategory.findMany({
      where: { businessId },
      include: {
        subCategory: {
          include: {
            category: true,
          },
        },
      },
    });

    return {
      category: business.category,
      subCategories,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch business categories', 500, { originalError: error });
  }
};

export const removeCategoryFromIndividualUser = async (userId: string, categoryId: string) => {
  try {
    const assignment = await prisma.individualUserCategory.findFirst({
      where: { userId, categoryId },
    });

    if (!assignment) {
      throw new AppError('Category assignment not found', 404);
    }

    return await prisma.individualUserCategory.delete({
      where: { id: assignment.id },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to remove category from user', 500, { originalError: error });
  }
};

export const removeSubCategoryFromIndividualUser = async (
  userId: string,
  subCategoryId: string,
) => {
  try {
    const assignment = await prisma.individualUserSubCategory.findFirst({
      where: { userId, subCategoryId },
    });

    if (!assignment) {
      throw new AppError('SubCategory assignment not found', 404);
    }

    return await prisma.individualUserSubCategory.delete({
      where: { id: assignment.id },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to remove subcategory from user', 500, { originalError: error });
  }
};

export const removeSubCategoryFromBusinessUser = async (
  businessId: string,
  subCategoryId: string,
) => {
  try {
    const assignment = await prisma.businessUserSubCategory.findFirst({
      where: { businessId, subCategoryId },
    });

    if (!assignment) {
      throw new AppError('SubCategory assignment not found', 404);
    }

    return await prisma.businessUserSubCategory.delete({
      where: { id: assignment.id },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to remove subcategory from business', 500, { originalError: error });
  }
};

export const removeCategoryFromBusinessUser = async (businessId: string) => {
  try {
    // Remove the category by setting categoryId to null
    const updatedBusiness = await prisma.businessUser.update({
      where: { id: businessId },
      data: { categoryId: null },
      include: {
        category: true,
      },
    });

    return updatedBusiness;
  } catch (error) {
    throw new AppError('Failed to remove category from business', 500, { originalError: error });
  }
};
