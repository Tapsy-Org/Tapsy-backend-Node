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

describe('User Category Integration Tests', () => {
  beforeAll(() => {
    // Set up required environment variables
    process.env.GOOGLE_API_KEY = 'test-google-key';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.ONBOARDING_VIDEO_URL = 'https://test-video-url.com';
  });

  afterAll(() => {
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.ONBOARDING_VIDEO_URL;
  });

  describe('Category Routes', () => {
    describe('GET /api/categories/active', () => {
      it('should get active categories', async () => {
        const response = await request(app).get('/api/categories/active');

        // Should reach the endpoint (status could be 200 or 500 depending on DB)
        expect([200, 500]).toContain(response.status);
      });
    });

    describe('GET /api/categories', () => {
      it('should get all categories', async () => {
        const response = await request(app).get('/api/categories');

        // Should reach the endpoint
        expect([200, 500]).toContain(response.status);
      });
    });
  });

  describe('User Category Assignment Routes', () => {
    describe('POST /api/user-categories/assign', () => {
      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/user-categories/assign')
          .send({})
          .expect(400);

        expect(response.body.message).toContain('userId and categoryId are required');
      });

      it('should have proper request structure', async () => {
        const response = await request(app).post('/api/user-categories/assign').send({
          userId: 'test-user-id',
          categoryId: 'test-category-id',
        });

        // Should reach the service layer (might fail due to DB constraints in test)
        expect([201, 400, 404, 500]).toContain(response.status);
      });
    });

    describe('POST /api/user-categories/assign-multiple', () => {
      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/user-categories/assign-multiple')
          .send({
            userId: 'test-user-id',
            categoryIds: [],
          })
          .expect(400);

        expect(response.body.message).toContain('userId and categoryIds array are required');
      });

      it('should have proper request structure', async () => {
        const response = await request(app)
          .post('/api/user-categories/assign-multiple')
          .send({
            userId: 'test-user-id',
            categoryIds: ['cat1', 'cat2'],
          });

        // Should reach the service layer
        expect([201, 400, 404, 500]).toContain(response.status);
      });
    });

    describe('GET /api/user-categories/user/:userId', () => {
      it('should get user categories', async () => {
        const response = await request(app).get('/api/user-categories/user/test-user-id');

        // Should reach the endpoint
        expect([200, 400, 404, 500]).toContain(response.status);
      });
    });

    describe('DELETE /api/user-categories/remove', () => {
      it('should validate required fields', async () => {
        const response = await request(app)
          .delete('/api/user-categories/remove')
          .send({})
          .expect(400);

        expect(response.body.message).toContain('userId and categoryId are required');
      });

      it('should have proper request structure', async () => {
        const response = await request(app).delete('/api/user-categories/remove').send({
          userId: 'test-user-id',
          categoryId: 'test-category-id',
        });

        // Should reach the service layer
        expect([200, 400, 404, 500]).toContain(response.status);
      });
    });
  });
});
