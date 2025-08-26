import type { Prisma, UserType } from '@prisma/client';
import bcryptjs from 'bcryptjs';

import prisma from '../config/db';
import admin from '../config/firebase';
import AppError from '../utils/AppError';
import { sendOtpEmail } from '../utils/mailer';
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
        categories: _categories, // Fixed: changed from category
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
    idToken?: string;
    firebase_token?: string;
    device_id: string;
    username: string;
    user_type?: UserType;
    mobile_number?: string;
    email?: string;
    address?: string;
    zip_code?: string;
    website?: string;
    about?: string;
    logo_url?: string;
    video_url?: string;
    categories?: string[];
    subcategories?: string[];
  }) {
    try {
      if (!data.device_id) throw new AppError('Device ID is required', 400);
      if (!data.username) throw new AppError('Username is required', 400);

      let userData: Prisma.UserCreateInput = {
        user_type: data.user_type || 'INDIVIDUAL',
        device_id: data.device_id,
        username: data.username,
        status: 'ACTIVE',
        verification_method: 'MOBILE',
      };

      if (data.user_type === 'INDIVIDUAL') {
        if (!data.idToken || !data.firebase_token) {
          throw new AppError('idToken and firebase_token are required for individual users', 400);
        }

        const decodedToken = await admin.auth().verifyIdToken(data.idToken);
        const mobileFromToken = decodedToken.phone_number;
        if (!mobileFromToken) throw new AppError('Phone number not found in Firebase token', 400);

        userData.mobile_number = mobileFromToken;
        userData.firebase_token = data.firebase_token;
        userData.otp_verified = true;
        userData.verification_method = 'MOBILE';
        userData.status = 'ACTIVE';
      }
      // BUSINESS USERS: can use mobile or email
      else {
        if (!data.address) throw new AppError('Address is required', 400);
        if (!data.zip_code) throw new AppError('Zip code is required', 400);
        if (!data.about) throw new AppError('About is required', 400);
        if (!data.logo_url) throw new AppError('Logo URL is required', 400);

        let mobileFromToken: string | undefined;

        // MOBILE verification for business: idToken + firebase_token required
        if (data.idToken && data.firebase_token) {
          const decodedToken = await admin.auth().verifyIdToken(data.idToken);
          mobileFromToken = decodedToken.phone_number;

          if (!mobileFromToken) {
            throw new AppError('Phone number not found in Firebase token', 400);
          }

          userData.mobile_number = mobileFromToken;
          userData.firebase_token = data.firebase_token;
          userData.otp_verified = true;
          userData.verification_method = 'MOBILE';
          userData.status = 'ACTIVE';
        }
        // EMAIL verification for business: no Firebase needed
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
        } else {
          throw new AppError('Business user must register with mobile (Firebase) or email', 400);
        }

        userData.address = data.address;
        userData.zip_code = data.zip_code;
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

      // GENERATE TOKENS ONLY IF VERIFIED
      let tokens = null;
      if (userData.otp_verified) {
        // Cast user to proper type for token generation
        const userWithId = user as { id: string; user_type: UserType };
        tokens = await AuthTokens.generateAccessAndRefreshToken({
          id: userWithId.id,
          role: userWithId.user_type,
        });
        // Note: Only refresh token is stored in DB, access token is not stored
      }

      return this.cleanUserResponse({
        ...user,
        access_token: tokens?.accessToken || null,
        refresh_token: tokens?.refreshToken || null,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to register user', 500, { originalError: error });
    }
  }

  async login(data: {
    idToken?: string;
    firebase_token?: string;
    device_id?: string;
    email?: string;
  }) {
    try {
      let user = null;
      let mobileFromToken: string | null = null;

      // 1. Try login with email
      if (data.email) {
        user = await prisma.user.findUnique({
          where: { email: data.email },
        });
      }

      // 2. If not found, try Firebase token (mobile login)
      if (!user && data.idToken) {
        const decodedToken = await admin.auth().verifyIdToken(data.idToken);
        mobileFromToken = decodedToken.phone_number ?? null;

        if (!mobileFromToken) {
          throw new AppError('Phone number not found in Firebase token', 400);
        }

        user = await prisma.user.findUnique({
          where: { mobile_number: mobileFromToken },
        });
      }

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.status !== 'ACTIVE') {
        throw new AppError(
          'User account is not active. Please register and verify your account first',
          403,
        );
      }

      // 3. Handle EMAIL verification flow
      if (user.verification_method === 'EMAIL') {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcryptjs.hash(otp, 10);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            otp: hashedOtp,
            otp_expiry: otpExpiry,
            otp_verified: false,
          },
        });

        // Send OTP to email
        if (data.email) {
          await sendOtpEmail(data.email, otp);
        }

        // 👉 Return minimal response
        return {
          status: 'OTP_SENT',
          message: 'OTP has been sent to your email',
          data: {
            user_type: user.user_type,
          },
        };
      }

      // 4. Handle MOBILE (Firebase verified login)
      if (user.verification_method === 'MOBILE') {
        if (!data.idToken) {
          throw new AppError('idToken is required for mobile login', 400);
        }
        if (mobileFromToken !== user.mobile_number) {
          throw new AppError('Invalid Firebase token: mobile mismatch', 401);
        }

        // Generate tokens
        const payload = { id: user.id, role: user.user_type };
        const { accessToken, refreshToken } =
          await AuthTokens.generateAccessAndRefreshToken(payload);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            firebase_token: data.firebase_token,
            device_id: data.device_id,
            last_login: new Date(),
            refresh_token: refreshToken,
          },
        });

        return {
          status: 'SUCCESS',
          message: 'Login successful',
          data: {
            userId: user.id,
            mobile_number: user.mobile_number,
            access_token: accessToken,
            refresh_token: refreshToken,
          },
        };
      }

      throw new AppError('Invalid verification method', 400);
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

      if (data.email) {
        // Generate OTP and send email
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const status = 'PENDING';
        const hashedOtp = await bcryptjs.hash(otp, 10);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (!user) {
          throw new AppError('User not found', 404);
        }

        // Update user with OTP
        await prisma.user.update({
          where: { id: user.id },
          data: { otp: hashedOtp, otp_expiry: otpExpiry, status },
        });

        await sendOtpEmail(data.email, otp);
        return { message: 'OTP sent successfully', otp_expiry: otpExpiry };
      }

      // For mobile_number, we would need Firebase SMS integration
      throw new AppError('SMS OTP not implemented yet', 501);
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
        // 👉 Just activate, no last_login update
        updateData.status = 'ACTIVE';
      } else if (user.status === 'ACTIVE') {
        // 👉 Only update last_login
        updateData.last_login = new Date();
      } else {
        // 👉 Block other statuses
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

  //* Refresh Token Method
  async refreshToken(refreshToken: string) {
    try {
      // 1. Verify the refresh token
      const decoded = AuthTokens.verifyRefreshToken(refreshToken);

      if (typeof decoded === 'string') {
        throw new AppError('Invalid refresh token format', 401);
      }

      // 2. Find user with this refresh token
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

      // 3. Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } =
        await AuthTokens.generateAccessAndRefreshToken({
          id: user.id,
          role: user.user_type,
        });

      // 4. Save new refresh token in DB (invalidate old one)
      await prisma.user.update({
        where: { id: user.id },
        data: { refresh_token: newRefreshToken },
      });

      // 5. Return updated tokens
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
