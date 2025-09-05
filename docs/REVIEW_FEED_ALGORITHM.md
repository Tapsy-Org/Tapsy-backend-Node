# TikTok-Style Review Feed Algorithm Documentation

## Overview

The Tapsy review feed algorithm is designed to provide a personalized, TikTok-style content discovery experience for users. It intelligently surfaces video reviews based on multiple factors including social connections, personal preferences, location proximity, content engagement, and freshness.

## Algorithm Architecture

### Core Philosophy

The algorithm follows a **multi-factor scoring system** that balances personalization with content diversity. It ensures users see:
- Content from people they follow (social signals)
- Reviews for businesses in their interest categories
- Local/nearby business reviews
- Popular and engaging content
- Fresh, recent content

### Performance Strategy

- **Single-Query Approach**: Uses one efficient Prisma query instead of complex raw SQL
- **Smart Candidate Pool**: Fetches `limit × 3` reviews for better algorithm results
- **In-Memory Scoring**: Fast JavaScript computations after data retrieval
- **Optimized Sorting**: Pre-sorts by recency and popularity before applying algorithm

## Scoring System Breakdown

### 1. Social Signals Score (30% Weight)

**Purpose**: Prioritize content from users' social network

```typescript
const socialScore = followingUserIds.includes(review.userId) ? 100 : 0;
```

**Logic**:
- **100 points**: Review is from a user the current user follows
- **0 points**: Review is from a non-followed user

**Impact**: Ensures users see content from their network first, similar to social media feeds

---

### 2. Category Relevance Score (25% Weight)

**Purpose**: Surface reviews for businesses matching user interests

```typescript
let categoryScore = 10; // default
if (review.business?.categories) {
  const businessCategoryIds = review.business.categories.map((cat) => cat.categoryId);
  const hasMatchingCategory = businessCategoryIds.some((catId) =>
    userCategoryIds.includes(catId),
  );
  if (hasMatchingCategory) {
    categoryScore = 80;
  }
}
```

**Logic**:
- **80 points**: Business category matches user's selected interests
- **10 points**: Default score for non-matching categories

**Data Source**: User's selected categories from `UserCategory` table

---

### 3. Location Proximity Score (20% Weight)

**Purpose**: Promote local businesses and nearby experiences

```typescript
let locationScore = 30; // default
if (userLat && userLng && review.business?.locations?.[0]) {
  const businessLat = review.business.locations[0].latitude;
  const businessLng = review.business.locations[0].longitude;
  
  // Haversine formula for distance calculation
  const distance = Math.sqrt(
    Math.pow(69.1 * (businessLat - userLat), 2) +
    Math.pow(69.1 * (userLng - businessLng) * Math.cos(businessLat / 57.3), 2),
  ) * 1.60934; // Convert to kilometers
  
  locationScore = Math.max(0, 100 - distance * 2);
}
```

**Logic**:
- **100-0 points**: Calculated using Haversine formula for accurate distance
- **Distance scaling**: Each kilometer reduces score by 2 points
- **30 points**: Default when location data unavailable

**Formula**: `100 - (distance_in_km × 2)`, minimum 0

---

### 4. Engagement Score (15% Weight)

**Purpose**: Surface popular and engaging content

```typescript
const engagementScore = Math.min(
  100,
  (review.views || 0) * 0.1 + review._count.likes * 2 + review._count.comments * 3,
);
```

**Logic**:
- **Views**: 0.1 points per view
- **Likes**: 2 points per like  
- **Comments**: 3 points per comment (highest weight due to active engagement)
- **Maximum**: Capped at 100 points

**Rationale**: Comments indicate deeper engagement than likes, which are more valuable than passive views

---

### 5. Freshness Score (10% Weight)

**Purpose**: Balance fresh content with quality older content

```typescript
const now = new Date();
const reviewDate = new Date(review.createdAt);
const hoursSinceCreation = (now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60);

let freshnessScore = 20; // default for old content
if (hoursSinceCreation <= 24) freshnessScore = 100;
else if (hoursSinceCreation <= 72) freshnessScore = 80;
else if (hoursSinceCreation <= 168) freshnessScore = 60;
else if (hoursSinceCreation <= 720) freshnessScore = 40;
```

**Logic**:
- **100 points**: Less than 24 hours old
- **80 points**: 1-3 days old
- **60 points**: 3-7 days old  
- **40 points**: 1-4 weeks old
- **20 points**: Older than 4 weeks

**Rationale**: Keeps feed fresh while not completely burying quality older content

## Final Score Calculation

```typescript
const finalScore =
  socialScore * 0.3 +      // 30%
  categoryScore * 0.25 +   // 25%
  locationScore * 0.2 +    // 20%
  engagementScore * 0.15 + // 15%
  freshnessScore * 0.1;    // 10%
```

### Weight Justification

1. **Social (30%)**: Highest weight because social connections are primary drivers of engagement
2. **Category (25%)**: Strong indicator of user interest and relevance
3. **Location (20%)**: Important for local business discovery
4. **Engagement (15%)**: Validates content quality through user behavior
5. **Freshness (10%)**: Ensures variety without overwhelming with recency bias

## Algorithm Flow

