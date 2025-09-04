# Review API Documentation

This document describes the Review API endpoints for the Tapsy backend.

## Overview

The Review API allows users to create, read, and manage video reviews with ratings, captions, hashtags, and business associations.

## Authentication

All protected endpoints require a valid Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Endpoints

### 1. Create Review

**POST** `/reviews`

Creates a new review with optional video upload.

**Headers:**
- `Authorization: Bearer <access_token>` (required)
- `Content-Type: multipart/form-data` (for video uploads)

**Body (multipart/form-data):**
- `rating` (required): Rating value - ONE, TWO, THREE, FOUR, or FIVE
- `badges` (optional): String representing badges earned
- `caption` (optional): Review caption/description
- `hashtags` (optional): Array of hashtags
- `title` (optional): Review title
- `video` (optional): Video file (max 100MB, video/* formats only)
- `businessId` (optional): ID of the business being reviewed

**Example Request:**
```bash
curl -X POST http://localhost:3000/reviews \
  -H "Authorization: Bearer <access_token>" \
  -F "rating=FIVE" \
  -F "caption=Amazing service and great food!" \
  -F "hashtags=[\"#great\", \"#food\", \"#service\"]" \
  -F "title=Best Restaurant Experience" \
  -F "businessId=business-uuid-123" \
  -F "video=@/path/to/video.mp4"
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Review created successfully",
  "data": {
    "review": {
      "id": "review-uuid-123",
      "userId": "user-uuid-123",
      "rating": "FIVE",
      "badges": null,
      "caption": "Amazing service and great food!",
      "hashtags": ["#great", "#food", "#service"],
      "title": "Best Restaurant Experience",
      "video_url": "https://bucket.s3.region.amazonaws.com/videos/user-uuid-123/review-timestamp.mp4",
      "businessId": "business-uuid-123",
      "views": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": "user-uuid-123",
        "username": "john_doe",
        "user_type": "INDIVIDUAL",
        "logo_url": null
      },
      "business": {
        "id": "business-uuid-123",
        "username": "restaurant_name",
        "user_type": "BUSINESS",
        "logo_url": "https://example.com/logo.png"
      }
    }
  }
}
```

### 2. Get All Reviews

**GET** `/reviews`

Retrieves reviews with optional filtering and pagination.

**Query Parameters:**
- `userId` (optional): Filter by user ID
- `businessId` (optional): Filter by business ID
- `rating` (optional): Filter by rating (ONE, TWO, THREE, FOUR, FIVE)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example Request:**
```bash
curl "http://localhost:3000/reviews?businessId=business-uuid-123&rating=FIVE&page=1&limit=20"
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Reviews fetched successfully",
  "data": {
    "reviews": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### 3. Get Review by ID

**GET** `/reviews/:reviewId`

Retrieves a specific review by ID and increments the view count.

**Example Request:**
```bash
curl http://localhost:3000/reviews/review-uuid-123
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Review fetched successfully",
  "data": {
    "review": {
      "id": "review-uuid-123",
      "userId": "user-uuid-123",
      "rating": "FIVE",
      "badges": null,
      "caption": "Amazing service and great food!",
      "hashtags": ["#great", "#food", "#service"],
      "title": "Best Restaurant Experience",
      "video_url": "https://bucket.s3.region.amazonaws.com/videos/user-uuid-123/review-timestamp.mp4",
      "businessId": "business-uuid-123",
      "views": 15,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "user": {...},
      "business": {...},
      "likes": [...],
      "comments": [...]
    }
  }
}
```

### 4. Get My Reviews

**GET** `/reviews/my/reviews`

Retrieves reviews created by the authenticated user.

**Headers:**
- `Authorization: Bearer <access_token>` (required)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example Request:**
```bash
curl -H "Authorization: Bearer <access_token>" \
  "http://localhost:3000/reviews/my/reviews?page=1&limit=10"
```

### 5. Get My Business Reviews

**GET** `/reviews/my/business-reviews`

Retrieves all reviews for the authenticated business user with pagination support. Default limit is 5 reviews per page.

**Headers:**
- `Authorization: Bearer <access_token>` (required - BUSINESS user type)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 5, max: 100)
- `status` (optional): Filter by status (ACTIVE, INACTIVE, PENDING, DELETED)
- `sortBy` (optional): Sort by field (createdAt, views, rating)
- `sortOrder` (optional): Sort order (asc, desc)
- `search` (optional): Search in title, caption, or hashtags

**Example Request:**
```bash
curl -H "Authorization: Bearer <business_access_token>" \
  "http://localhost:3000/reviews/my/business-reviews?page=1&limit=5&status=ACTIVE&sortBy=createdAt&sortOrder=desc"
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Your business reviews fetched successfully",
  "data": {
    "reviews": [
      {
        "id": "review-uuid-123",
        "userId": "user-uuid-123",
        "rating": "FIVE",
        "badges": null,
        "caption": "Amazing service and great food!",
        "hashtags": ["#great", "#food", "#service"],
        "title": "Best Restaurant Experience",
        "video_url": "https://bucket.s3.region.amazonaws.com/videos/user-uuid-123/review-timestamp.mp4",
        "businessId": "business-uuid-123",
        "views": 15,
        "status": "ACTIVE",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "user": {
          "id": "user-uuid-123",
          "username": "john_doe",
          "user_type": "INDIVIDUAL",
          "logo_url": "https://example.com/avatar.jpg"
        },
        "business": {
          "id": "business-uuid-123",
          "username": "restaurant_name",
          "user_type": "BUSINESS",
          "logo_url": "https://example.com/logo.png"
        },
        "likes": [
          {
            "id": "like-uuid-123",
            "userId": "user-uuid-456"
          }
        ],
        "comments": [
          {
            "id": "comment-uuid-123",
            "comment": "I agree, great place!",
            "createdAt": "2024-01-01T01:00:00.000Z",
            "user": {
              "id": "user-uuid-456",
              "username": "jane_doe",
              "logo_url": "https://example.com/avatar2.jpg"
            }
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 25,
      "totalPages": 5
    }
  }
}
```

### 6. Delete Review

**DELETE** `/reviews/:reviewId`

Deletes a review (only by the user who created it).

**Headers:**
- `Authorization: Bearer <access_token>` (required)

**Example Request:**
```bash
curl -X DELETE \
  -H "Authorization: Bearer <access_token>" \
  http://localhost:3000/reviews/review-uuid-123
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Review deleted successfully",
  "data": {
    "message": "Review deleted successfully"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "Rating is required",
  "details": null
}
```

### 401 Unauthorized
```json
{
  "status": "fail",
  "statusCode": 401,
  "message": "User not authenticated",
  "details": null
}
```

### 403 Forbidden
```json
{
  "status": "fail",
  "statusCode": 403,
  "message": "You can only delete your own reviews",
  "details": null
}
```

### 404 Not Found
```json
{
  "status": "fail",
  "statusCode": 404,
  "message": "Review not found",
  "details": null
}
```

**Business Reviews Specific Errors:**
```json
{
  "status": "fail",
  "statusCode": 404,
  "message": "Business not found or inactive",
  "details": null
}
```

**Video Upload Errors:**
```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "Invalid file type. Only video files are allowed",
  "details": null
}
```

```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "File too large. Maximum size is 100MB",
  "details": null
}
```

### 500 Internal Server Error
```json
{
  "status": "fail",
  "statusCode": 500,
  "message": "Failed to create review",
  "details": {
    "originalError": "Database connection failed"
  }
}
```

## Data Models

### Review
```typescript
interface Review {
  id: string;
  userId: string;
  rating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  badges?: string;
  caption?: string;
  hashtags: string[];
  title?: string;
  video_url?: string;
  businessId?: string;
  views: number;
  createdAt: Date;
  user: UserSummary;
  business?: UserSummary;
  likes: Like[];
  comments: Comment[];
}
```

### UserSummary
```typescript
interface UserSummary {
  id: string;
  username: string;
  user_type: 'INDIVIDUAL' | 'BUSINESS' | 'ADMIN';
  logo_url?: string;
}
```

## Video Upload

- **Supported formats**: All video/* MIME types
- **Maximum file size**: 100MB
- **Storage**: Videos are uploaded to AWS S3
- **File naming**: `review-{timestamp}.{extension}`
- **Path structure**: `videos/{userId}/{filename}`

## Rate Limiting

Rate limiting is implemented for all review endpoints:
- **General endpoints**: 100 requests per 15 minutes per IP
- **Sensitive operations**: 20 requests per 15 minutes per IP

## Security Considerations

1. **Authentication**: All write operations require valid access tokens
2. **Authorization**: Users can only delete their own reviews
3. **File validation**: Only video files are accepted
4. **File size limits**: 100MB maximum file size
5. **Input validation**: All inputs are validated and sanitized

## Testing

Run the test suite to ensure the API works correctly:

```bash
npm test -- --testPathPattern=review
```

## Environment Variables

Ensure these environment variables are set:

```env
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_BUCKET_NAME=your-bucket-name
AWS_BUCKET_URL=https://your-bucket.s3.region.amazonaws.com
```
