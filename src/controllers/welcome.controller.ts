import { NextFunction, Request, Response } from 'express';

import { generateSignedUrl } from '../utils/s3';

export const getWelcomeData = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const googleKey = process.env.GOOGLE_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!googleKey || !geminiKey) {
      return res.fail('Internal server error: Missing API keys', 500);
    }

    // Use reusable signed URL generator
    const videoUrl = await generateSignedUrl(process.env.ONBOARDING_VIDEO_URL!);

    return res.success(
      {
        googleKey,
        geminiKey,
        videoUrl,
      },
      'Welcome to Tapsy API!',
    );
  } catch (error) {
    next(error as Error);
  }
};
