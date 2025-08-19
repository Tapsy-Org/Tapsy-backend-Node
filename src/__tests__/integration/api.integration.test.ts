import request from 'supertest';

import app from '../../app';

// Mock Firebase to prevent initialization errors during testing
jest.mock('../../config/firebase', () => ({
  __esModule: true,
  default: {
    auth: jest.fn(),
    messaging: jest.fn(),
  },
}));

describe('API Integration Tests', () => {
  // Set up required environment variables for tests
  beforeAll(() => {
    process.env.GOOGLE_API_KEY = 'test-google-key';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.ONBOARDING_VIDEO_URL = 'https://test-video-url.com';
  });

  afterAll(() => {
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.ONBOARDING_VIDEO_URL;
  });
  describe('GET /', () => {
    it('should return root message', async () => {
      const response = await request(app).get('/').expect(200);

      expect(response.text).toBe('Tapsy Backend is running!');
    });
  });

  describe('GET /api/welcome', () => {
    it('should return welcome message', async () => {
      const response = await request(app).get('/api/welcome').expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('API Documentation', () => {
    it('should serve Swagger documentation', async () => {
      const response = await request(app).get('/api-docs/').expect(200); // Swagger UI serves documentation

      expect(response.text).toContain('swagger'); // Check if it contains Swagger content
    });
  });
});