### Step 1: Data Retrieval
```typescript
const baseReviews = await prisma.review.findMany({
  where: {
    status: 'ACTIVE',
    userId: { not: userId },    // Exclude own reviews
    video_url: { not: null },   // TikTok-style: video only
  },
  take: limit * 3,  // Get more candidates for better results
  orderBy: [
    { createdAt: 'desc' },  // Recent first
    { views: 'desc' },      // Popular second
  ],
  include: { /* all needed relations */ }
});
```

### Step 2: Score Calculation
- Apply all 5 scoring factors to each review
- Calculate weighted final score
- Preserve review data with score

### Step 3: Sorting & Pagination
```typescript
const sortedReviews = scoredReviews
  .sort((a, b) => {
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;  // Primary: by score
    }
    // Tie-breaker: more recent content wins
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  })
  .slice(skip, skip + limit);
```

### Step 4: Response Preparation
- Remove scoring metadata from response
- Include pagination information
- Add algorithm diagnostics

## Performance Characteristics

### Time Complexity
- **Database Query**: O(n log n) where n is total reviews
- **Scoring**: O(m) where m is candidate reviews (limit × 3)
- **Sorting**: O(m log m)
- **Overall**: O(n log n + m log m), typically very fast

### Space Complexity
- **Memory**: O(m) for candidate reviews in memory
- **Efficient**: Only loads necessary data, not entire dataset

### Scalability
- **Database**: Single optimized query with proper indexing
- **Memory**: Bounded by candidate pool size, not total reviews
- **CPU**: Fast in-memory calculations after data retrieval

## Configuration Parameters

### Tunable Constants

```typescript
// Candidate pool multiplier
take: limit * 3  // Can be adjusted based on dataset size

// Distance scaling factor
locationScore = Math.max(0, 100 - distance * 2);  // 2 points per km

// Engagement weights
views * 0.1 + likes * 2 + comments * 3  // Can be fine-tuned

// Time thresholds (in hours)
24, 72, 168, 720  // Can be adjusted for different freshness curves
```

### A/B Testing Support

The algorithm supports easy A/B testing by:
- Adjusting weight percentages
- Modifying scoring formulas
- Changing time thresholds
- Altering candidate pool size

## API Usage

### Endpoint
```
GET /api/reviews/feed
```

### Parameters
- `page`: Page number (default: 1)
- `limit`: Reviews per page (default: 10, max: 50)
- `latitude`: User's current latitude (optional)
- `longitude`: User's current longitude (optional)

### Response Format
```json
{
  "status": "success",
  "data": {
    "reviews": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15
    },
    "algorithm_info": {
      "user_following_count": 12,
      "user_categories_count": 5,
      "location_based": true,
      "algorithm_version": "fast_prisma_v1",
      "note": "TikTok-style personalized feed with full scoring algorithm"
    }
  }
}
```

## Algorithm Advantages

### 1. Personalization
- **Social Context**: Prioritizes trusted sources (followed users)
- **Interest Alignment**: Matches user's declared preferences
- **Local Relevance**: Promotes nearby experiences

### 2. Content Quality
- **Engagement Validation**: Popular content rises naturally
- **Freshness Balance**: New content gets visibility without burying quality

### 3. Performance
- **Fast Execution**: Single query + in-memory processing
- **Scalable Design**: Efficient resource usage
- **Reliable**: No complex SQL, UUID-safe

### 4. Flexibility
- **Tunable Weights**: Easy to adjust for different user behaviors
- **A/B Testing Ready**: Simple parameter modification
- **Extensible**: Easy to add new scoring factors

## Monitoring & Analytics

### Key Metrics to Track

1. **Algorithm Performance**
   - Average response time
   - Cache hit rates
   - Database query performance

2. **User Engagement**
   - Click-through rates by score ranges
   - Time spent viewing recommended content
   - User interactions (likes, comments, shares)

3. **Content Distribution**
   - Score distribution across different factors
   - Geographic spread of recommendations
   - Category coverage

### Optimization Opportunities

1. **Caching Layer**: Cache user preferences and location data
2. **Precomputation**: Calculate engagement scores periodically
3. **Machine Learning**: Learn user preferences from behavior
4. **Real-time Updates**: Stream score updates for popular content

## Future Enhancements

### Planned Improvements

1. **Behavioral Learning**: Incorporate user interaction history
2. **Content Similarity**: Add semantic matching for reviews
3. **Time-based Preferences**: Learn user's optimal viewing times
4. **Social Graph Analysis**: Deeper relationship scoring
5. **Business Quality Signals**: Incorporate business ratings and reputation

### Advanced Features

1. **Negative Feedback**: Learn from skipped/disliked content
2. **Contextual Awareness**: Time-of-day and location-based adjustments
3. **Content Diversity**: Ensure variety in recommendations
4. **Trending Detection**: Boost emerging popular content

---

## Technical Implementation Notes

### Database Requirements
- Proper indexing on `status`, `userId`, `video_url`, `createdAt`, `views`
- Foreign key relationships properly established
- Regular maintenance for optimal query performance

### Error Handling
- Graceful fallbacks when user data incomplete
- Default scoring when optional data missing
- Comprehensive error logging for debugging

### Security Considerations
- User authentication verified before feed generation
- Data privacy: only shows public/active content
- Rate limiting to prevent abuse

This algorithm provides a solid foundation for a TikTok-style discovery experience while maintaining flexibility for future enhancements and optimizations.
