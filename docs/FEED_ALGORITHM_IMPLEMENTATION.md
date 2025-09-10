# Review Feed Algorithm - Implementation Guide

## Quick Start

### API Endpoint
```typescript
GET /api/reviews/feed?page=1&limit=10&latitude=40.7128&longitude=-74.0060
```

### Response Structure
```typescript
interface FeedResponse {
  status: 'success' | 'error';
  data: {
    reviews: Review[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    algorithm_info: {
      user_following_count: number;
      user_categories_count: number;
      location_based: boolean;
      algorithm_version: string;
      note: string;
    };
  };
}
```

## Core Implementation

### Service Method: `getReviewFeed`

```typescript
async getReviewFeed(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    latitude?: number;
    longitude?: number;
  } = {}
) {
  // Implementation in review.service.ts
}
```

### Controller Method: `getReviewFeed`

```typescript
static async getReviewFeed(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.user?.userId;
  const { page = '1', limit = '10', latitude, longitude } = req.query;
  
  const options = {
    page: parseInt(page as string, 10),
    limit: parseInt(limit as string, 10),
    latitude: latitude ? parseFloat(latitude as string) : undefined,
    longitude: longitude ? parseFloat(longitude as string) : undefined,
  };
  
  const result = await reviewService.getReviewFeed(userId, options);
  return res.success(result, 'Review feed fetched successfully');
}
```

## Algorithm Steps Breakdown

### Step 1: User Data Collection

```typescript
// Get user's profile and preferences
const user = await prisma.user.findUnique({
  where: { id: userId, status: 'ACTIVE' },
  include: {
    categories: { include: { category: true } },
    following: { select: { followingUserId: true } },
    locations: {
      select: { latitude: true, longitude: true },
      orderBy: { updatedAt: 'desc' },
      take: 1,
    },
  },
});

// Extract needed data
const userLat = latitude || user.locations[0]?.latitude;
const userLng = longitude || user.locations[0]?.longitude;
const userCategoryIds = user.categories.map((uc) => uc.categoryId);
const followingUserIds = user.following.map((f) => f.followingUserId);
```

### Step 2: Candidate Retrieval

```typescript
const baseReviews = await prisma.review.findMany({
  where: {
    status: 'ACTIVE',
    userId: { not: userId },
    video_url: { not: null },
  },
  include: {
    user: { /* user details */ },
    business: {
      select: {
        id: true, username: true, name: true, user_type: true, logo_url: true,
        categories: { select: { categoryId: true } },
        locations: { select: { latitude: true, longitude: true }, take: 1 },
      },
    },
    _count: { select: { likes: true, comments: true } },
  },
  take: limit * 3, // Smart candidate pool
  orderBy: [
    { createdAt: 'desc' },
    { views: 'desc' },
  ],
});
```

### Step 3: Scoring Algorithm

```typescript
const scoredReviews = baseReviews.map((review) => {
  // 1. Social Signals (30%)
  const socialScore = followingUserIds.includes(review.userId) ? 100 : 0;

  // 2. Category Relevance (25%)
  let categoryScore = 10;
  if (review.business?.categories) {
    const businessCategoryIds = review.business.categories.map((cat) => cat.categoryId);
    const hasMatchingCategory = businessCategoryIds.some((catId) =>
      userCategoryIds.includes(catId)
    );
    if (hasMatchingCategory) categoryScore = 80;
  }

  // 3. Location Proximity (20%)
  let locationScore = 30;
  if (userLat && userLng && review.business?.locations?.[0]) {
    const businessLat = review.business.locations[0].latitude;
    const businessLng = review.business.locations[0].longitude;
    
    const distance = Math.sqrt(
      Math.pow(69.1 * (businessLat - userLat), 2) +
      Math.pow(69.1 * (userLng - businessLng) * Math.cos(businessLat / 57.3), 2)
    ) * 1.60934;
    
    locationScore = Math.max(0, 100 - distance * 2);
  }

  // 4. Engagement Score (15%)
  const engagementScore = Math.min(
    100,
    (review.views || 0) * 0.1 + review._count.likes * 2 + review._count.comments * 3
  );

  // 5. Freshness Score (10%)
  const hoursSinceCreation = (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60);
  let freshnessScore = 20;
  if (hoursSinceCreation <= 24) freshnessScore = 100;
  else if (hoursSinceCreation <= 72) freshnessScore = 80;
  else if (hoursSinceCreation <= 168) freshnessScore = 60;
  else if (hoursSinceCreation <= 720) freshnessScore = 40;

  // Final weighted score
  const finalScore =
    socialScore * 0.3 +
    categoryScore * 0.25 +
    locationScore * 0.2 +
    engagementScore * 0.15 +
    freshnessScore * 0.1;

  return { ...review, finalScore };
});
```

### Step 4: Sorting and Pagination

```typescript
const sortedReviews = scoredReviews
  .sort((a, b) => {
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  })
  .slice(skip, skip + limit);

const reviews = sortedReviews.map(({ finalScore: _finalScore, ...review }) => review);
```

## Database Schema Requirements

### Required Tables and Relationships

