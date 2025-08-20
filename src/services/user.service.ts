import type { Prisma, UserType, VerificationMethod } from '@prisma/client';
import jwt from 'jsonwebtoken';

import prisma from '../config/db';
import admin from '../config/firebase';
import AppError from '../utils/AppError';
import { sendOtpEmail } from '../utils/mailer';

export class UserService {
  // Helper method to clean user response based on user type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cleanUserResponse(user: any) {
    if (user.user_type === 'INDIVIDUAL') {
      // For individual users, exclude business-specific fields that are null
      /* eslint-disable @typescript-eslint/no-unused-vars */
      const {
        email,
        otp,
        otp_expiry,
        address,
        zip_code,
        website,
        about,
        logo_url,
        video_urls,
        categories, // Fixed: changed from category
        ...cleanUser
      } = user;
      /* eslint-enable @typescript-eslint/no-unused-vars */
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
          video_urls: data.video_urls || [],
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

  async registerWithFirebase(data: {
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
    video_urls?: string[];
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
        verification_method: 'MOBILE', // default
      };

      // INDIVIDUAL USERS: must use mobile
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
        }
        // EMAIL verification for business: no Firebase needed
        else if (data.email) {
          userData.email = data.email;
          userData.otp_verified = false;
          userData.verification_method = 'EMAIL';

          // Generate OTP and send email
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          userData.otp = otp;
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
        userData.video_urls = data.video_urls || [];
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

      // GENERATE ACCESS TOKEN ONLY IF VERIFIED
      let accessToken: string | null = null;
      if (userData.otp_verified) {
        accessToken = jwt.sign(
          {
            userId: user.id,
            mobile_number: user.mobile_number,
            email: user.email,
            user_type: user.user_type,
          },
          process.env.JWT_SECRET as string,
          { expiresIn: '7d' },
        );

        await prisma.user.update({
          where: { id: user.id },
          data: { access_token: accessToken },
        });
      }

      return this.cleanUserResponse({ ...user, access_token: accessToken });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to register user', 500, { originalError: error });
    }
  }

  async loginWithFirebase(data: {
    idToken?: string;
    firebase_token?: string;
    device_id?: string;
    mobile_number?: string;
    email?: string;
  }) {
    try {
      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(data?.idToken || '');
      const mobileFromToken = decodedToken.phone_number;
      const emailFromToken = decodedToken.email;

      // Find user by mobile number or email (try token data first, then provided data)
      let user = null;

      // Try mobile number from token first, then provided mobile
      const mobileToSearch = mobileFromToken || data.mobile_number;
      if (mobileToSearch) {
        user = await prisma.user.findUnique({
          where: { mobile_number: mobileToSearch },
          include: {
            categories: { include: { category: true } },
          },
        });
      }

      // If not found by mobile, try email from token, then provided email
      if (!user) {
        const emailToSearch = emailFromToken || data.email;
        if (emailToSearch) {
          user = await prisma.user.findUnique({
            where: { email: emailToSearch },
            include: {
              categories: { include: { category: true } },
            },
          });
        }
      }

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Update login info
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          firebase_token: data.firebase_token,
          device_id: data.device_id,
          last_login: new Date(),
        },
        include: {
          categories: { include: { category: true } },
        },
      });

      return this.cleanUserResponse(updatedUser);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to login user', 500, { originalError: error });
    }
  }

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

  async verifyUser(id: string, method: VerificationMethod) {
    try {
      const user = await this.update(id, {
        otp_verified: true,
        verification_method: method,
      });

      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to verify user', 500, { originalError: error });
    }
  }

  async softDelete(id: string) {
    try {
      return await this.update(id, { status: 'INACTIVE' });
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
          video_urls: userData.video_urls || [],
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
