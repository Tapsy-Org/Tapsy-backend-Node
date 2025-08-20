import prisma from '../config/db';
import AppError from '../utils/AppError';

export class UserCategoryService {
  // Helper method to clean user response based on user type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cleanUserResponse(user: any) {
    if (user.user_type === 'INDIVIDUAL') {
      // For individual users, exclude business-specific fields that are null
      /* eslint-disable @typescript-eslint/no-unused-vars */
      const { address, zip_code, website, about, logo_url, video_urls, ...cleanUser } = user;
      /* eslint-enable @typescript-eslint/no-unused-vars */

      // Only include business fields if they have values
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = cleanUser;
      if (video_urls && video_urls.length > 0) result.video_urls = video_urls;

      return result;
    }

    // For business users, return all fields
    return user;
  }

  // Add categories to an INDIVIDUAL user
  async addUserCategories(userId: string, categoryIds: string[], subcategories?: string[]) {
    try {
      // Verify user exists and is INDIVIDUAL
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.user_type !== 'INDIVIDUAL') {
        throw new AppError('This endpoint is only for individual users', 400);
      }

      // Validate that categories exist
      const existingCategories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
      });

      if (existingCategories.length !== categoryIds.length) {
        throw new AppError('One or more category IDs are invalid', 400);
      }

      // Check for existing category assignments to avoid duplicates
      const existingAssignments = await prisma.userCategory.findMany({
        where: {
          userId,
          categoryId: { in: categoryIds },
        },
      });

      const existingCategoryIds = existingAssignments.map((assignment) => assignment.categoryId);
      const newCategoryIds = categoryIds.filter((id) => !existingCategoryIds.includes(id));

      if (newCategoryIds.length === 0) {
        throw new AppError('All categories are already assigned to this user', 400);
      }

      // Create new category assignments with subcategories
      const userCategoryData = newCategoryIds.map((categoryId) => ({
        userId,
        categoryId,
        subcategories: subcategories || [],
        user_type: user.user_type,
      }));

      await prisma.userCategory.createMany({
        data: userCategoryData,
      });

      // Return updated user with categories
      return await this.cleanUserResponse(
        await prisma.user.findUnique({
          where: { id: userId },
          include: {
            categories: { include: { category: true } },
          },
        }),
      );
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add user categories', 500, { originalError: error });
    }
  }

  // Add categories and subcategories to an INDIVIDUAL user (single API)
  async addUserCategoriesAndSubcategories(
    userId: string,
    categoriesWithSubcategories: Array<{ categoryId: string; subcategories: string[] }>,
  ) {
    try {
      // Verify user exists and is INDIVIDUAL
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.user_type !== 'INDIVIDUAL') {
        throw new AppError('This endpoint is only for individual users', 400);
      }

      const categoryIds = categoriesWithSubcategories.map((item) => item.categoryId);

      // Validate that categories exist
      const existingCategories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
      });

      if (existingCategories.length !== categoryIds.length) {
        throw new AppError('One or more category IDs are invalid', 400);
      }

      // Check for existing category assignments to avoid duplicates
      const existingAssignments = await prisma.userCategory.findMany({
        where: {
          userId,
          categoryId: { in: categoryIds },
        },
      });

      const existingCategoryIds = existingAssignments.map((assignment) => assignment.categoryId);
      const newCategories = categoriesWithSubcategories.filter(
        (item) => !existingCategoryIds.includes(item.categoryId),
      );

      if (newCategories.length === 0) {
        throw new AppError('All categories are already assigned to this user', 400);
      }

      // Create new category assignments with their respective subcategories
      const userCategoryData = newCategories.map((item) => ({
        userId,
        categoryId: item.categoryId,
        subcategories: item.subcategories,
        user_type: user.user_type,
      }));

      await prisma.userCategory.createMany({
        data: userCategoryData,
      });

      // Return updated user with categories
      return await this.cleanUserResponse(
        await prisma.user.findUnique({
          where: { id: userId },
          include: {
            categories: { include: { category: true } },
          },
        }),
      );
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add user categories and subcategories', 500, {
        originalError: error,
      });
    }
  }

  // Update subcategories for a specific category of an INDIVIDUAL user
  async updateUserCategorySubcategories(
    userId: string,
    categoryId: string,
    subcategories: string[],
  ) {
    try {
      // Verify user exists and is INDIVIDUAL
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.user_type !== 'INDIVIDUAL') {
        throw new AppError('This endpoint is only for individual users', 400);
      }

      // Check if user has this category assigned
      const userCategory = await prisma.userCategory.findUnique({
        where: {
          userId_categoryId: {
            userId,
            categoryId,
          },
        },
      });

      if (!userCategory) {
        throw new AppError('Category is not assigned to this user', 400);
      }

      // Update subcategories for this specific category
      await prisma.userCategory.update({
        where: {
          userId_categoryId: {
            userId,
            categoryId,
          },
        },
        data: {
          subcategories: subcategories,
        },
      });

      // Return updated user with categories
      return await this.cleanUserResponse(
        await prisma.user.findUnique({
          where: { id: userId },
          include: {
            categories: { include: { category: true } },
          },
        }),
      );
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update user category subcategories', 500, {
        originalError: error,
      });
    }
  }

  // Remove a category from an INDIVIDUAL user
  async removeCategoryFromUser(userId: string, categoryId: string) {
    try {
      // Verify user exists and is INDIVIDUAL
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.user_type !== 'INDIVIDUAL') {
        throw new AppError('This operation is only for individual users', 400);
      }

      // Check if user has this category assigned
      const userCategory = await prisma.userCategory.findUnique({
        where: {
          userId_categoryId: {
            userId,
            categoryId,
          },
        },
      });

      if (!userCategory) {
        throw new AppError('Category is not assigned to this user', 400);
      }

      // Remove the category assignment
      await prisma.userCategory.delete({
        where: {
          userId_categoryId: {
            userId,
            categoryId,
          },
        },
      });

      // Return updated user
      return await this.cleanUserResponse(
        await prisma.user.findUnique({
          where: { id: userId },
          include: {
            categories: { include: { category: true } },
          },
        }),
      );
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to remove category from user', 500, { originalError: error });
    }
  }

  // Get user categories by user ID
  async getUserCategories(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          categories: { include: { category: true } },
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return {
        categories: user.categories || [],
        // Note: In the current schema, there's no direct category relation on User
        // Business users also use UserCategory relationships
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get user categories', 500, { originalError: error });
    }
  }
}
