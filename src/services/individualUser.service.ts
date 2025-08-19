import type { auth as FirebaseAuth } from 'firebase-admin';

import { Status } from '../../generated/prisma';
import prisma from '../config/db';
import admin from '../config/firebase';
import AppError from '../utils/AppError';

type BaseFirebaseAuthPayload = {
  idToken: string;
  firebase_token: string;
  device_id?: string;
};
type RegisterPayload = BaseFirebaseAuthPayload & { username?: string };
type LoginPayload = BaseFirebaseAuthPayload;

type DecodedIdTokenWithPhone = FirebaseAuth.DecodedIdToken & { phone_number?: string };

export class individualUserService {
  private async getPhoneNumberFromIdToken(idToken: string): Promise<string> {
    if (process.env.AUTH_TEST_MODE === 'true' && idToken.startsWith('test:')) {
      const phone = idToken.slice(5).trim();
      if (!phone) throw new AppError('Test phone number missing in idToken', 400);
      return phone;
    }

    let decodedToken: DecodedIdTokenWithPhone;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch {
      throw new AppError('Invalid Firebase ID token', 401);
    }

    const phoneNumber = decodedToken.phone_number;
    if (!phoneNumber) throw new AppError('Phone number not found in Firebase token', 400);
    return phoneNumber;
  }

  async registerWithFirebase(data: RegisterPayload) {
    const phoneNumber = await this.getPhoneNumberFromIdToken(data.idToken);

    const existsInBusiness = await prisma.businessUser.findUnique({
      where: { mobile_number: phoneNumber },
    });
    if (existsInBusiness && existsInBusiness.status === Status.ACTIVE) {
      throw new AppError('This mobile number is already registered as a Business user', 409);
    }

    let user = await prisma.individualUser.findUnique({
      where: { mobile_number: phoneNumber },
    });

    if (user) {
      throw new AppError('This mobile number is already registered as an Individual user', 409);
    }

    if (!data.username) {
      throw new AppError('Username is required for new users', 400);
    }

    user = await prisma.individualUser.create({
      data: {
        mobile_number: phoneNumber,
        username: data.username,
        firebase_token: data.firebase_token,
        device_id: data.device_id,
        otp_verified: true,
        last_login: new Date(),
      },
    });

    return user;
  }

  async loginWithFirebase(data: LoginPayload) {
    const phoneNumber = await this.getPhoneNumberFromIdToken(data.idToken);

    // Check if number exists in Business users
    const existsInBusiness = await prisma.businessUser.findUnique({
      where: { mobile_number: phoneNumber },
    });
    if (existsInBusiness && existsInBusiness.status === Status.ACTIVE) {
      throw new AppError('This mobile number is already registered as a Business user', 409);
    }

    const user = await prisma.individualUser.findUnique({
      where: { mobile_number: phoneNumber },
    });

    if (!user || user.status === Status.INACTIVE) {
      throw new AppError('User not registered', 404);
    }

    const updated = await prisma.individualUser.update({
      where: { id: user.id },
      data: {
        firebase_token: data.firebase_token,
        device_id: data.device_id,
        otp_verified: true,
        last_login: new Date(),
      },
    });

    return updated;
  }

  async findById(id: string) {
    const user = await prisma.individualUser.findUnique({
      where: { id },
      include: {
        categories: true,
        locations: true,
        reels: true,
        reviews: true,
      },
    });
    if (!user || user.status === Status.INACTIVE) throw new AppError('User not found', 404);
    return user;
  }

  async update(
    id: string,
    data: Partial<{
      username: string;
      mobile_number: string;
      firebase_token: string;
      otp_verified: boolean;
      refresh_token: string;
      device_id: string;
      status: Status;
      last_login: Date;
    }>,
  ) {
    return prisma.individualUser.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    const user = await prisma.individualUser.findUnique({ where: { id } });
    if (!user || user.status === Status.INACTIVE) throw new AppError('User not found', 404);

    return prisma.individualUser.update({
      where: { id },
      data: { status: Status.INACTIVE },
    });
  }

  async restore(id: string) {
    const user = await prisma.individualUser.findUnique({ where: { id } });
    if (!user || user.status === Status.ACTIVE)
      throw new AppError('User not found or already active', 404);

    return prisma.individualUser.update({
      where: { id },
      data: { status: Status.ACTIVE },
    });
  }
}
