import type { Prisma } from '../../generated/prisma';
import prisma from '../config/db';
import AppError from '../utils/AppError';
import { sendOtpEmail } from '../utils/mailer';

type BusinessDetailsUpsert = Prisma.BusinessDetailsCreateInput & { email?: string | null };

export const updateBusinessDetails = async (userId: string, details: Record<string, unknown>) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  let businessDetails;
  if (user.businessDetailsId) {
    businessDetails = await prisma.businessDetails.update({
      where: { id: user.businessDetailsId },
      data: details as Prisma.BusinessDetailsUpdateInput,
    });
  } else {
    businessDetails = await prisma.businessDetails.create({
      data: {
        ...(details as Prisma.BusinessDetailsCreateInput),
        user: { connect: { id: userId } },
      },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { businessDetailsId: businessDetails.id },
    });
  }

  const email = (details as BusinessDetailsUpsert).email ?? undefined;
  if (email && typeof email === 'string' && email.length > 0) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await prisma.user.update({
      where: { id: userId },
      data: { otp, otpExpires },
    });

    try {
      await sendOtpEmail(email, otp);
    } catch (error) {
      throw new AppError('Failed to send OTP email', 500, { originalError: error });
    }
  }

  return prisma.user.findUnique({
    where: { id: userId },
    include: { businessDetails: true },
  });
};
