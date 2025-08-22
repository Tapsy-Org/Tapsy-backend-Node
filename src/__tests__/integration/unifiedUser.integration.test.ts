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

// Mock Prisma for testing
jest.mock('../../config/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    userCategory: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    userSubCategory: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
  },
}));

describe('Unified User System Integration Tests', () => {
  beforeAll(() => {
    // Set up required environment variables
    process.env.GOOGLE_API_KEY = 'test-google-key';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.ONBOARDING_VIDEO_URL = 'https://test-video-url.com';
    process.env.JWT_SECRET = 'test-jwt-secret';
  });

  afterAll(() => {
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.ONBOARDING_VIDEO_URL;
    delete process.env.JWT_SECRET;
  });

  describe('User Routes', () => {
    describe('POST /api/users/register', () => {
      it('should return 400 for missing required fields', async () => {
        const response = await request(app).post('/api/users/register').send({}).expect(400);

        expect(response.body.status).toBe('fail');
        expect(response.body.message).toContain('required');
      });

      it('should return 400 for business user without required fields', async () => {
        const response = await request(app)
          .post('/api/users/register')
          .send({
            idToken: 'test-token',
            firebase_token: 'test-firebase-token',
            user_type: 'BUSINESS',
            mobile_number: '+1234567890',
          })
          .expect(400);

        expect(response.body.message).toContain('Device ID is required');
      });
    });

    describe('POST /api/users/login', () => {
      it('should return 400 for missing required fields', async () => {
        const response = await request(app).post('/api/users/login').send({}).expect(400);

        expect(response.body.status).toBe('fail');
        expect(response.body.message).toContain('required');
      });
    });

    describe('GET /api/users/type/:user_type', () => {
      it('should return 400 for invalid user type', async () => {
        const response = await request(app).get('/api/users/type/INVALID').expect(400);

        expect(response.body.message).toContain('Valid user_type');
      });

      it('should accept valid user types', async () => {
        const individualResponse = await request(app).get('/api/users/type/INDIVIDUAL').expect(200);

        const businessResponse = await request(app).get('/api/users/type/BUSINESS').expect(200);

        expect(individualResponse.body.status).toBe('success');
        expect(businessResponse.body.status).toBe('success');
      });
    });

    describe('POST /api/users/:id/verify', () => {
      it('should return 400 for invalid verification method', async () => {
        const response = await request(app)
          .post('/api/users/test-id/verify')
          .send({ verification_method: 'INVALID' })
          .expect(400);

        expect(response.body.message).toContain('Valid verification_method');
      });

      it('should accept valid verification methods', async () => {
        // This will fail with user not found, but validates the verification_method
        await request(app)
          .post('/api/users/test-id/verify')
          .send({ verification_method: 'MOBILE' })
          .expect(404); // Will fail due to user not found, but method is valid

        await request(app)
          .post('/api/users/test-id/verify')
          .send({ verification_method: 'EMAIL' })
          .expect(404); // Will fail due to user not found, but method is valid
      });
    });
  });

  describe('Unified Category Assignment Routes', () => {
    describe('POST /api/user-categories/assign', () => {
      it('should return 400 for missing required fields', async () => {
        const response = await request(app)
          .post('/api/user-categories/assign')
          .send({})
          .expect(400);

        expect(response.body.message).toContain('required');
      });
    });

    describe('POST /api/user-categories/assign-multiple', () => {
      it('should return 400 for missing categoryIds', async () => {
        const response = await request(app)
          .post('/api/user-categories/assign-multiple')
          .send({ userId: 'test-user' })
          .expect(400);

        expect(response.body.message).toContain('required');
      });
    });
  });

  describe('Unified Subcategory Assignment Routes', () => {
    describe('POST /api/user-subcategories/assign-multiple', () => {
      it('should return 400 for invalid input', async () => {
        const response = await request(app)
          .post('/api/user-subcategories/assign-multiple')
          .send({})
          .expect(400);

        expect(response.body.message).toContain('required');
      });
    });
  });
});
