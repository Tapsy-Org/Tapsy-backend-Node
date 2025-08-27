import { Router } from 'express';

import { getWelcomeData } from '../controllers/welcome.controller';

const welcomeRouter = Router();
/**
 * @swagger
 * /api/welcome:
 *   get:
 *     summary: Get welcome data
 *     description: Fetch API keys and onboarding video URL required for the frontend onboarding process.
 *     tags: [Welcome]
 *     responses:
 *       200:
 *         description: Welcome data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 googleKey:
 *                   type: string
 *                   description: Google API key
 *                 geminiKey:
 *                   type: string
 *                   description: Gemini API key
 *                 videoUrl:
 *                   type: string
 *                   description: Onboarding video URL
 *             example:
 *               googleKey: "AIzaSyD...example"
 *               geminiKey: "GEM123EXAMPLEKEY"
 *               videoUrl: "https://example.com/onboarding.mp4"
 *       500:
 *         description: Internal server error (e.g., missing API keys or video URL)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Internal server error: Missing API keys or video URL"
 */

welcomeRouter.get('/welcome', getWelcomeData);

export default welcomeRouter;
