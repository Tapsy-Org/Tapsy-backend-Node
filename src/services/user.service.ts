import type { Prisma, UserType } from '@prisma/client';
import bcryptjs from 'bcryptjs';

import prisma from '../config/db';
import AppError from '../utils/AppError';
import { sendOtpEmail } from '../utils/mailer';
import { sendOtpSms } from '../utils/sms';
import AuthTokens from '../utils/token';

export class UserService {
  // Helper method to clean user response based on user type
  private cleanUserResponse(user: Record<string, unknown>) {
    if (user.user_type === 'INDIVIDUAL') {
      // For individual users, exclude business-specific fields that are null
      const {
        email: _email,
        otp: _otp,
        otp_expiry: _otpExpiry,
        address: _address,
        zip_code: _zipCode,
        website: _website,
        about: _about,
        logo_url: _logoUrl,
        video_url: _videoUrl,
        categories: _categories,
        ...cleanUser
      } = user;
      return cleanUser;
    }
    return user;
  }

  async create(data: Prisma.UserCreateInput) {
    try {
      // Validate required fields based on user type - removed business_name check
      // since it doesn't exist in schema

      // Validate contact information
      if (!data.mobile_number && !data.email) {
        throw new AppError('Either mobile number or email is required', 400);
      }

      // Check for existing user with the same mobile or email
      if (data.mobile_number) {
        const existingUser = await prisma.user.findUnique({
          where: { mobile_number: data.mobile_number },
        });
        if (existingUser) {
          throw new AppError('User with this mobile number already exists', 409);
        }
      }

      if (data.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: data.email },
        });
        if (existingUser) {
          throw new AppError('User with this email already exists', 409);
        }
      }

      const user = await prisma.user.create({
        data: {
          ...data,
          video_url: data.video_url,
        },
        include: {
          categories: {
            // Fixed: changed from category
            include: { category: true },
          },
        },
      });

      return this.cleanUserResponse(user);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create user', 500, { originalError: error });
    }
  }

  async register(data: {
    firebase_token?: string;
    username: string;
    name?: string;
    user_type?: UserType;
    mobile_number?: string;
    email?: string;

    website?: string;
    about?: string;
    logo_url?: string;
    video_url?: string;
    categories?: string[];
    subcategories?: string[];
    address?: string;
    zip_code?: string;
    latitude?: number | string; // allow both
    longitude?: number | string;
    location?: string;
    location_type?: 'HOME' | 'WORK' | 'OTHER';
    city?: string;
    state?: string;
    country?: string;
  }) {
    try {
      if (!data.username) throw new AppError('Username is required', 400);

      // Check for existing username
      const existingUserByUsername = await prisma.user.findFirst({
        where: { username: data.username },
      });
      if (existingUserByUsername) {
        throw new AppError('Username already exists', 409);
      }

      // Check for existing email if provided
      if (data.email) {
        const existingUserByEmail = await prisma.user.findUnique({
          where: { email: data.email },
        });
        if (existingUserByEmail) {
          throw new AppError('Email already exists', 409);
        }
      }

      // Check for existing mobile number if provided
      if (data.mobile_number) {
        const existingUserByMobile = await prisma.user.findUnique({
          where: { mobile_number: data.mobile_number },
        });
        if (existingUserByMobile) {
          throw new AppError('Mobile number already exists', 409);
        }
      }

      let userData: Prisma.UserCreateInput = {
        user_type: data.user_type || 'INDIVIDUAL',
        username: data.username,
        name: data.name,
        status: 'PENDING',
        verification_method: 'MOBILE',
      };

      if (data.user_type === 'INDIVIDUAL') {
        if (!data.mobile_number) {
          throw new AppError('Mobile number is required for individual users', 400);
        }

        userData.mobile_number = data.mobile_number;
        userData.firebase_token = data.firebase_token;
        userData.otp_verified = false;
        userData.verification_method = 'MOBILE';
        userData.status = 'PENDING';

        // Generate OTP and send SMS
        // const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otp = '699420'; // Static OTP for testing - TODO: Replace with dynamic generation when Twilio is fixed
        const hashedOtp = await bcryptjs.hash(otp, 10);
        userData.otp = hashedOtp;
        userData.otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        await sendOtpSms(data.mobile_number, otp);
      }
      // BUSINESS USERS: can use mobile or email (not both)
      else {
        if (!data.address) throw new AppError('Address is required for business users', 400);
        if (!data.zip_code) throw new AppError('Zip code is required for business users', 400);
        if (!data.about) throw new AppError('About is required for business users', 400);
        if (!data.logo_url) throw new AppError('Logo URL is required for business users', 400);

        // Validate that only one contact method is provided
        if (data.mobile_number && data.email) {
          throw new AppError(
            'Business users can register with either mobile number or email, not both',
            400,
          );
        }
        if (!data.mobile_number && !data.email) {
          throw new AppError('Business users must provide either mobile number or email', 400);
        }

        // MOBILE verification for business
        if (data.mobile_number) {
          userData.mobile_number = data.mobile_number;
          userData.firebase_token = data.firebase_token;
          userData.otp_verified = false;
          userData.verification_method = 'MOBILE';
          userData.status = 'PENDING';

          // Generate OTP and send SMS
          // const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const otp = '699420'; // Static OTP for testing - TODO: Replace with dynamic generation when Twilio is fixed
          const hashedOtp = await bcryptjs.hash(otp, 10);
          userData.otp = hashedOtp;
          userData.otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
          await sendOtpSms(data.mobile_number, otp);
        }
        // EMAIL verification for business
        else if (data.email) {
          userData.email = data.email;
          userData.otp_verified = false;
          userData.verification_method = 'EMAIL';
          userData.status = 'PENDING';

          // Generate OTP and send email
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const hashedOtp = await bcryptjs.hash(otp, 10);
          userData.otp = hashedOtp;
          userData.otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
          await sendOtpEmail(data.email, otp);
        }

        userData.website = data.website;
        userData.about = data.about;
        userData.logo_url = data.logo_url;
        userData.video_url = data.video_url;
      }

      // CREATE USER
      let user;
      if (data.user_type === 'BUSINESS') {
        const categoryId = data.categories?.[0];
        user = await this.createBusinessUserWithCategories(
          userData,
          categoryId,
          data.subcategories,
        );
      } else {
        user = await this.create(userData);
      }
      if (
        data.address ||
        data.zip_code ||
        data.latitude ||
        data.longitude ||
        data.location ||
        data.location_type ||
        data.city ||
        data.state ||
        data.country
      ) {
        const createdUser = user as { id: string; user_type: UserType };
        await prisma.location.create({
          data: {
            userId: createdUser.id,
            address: data.address || null,
            zip_code: data.zip_code || null,
            latitude: data.latitude ? parseFloat(data.latitude as string) : 0,
            longitude: data.longitude ? parseFloat(data.longitude as string) : 0,
            location: data.location || '',
            location_type: data.location_type || 'OTHER',
            city: data.city || null,
            state: data.state || null,
            country: data.country || null,
          },
        });
      }
      // Return user without tokens (OTP verification required)
      return {
        ...this.cleanUserResponse(user),
        message:
          userData.verification_method === 'EMAIL'
            ? 'Registration successful. Please check your email for OTP verification.'
            : 'Registration successful. Please check your SMS for OTP verification.',
        status: 'OTP_SENT',
        verification_method: userData.verification_method,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to register user', 500, { originalError: error });
    }
  }

  async login(data: { firebase_token?: string; mobile_number?: string; email?: string }) {
    try {
      let user = null;

      // 1. Try login with email
      if (data.email) {
        user = await prisma.user.findUnique({
          where: { email: data.email },
        });
      }

      // 2. Try login with mobile number
      if (!user && data.mobile_number) {
        user = await prisma.user.findUnique({
          where: { mobile_number: data.mobile_number },
        });
      }

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.status === 'DELETED') {
        throw new AppError('User account has been deleted', 403);
      }

      // Generate OTP for login verification
      // const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otp = '699420'; // Static OTP for testing - TODO: Replace with dynamic generation when Twilio is fixed
      const hashedOtp = await bcryptjs.hash(otp, 10);
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          otp: hashedOtp,
          otp_expiry: otpExpiry,
          otp_verified: false,
          firebase_token: data.firebase_token, // Update firebase token for push notifications
        },
      });

      // Send OTP based on verification method
      if (user.verification_method === 'EMAIL' && data.email) {
        await sendOtpEmail(data.email, otp);
        return {
          status: 'OTP_SENT',
          message: 'OTP has been sent to your email',
          data: {
            user_id: user.id,
            user_type: user.user_type,
            verification_method: 'EMAIL',
          },
        };
      } else if (user.verification_method === 'MOBILE' && data.mobile_number) {
        await sendOtpSms(data.mobile_number, otp);
        return {
          status: 'OTP_SENT',
          message: 'OTP has been sent to your mobile number',
          data: {
            user_id: user.id,
            user_type: user.user_type,
            verification_method: 'MOBILE',
          },
        };
      }

      throw new AppError('Invalid contact method for user verification', 400);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to login user', 500, { originalError: error });
    }
  }

  async sendOtp(data: { email?: string; mobile_number?: string }) {
    try {
      if (!data.email && !data.mobile_number) {
        throw new AppError('Either email or mobile number is required', 400);
      }

      let user = null;

      // Find user by email or mobile number
      if (data.email) {
        user = await prisma.user.findUnique({
          where: { email: data.email },
        });
      } else if (data.mobile_number) {
        user = await prisma.user.findUnique({
          where: { mobile_number: data.mobile_number },
        });
      }

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Generate OTP
      // const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otp = '699420'; // Static OTP for testing - TODO: Replace with dynamic generation when Twilio is fixed
      const hashedOtp = await bcryptjs.hash(otp, 10);
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      // Update user with OTP
      await prisma.user.update({
        where: { id: user.id },
        data: { otp: hashedOtp, otp_expiry: otpExpiry },
      });

      // Send OTP
      if (data.email) {
        await sendOtpEmail(data.email, otp);
        return { message: 'OTP sent to email successfully', otp_expiry: otpExpiry };
      } else if (data.mobile_number) {
        await sendOtpSms(data.mobile_number, otp);
        return { message: 'OTP sent to mobile number successfully', otp_expiry: otpExpiry };
      }

      throw new AppError('Failed to send OTP', 500);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to send OTP', 500, { originalError: error });
    }
  }

  async verifyOtp(data: { email?: string; mobile_number?: string; otp: string }) {
    try {
      if (!data.email && !data.mobile_number) {
        throw new AppError('Either email or mobile number is required', 400);
      }

      let user = null;

      if (data.email) {
        user = await prisma.user.findUnique({
          where: { email: data.email },
          include: {
            categories: { include: { category: true } },
          },
        });
      }

      if (!user && data.mobile_number) {
        user = await prisma.user.findUnique({
          where: { mobile_number: data.mobile_number },
          include: {
            categories: { include: { category: true } },
          },
        });
      }

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.otp || !user.otp_expiry) {
        throw new AppError('No OTP found for this user', 400);
      }

      const isOtpValid = await bcryptjs.compare(data.otp, user.otp);
      if (!isOtpValid) {
        throw new AppError('Invalid OTP', 400);
      }

      if (new Date() > user.otp_expiry) {
        throw new AppError('OTP has expired', 400);
      }

      const updateData: Prisma.UserUpdateInput = {
        otp_verified: true,
        otp: null,
        otp_expiry: null,
      };

      if (user.status === 'PENDING') {
        updateData.status = 'ACTIVE';
      } else if (user.status === 'ACTIVE') {
        updateData.last_login = new Date();
      } else {
        throw new AppError(`User account is ${user.status}`, 403);
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
        include: { categories: { include: { category: true } } },
      });
      // Generate both access and refresh tokens
      const tokens = await AuthTokens.generateAccessAndRefreshToken({
        id: updatedUser.id,
        role: updatedUser.user_type,
      });
      // Note: Only refresh token is stored in DB, access token is not stored

      return this.cleanUserResponse({
        ...updatedUser,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to verify OTP', 500, { originalError: error });
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = AuthTokens.verifyRefreshToken(refreshToken);

      if (typeof decoded === 'string') {
        throw new AppError('Invalid refresh token format', 401);
      }

      const user = await prisma.user.findFirst({
        where: {
          id: decoded.id,
          refresh_token: refreshToken,
          status: 'ACTIVE',
        },
      });

      if (!user) {
        throw new AppError('Invalid refresh token or user not found', 401);
      }

      const { accessToken, refreshToken: newRefreshToken } =
        await AuthTokens.generateAccessAndRefreshToken({
          id: user.id,
          role: user.user_type,
        });

      await prisma.user.update({
        where: { id: user.id },
        data: { refresh_token: newRefreshToken },
      });

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to refresh token', 401, { originalError: error });
    }
  }

  //* Logout Method
  async logout(userId: string) {
    try {
      await AuthTokens.revokeRefreshToken(userId);
      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new AppError('Failed to logout', 500, { originalError: error });
    }
  }

  //* Admin methods
  async findById(id: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          categories: { include: { category: true } },
          locations: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return this.cleanUserResponse(user);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to find user', 500, { originalError: error });
    }
  }
  async findAll() {
    try {
      return await prisma.user.findMany({
        include: {
          categories: { include: { category: true } },
        },
      });
    } catch (error) {
      throw new AppError('Failed to fetch all users', 500, { originalError: error });
    }
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        throw new AppError('User not found', 404);
      }

      // Validate contact uniqueness if being updated
      if (
        data.mobile_number &&
        typeof data.mobile_number === 'string' &&
        data.mobile_number !== existingUser.mobile_number
      ) {
        const userWithMobile = await prisma.user.findUnique({
          where: { mobile_number: data.mobile_number },
        });
        if (userWithMobile) {
          throw new AppError('Mobile number already in use', 409);
        }
      }

      if (data.email && typeof data.email === 'string' && data.email !== existingUser.email) {
        const userWithEmail = await prisma.user.findUnique({
          where: { email: data.email },
        });
        if (userWithEmail) {
          throw new AppError('Email already in use', 409);
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data,
        include: {
          categories: { include: { category: true } },
        },
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update user', 500, { originalError: error });
    }
  }

  async softDelete(id: string) {
    try {
      return await this.update(id, { status: 'DELETED' });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to deactivate user', 500, { originalError: error });
    }
  }

  async restore(id: string) {
    try {
      return await this.update(id, { status: 'ACTIVE' });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to restore user', 500, { originalError: error });
    }
  }

  async getUsersByType(userType: UserType) {
    try {
      return await prisma.user.findMany({
        where: { user_type: userType },
        include: {
          categories: { include: { category: true } },
        },
      });
    } catch (error) {
      throw new AppError('Failed to fetch users by type', 500, { originalError: error });
    }
  }

  // Business user creation with category and subcategories in User table
  async createBusinessUserWithCategories(
    userData: Prisma.UserCreateInput,
    categoryId?: string,
    subcategories?: string[],
  ) {
    try {
      // Validate that category exists if provided
      if (categoryId) {
        const existingCategory = await prisma.category.findUnique({
          where: { id: categoryId },
        });

        if (!existingCategory) {
          throw new AppError('Category ID is invalid', 400);
        }

        // For business users, create a UserCategory relationship
        userData.categories = {
          create: {
            categoryId: categoryId,
            subcategories: subcategories || [],
            user_type: userData.user_type,
          },
        };
      }

      // Create the user with category and subcategories
      const user = await prisma.user.create({
        data: {
          ...userData,
          video_url: userData.video_url,
        },
        include: {
          categories: { include: { category: true } },
        },
      });

      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create business user with categories', 500, {
        originalError: error,
      });
    }
  }
}
