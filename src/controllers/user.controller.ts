import type { Express } from 'express';
import { NextFunction, Request, Response } from 'express';

import { UserService } from '../services/user.service';
import AppError from '../utils/AppError';
import { uploadToS3 } from '../utils/s3';

const userService = new UserService();

export default class UserController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        firebase_token,
        username,
        name,
        user_type,
        mobile_number,
        email,
        address,
        zip_code,
        website,
        about,
        categories,
        subcategories,
        latitude,
        longitude,
        location,
        location_type,
        city,
        state,
        country,
      } = req.body;

      // Files from multipart
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      const logoFile = files?.['logo']?.[0];
      const videoFile = files?.['video']?.[0];
      let logo_url: string | undefined;
      let video_url: string | undefined;

      // temporary key for uploads (random UUID since user id not available yet)
      const tempKey = crypto.randomUUID();

      if (logoFile) {
        logo_url = await uploadToS3(logoFile, 'logo', tempKey);
      }

      if (videoFile) {
        video_url = await uploadToS3(videoFile, 'video', tempKey);
      }

      // Validate username format
      if (username && username.includes(' ')) {
        throw new AppError('Username cannot contain spaces', 400);
      }

      // INDIVIDUAL users must provide mobile number
      if (user_type === 'INDIVIDUAL' && !mobile_number) {
        throw new AppError('Mobile number is required for individual users', 400);
      }

      // BUSINESS users can use mobile OR email (but not both)
      if (user_type === 'BUSINESS') {
        if (mobile_number && email) {
          throw new AppError(
            'Business users can register with either mobile number or email, not both',
            400,
          );
        }
        if (!mobile_number && !email) {
          throw new AppError('Business users must provide either mobile number or email', 400);
        }
      }
      let categoriesParsed = categories;
      let subcategoriesParsed = subcategories;

      if (typeof categories === 'string') {
        try {
          categoriesParsed = JSON.parse(categories);
        } catch {
          categoriesParsed = [categories];
        }
      }
      if (typeof subcategories === 'string') {
        try {
          subcategoriesParsed = JSON.parse(subcategories);
        } catch {
          subcategoriesParsed = [subcategories];
        }
      }

      // Call service to register
      const user = await userService.register({
        firebase_token,
        username,
        name,
        user_type,
        mobile_number,
        email,
        address,
        zip_code,
        website,
        about,
        logo_url,
        video_url,
        categories: categoriesParsed,
        subcategories: subcategoriesParsed,
        latitude,
        longitude,
        location,
        location_type,
        city,
        state,
        country,
      });

      // Return simplified response with only essential fields
      const simplifiedResponse = {
        status: user.status,
        verification_method: user.verification_method,
        message: user.message,
      };

      return res.created(simplifiedResponse, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { firebase_token, mobile_number, email } = req.body;

      // Validate required fields
      if (!mobile_number && !email) {
        throw new AppError('Either mobile_number or email is required for login', 400);
      }

      const result = await userService.login({
        firebase_token,
        mobile_number,
        email,
      });

      let message = 'Login successful';

      // If OTP was sent (email flow)
      if (result?.status === 'OTP_SENT') {
        message = 'OTP sent to your email';
      }
      // If normal login (mobile or already verified)
      else if (result?.data?.user_type === 'BUSINESS') {
        message = 'Business login successful';
      } else if (result?.data?.user_type === 'INDIVIDUAL') {
        message = 'Individual login successful';
      }

      return res.success(result, message);
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

      // Return simplified response with only essential fields
      const simplifiedResponse = {
        id: user.id,
        user_type: user.user_type,
        mobile_number: user.mobile_number,
        email: user.email,
        username: user.username,
        name: user.name,
        status: user.status,
        verification_method: user.verification_method,
        onboarding_step: user.user_type === 'INDIVIDUAL' ? user.onboarding_step : undefined,
        website: user.website,
        about: user.about,
        logo_url: user.logo_url,
        video_url: user.video_url,
        access_token: user.access_token,
        refresh_token: user.refresh_token,
      };

      return res.success(simplifiedResponse, 'OTP verified successfully');
    } catch (error) {
      next(error);
    }
  }

  //* Admin related apis
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
      // Determine if this is a user updating themselves or admin updating any user
      const isAdminUpdate = req.params.id && req.user?.user_type === 'ADMIN';
      const userId = isAdminUpdate ? req.params.id : req.user?.userId;

      if (!userId) {
        return res.fail('User id is required', 400);
      }

      // Security check: Non-admin users can only update their own profile
      if (!isAdminUpdate && req.user?.userId !== userId) {
        return res.fail('You can only update your own profile', 403);
      }

      const allowedFields = [
        'username',
        'name',
        // 'mobile_number', // disabled: updating phone via controller
        // 'email', // disabled: updating email via controller
        'website',
        'about',
        'logo_url',
        'video_url',
      ];

      const payload = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      let updates: Record<string, string | undefined> = {};

      // ✅ Handle file uploads (logo and video)
      // Only support 'logo_url' and 'video_url' field names
      if (files?.logo_url?.length) {
        const logoFile = files.logo_url[0];
        const logoUrl = await uploadToS3(logoFile, 'logo', userId);
        updates.logo_url = logoUrl;
      }

      if (files?.video_url?.length) {
        const videoFile = files.video_url[0];
        const videoUrl = await uploadToS3(videoFile, 'video', userId);
        updates.video_url = videoUrl;
      }

      // ✅ Handle text fields (allow multiple fields except sensitive ones)
      const providedAllowedFields = Object.keys(payload).filter(
        (key) => allowedFields.includes(key) && payload[key] !== undefined,
      );

      // Phone/Email updates are disabled
      // const wantsMobileUpdate = providedAllowedFields.includes('mobile_number');
      // const wantsEmailUpdate = providedAllowedFields.includes('email');
      // if (wantsMobileUpdate && wantsEmailUpdate) {
      //   return res.fail('Please update only one of email or mobile_number at a time', 400);
      // }
      // if (wantsMobileUpdate || wantsEmailUpdate) {
      //   return res.fail('Phone/Email change flow is currently disabled', 400);
      // }

      // Non-sensitive fields: allow multiple updates in one go (phone/email excluded by allowedFields)
      for (const key of providedAllowedFields) {
        if (key === 'username') {
          const value = payload[key];
          if (typeof value === 'string' && value.includes(' ')) {
            throw new AppError('Username cannot contain spaces', 400);
          }
        }
        updates[key] = payload[key];
      }

      // 🚀 If still no updates (neither files nor text fields), return fail
      if (Object.keys(updates).length === 0) {
        return res.fail('No valid updates provided', 400);
      }

      // ✅ Save updates
      const user = await userService.update(userId, updates);
      return res.success({ user }, 'User updated successfully');
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
      // Check if user is authenticated and is an admin
      if (!req.user?.userId) {
        return res.fail('Authentication required', 401);
      }

      if (req.user.user_type !== 'ADMIN') {
        return res.fail('Admin access required', 403);
      }

      const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
      const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '20', 10), 1), 100);

      const { users, total } = await userService.findAllPaginated(page, limit);
      const totalPages = Math.ceil(total / limit) || 1;

      return res.success(
        {
          users,
          pagination: {
            page,
            limit,
            total,
            total_pages: totalPages,
            has_next_page: page < totalPages,
            has_prev_page: page > 1,
          },
        },
        'Users fetched successfully',
      );
    } catch (error) {
      next(error);
    }
  }

  //* Refresh Token
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        throw new AppError('Refresh token is required', 400);
      }

      const result = await userService.refreshToken(refresh_token);

      return res.success(result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  //* Logout
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User ID not found in request', 400);
      }

      const result = await userService.logout(userId);

      return res.success(result, 'User logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  static async checkUsername(req: Request, res: Response, next: NextFunction) {
    try {
      const { username } = req.body;

      if (!username || typeof username !== 'string') {
        throw new AppError('Username is required and must be a string', 400);
      }

      const exists = await userService.usernameExists(username);

      return res.success(
        {
          username,
          available: !exists,
        },
        exists ? 'Username is already taken' : 'Username is available',
      );
    } catch (error) {
      next(error);
    }
  }

  static async getBusinessById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.fail('User id is required', 400);
      }
      const business = await userService.findBusinessById(id);
      return res.success({ business }, 'Business fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  // Phone/Email change verification endpoint disabled
  // static async verifyUpdateOtp(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     return res.fail('Phone/Email change flow is currently disabled', 400);
  //   } catch (error) {
  //     next(error);
  //   }
  // }
}