```sql
-- User table with basic info
User {
  id: UUID (PK)
  status: Status
  categories: UserCategory[]
  following: Follow[]
  locations: Location[]
}

-- Reviews with engagement data
Review {
  id: UUID (PK)
  userId: UUID (FK -> User.id)
  businessId: UUID (FK -> User.id)
  status: Status
  video_url: String
  views: Int
  createdAt: DateTime
  likes: Like[]
  comments: Comment[]
}

-- User categories for interest matching
UserCategory {
  userId: UUID (FK -> User.id)
  categoryId: UUID (FK -> Category.id)
}

-- Social following relationships
Follow {
  followerId: UUID (FK -> User.id)
  followingUserId: UUID (FK -> User.id)
}

-- Location data for proximity scoring
Location {
  userId: UUID (FK -> User.id)
  latitude: Float
  longitude: Float
}
```

### Required Indexes

```sql
-- Critical indexes for performance
CREATE INDEX idx_review_status_user_video ON Review(status, userId, video_url);
CREATE INDEX idx_review_created_views ON Review(createdAt DESC, views DESC);
CREATE INDEX idx_user_category_user_id ON UserCategory(userId);
CREATE INDEX idx_follow_follower_id ON Follow(followerId);
CREATE INDEX idx_location_user_id ON Location(userId);
```

## Performance Optimization

### Query Optimization

1. **Single Query Strategy**: One main query instead of multiple
2. **Smart Candidate Pool**: `limit * 3` for better algorithm results
3. **Efficient Includes**: Only fetch necessary relationship data
4. **Pre-sorting**: Order by recency and popularity before algorithm

### Memory Optimization

1. **Bounded Memory**: Only load candidate pool, not entire dataset
2. **Streaming**: Process reviews in memory without additional queries
3. **Clean Response**: Remove scoring metadata before response

### Caching Opportunities

```typescript
// User data caching (rarely changes)
const userCacheKey = `user_feed_data:${userId}`;
const cachedUserData = await redis.get(userCacheKey);

// Popular content caching
const popularCacheKey = `popular_reviews:${date}`;
const cachedPopular = await redis.get(popularCacheKey);
```

## Error Handling

### Common Error Scenarios

```typescript
// User not found
if (!user) {
  throw new AppError('User not found', 404);
}

// Invalid pagination
if (options.page < 1) {
  throw new AppError('Page must be greater than 0', 400);
}

if (options.limit < 1 || options.limit > 50) {
  throw new AppError('Limit must be between 1 and 50', 400);
}

// Invalid coordinates
if ((options.latitude && !options.longitude) || (!options.latitude && options.longitude)) {
  throw new AppError('Both latitude and longitude must be provided together', 400);
}
```

### Graceful Degradation

```typescript
// Handle missing user data gracefully
const userCategoryIds = user.categories?.map((uc) => uc.categoryId) || [];
const followingUserIds = user.following?.map((f) => f.followingUserId) || [];

// Default scores when data unavailable
const locationScore = userLat && userLng ? calculateLocationScore() : 30;
const categoryScore = userCategoryIds.length > 0 ? calculateCategoryScore() : 10;
```

## Testing Strategy

### Unit Tests

```typescript
describe('Review Feed Algorithm', () => {
  test('should calculate social score correctly', () => {
    const review = { userId: 'following-user-id' };
    const followingUserIds = ['following-user-id'];
    const socialScore = followingUserIds.includes(review.userId) ? 100 : 0;
    expect(socialScore).toBe(100);
  });

  test('should calculate location score with distance', () => {
    const userLat = 40.7128, userLng = -74.0060;
    const businessLat = 40.7589, businessLng = -73.9851;
    // Test distance calculation and scoring
  });
});
```

### Integration Tests

```typescript
describe('Feed API Integration', () => {
  test('should return personalized feed', async () => {
    const response = await request(app)
      .get('/api/reviews/feed?page=1&limit=5')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.data.reviews).toHaveLength(5);
    expect(response.body.data.algorithm_info).toBeDefined();
  });
});
```

### Performance Tests

```typescript
describe('Feed Performance', () => {
  test('should respond within 500ms', async () => {
    const start = Date.now();
    await reviewService.getReviewFeed(userId, { page: 1, limit: 10 });
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });
});
```

## Monitoring and Analytics

### Key Metrics

```typescript
// Performance metrics
const metrics = {
  response_time: Date.now() - startTime,
  candidate_count: baseReviews.length,
  final_count: reviews.length,
  user_following_count: followingUserIds.length,
  user_categories_count: userCategoryIds.length,
  location_based: !!(userLat && userLng),
};

// Log for analytics
logger.info('Feed generated', { userId, ...metrics });
```

### A/B Testing Framework

```typescript
// Feature flags for algorithm variants
const algorithmVariant = await getFeatureFlag(userId, 'feed_algorithm_variant');

switch (algorithmVariant) {
  case 'social_heavy':
    socialWeight = 0.4; categoryWeight = 0.2;
    break;
  case 'location_focused':
    locationWeight = 0.3; socialWeight = 0.25;
    break;
  default:
    // Standard weights
}
```

## Deployment Considerations

### Environment Variables

```bash
# Algorithm tuning
FEED_CANDIDATE_MULTIPLIER=3
FEED_MAX_LIMIT=50
FEED_CACHE_TTL=300

# Performance
DB_POOL_SIZE=20
REDIS_URL=redis://localhost:6379
```

### Production Optimizations

1. **Database Connection Pooling**: Efficient connection management
2. **Query Timeout**: Prevent long-running queries
3. **Rate Limiting**: Protect against abuse
4. **Circuit Breaker**: Graceful failure handling
5. **Monitoring**: Real-time performance tracking

This implementation provides a robust, scalable, and maintainable TikTok-style feed algorithm optimized for performance and user engagement.
