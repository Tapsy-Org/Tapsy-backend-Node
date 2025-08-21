import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { UserService } from '../services/user.service';
import { UserCategoryService } from '../services/userCategory.service';
import AppError from '../utils/AppError';

const userService = new UserService();
const userCategoryService = new UserCategoryService();

export default class UserController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        idToken,
        firebase_token,
        device_id,
        username,
        user_type,
        mobile_number,
        email,
        address,
        zip_code,
        website,
        about,
        logo_url,
        video_urls,
        categories,
        subcategories,
      } = req.body;

      // INDIVIDUAL users must provide Firebase tokens
      if (user_type === 'INDIVIDUAL' && (!idToken || !firebase_token)) {
        throw new AppError('idToken and firebase_token are required for individual users', 400);
      }

      // BUSINESS users can use mobile (need Firebase tokens) or email (no tokens required)
      if (user_type === 'BUSINESS' && !((idToken && firebase_token) || email)) {
        throw new AppError(
          'Business users must provide mobile (with Firebase tokens) or email',
          400,
        );
      }

      // Validate arrays for business users
      if (categories && !Array.isArray(categories)) {
        throw new AppError('Categories must be an array', 400);
      }
      if (categories && categories.length > 1) {
        throw new AppError('Business users can only have one category', 400);
      }
      if (subcategories && !Array.isArray(subcategories)) {
        throw new AppError('Subcategories must be an array', 400);
      }
      if (video_urls && !Array.isArray(video_urls)) {
        throw new AppError('Video URLs must be an array', 400);
      }

      // Call service to register
      const user = await userService.register({
        idToken,
        firebase_token,
        device_id,
        username,
        user_type,
        mobile_number,
        email,
        address,
        zip_code,
        website,
        about,
        logo_url,
        video_urls,
        categories,
        subcategories,
      });

      return res.created({ user }, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken, firebase_token, device_id, mobile_number, email, otp } = req.body;

      // Validate required fields
      if (!idToken && !mobile_number && !email) {
        throw new AppError('Either idToken, mobile_number, or email is required for login', 400);
      }

      const user = await userService.login({
        idToken,
        firebase_token,
        device_id,
        mobile_number,
        email,
        otp, // ✅ pass OTP for business users
      });

      // Generate JWT token
      const accessToken = jwt.sign(
        {
          userId: user.id,
          mobile_number: user.mobile_number,
          email: user.email,
          user_type: user.user_type,
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' },
      );

      let message = 'Login successful';
      if (user.user_type === 'BUSINESS') {
        message = 'Business login successful';
      } else if (user.user_type === 'INDIVIDUAL') {
        message = 'Individual login successful';
      }

      return res.success({ user, accessToken }, message);
    } catch (error) {
      next(error);
    }
  }
  static async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, mobile_number } = req.body;

      if (!email && !mobile_number) {
        throw new AppError('Email or mobile number is required to send OTP', 400);
      }

      const otp = await userService.sendOtp({ email, mobile_number });

      return res.success({ otp }, 'OTP sent successfully');
      // ⚠️ in prod don’t return OTP in response
    } catch (error) {
      next(error);
    }
  }
  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, mobile_number, otp } = req.body;

      const user = await userService.verifyOtp({ email, mobile_number, otp });

      if (!user) {
        throw new AppError('Invalid or expired OTP', 400);
      }

      return res.success(user, 'OTP verified successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.fail('User id is required', 400);
      }
      const user = await userService.findById(id);
      return res.success({ user }, 'User fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.fail('User id is required', 400);
      }

      const allowedFields = [
        'username',
        'mobile_number',
        'email',
        'firebase_token',
        'otp_verified',
        'device_id',
        'status',
        'last_login',
        // Removed business_name, bio, tags since they don't exist in schema
        'address',
        'zip_code',
        'website',
        'about',
        'logo_url',
        'video_urls',
      ];

      const payload = req.body;
      const data = Object.keys(payload)
        .filter((key) => allowedFields.includes(key))
        .reduce((acc: Record<string, unknown>, key) => {
          if (payload[key] !== undefined) {
            acc[key] = payload[key];
          }
          return acc;
        }, {});

      if (Object.keys(data).length === 0) {
        return res.fail('No updatable fields provided', 400);
      }

      const user = await userService.update(id, data);
      return res.success({ user }, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async verifyUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { verification_method } = req.body;

      if (!id) {
        return res.fail('User id is required', 400);
      }

      if (!verification_method || !['MOBILE', 'EMAIL'].includes(verification_method)) {
        return res.fail('Valid verification_method (MOBILE or EMAIL) is required', 400);
      }

      const user = await userService.verifyUser(id, verification_method);
      return res.success({ user }, 'User verified successfully');
    } catch (error) {
      next(error);
    }
  }

  static async softDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.fail('User id is required', 400);
      }
      const user = await userService.softDelete(id);
      return res.success({ user }, 'User deactivated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.fail('User id is required', 400);
      }
      const user = await userService.restore(id);
      return res.success({ user }, 'User restored successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getUsersByType(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_type } = req.params;

      if (!user_type || !['INDIVIDUAL', 'BUSINESS'].includes(user_type)) {
        return res.fail('Valid user_type (INDIVIDUAL or BUSINESS) is required', 400);
      }

      const users = await userService.getUsersByType(user_type as 'INDIVIDUAL' | 'BUSINESS');
      return res.success({ users }, `${user_type} users fetched successfully`);
    } catch (error) {
      next(error);
    }
  }
  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.findAll();
      return res.success({ users }, 'All users fetched successfully');
    } catch (error) {
      next(error);
    }
  }
  static async addUserCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { categories, subcategories } = req.body;

      if (!userId) {
        return res.fail('User ID is required', 400);
      }

      if (!categories || !Array.isArray(categories) || categories.length === 0) {
        return res.fail('Categories array is required and cannot be empty', 400);
      }

      if (subcategories && !Array.isArray(subcategories)) {
        return res.fail('Subcategories must be an array', 400);
      }

      const user = await userCategoryService.addUserCategories(userId, categories, subcategories);
      return res.success({ user }, 'Categories added successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateUserCategorySubcategories(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, categoryId } = req.params;
      const { subcategories } = req.body;

      if (!userId) {
        return res.fail('User ID is required', 400);
      }

      if (!categoryId) {
        return res.fail('Category ID is required', 400);
      }

      if (!subcategories || !Array.isArray(subcategories) || subcategories.length === 0) {
        return res.fail('Subcategories array is required and cannot be empty', 400);
      }

      const user = await userCategoryService.updateUserCategorySubcategories(
        userId,
        categoryId,
        subcategories,
      );
      return res.success({ user }, 'Category subcategories updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
