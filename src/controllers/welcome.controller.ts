import { NextFunction, Request, Response } from 'express';

export const getWelcomeData = (_req: Request, res: Response, next: NextFunction) => {
  try {
    const googleKey = process.env.GOOGLE_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const videoUrl = process.env.ONBOARDING_VIDEO_URL;

    if (!googleKey || !geminiKey || !videoUrl) {
      return res.fail('Internal server error: Missing API keys or video URL', 500);
    }

    return res.success({ googleKey, geminiKey, videoUrl });
  } catch (error) {
    next(error as Error);
  }
};
