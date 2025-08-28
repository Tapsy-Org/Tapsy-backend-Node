# Interaction API Documentation

This document describes the Interaction API endpoints for managing likes and comments on reviews in the Tapsy backend.

## Overview

The Interaction API provides functionality to:
- Like and unlike reviews
- Add, update, and delete comments on reviews
- Get likes and comments with pagination
- Support nested comment replies
- Check user like status

## Base URL

```
/api/interactions
```

## Authentication

Most endpoints require authentication via JWT Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Toggle Like/Unlike Review

**POST** `/reviews/{reviewId}/like`

Toggles the like status for a review. If the user hasn't liked the review, it will be liked. If they have already liked it, the like will be removed.

**Parameters:**
- `reviewId` (path, required): UUID of the review to like/unlike

**Request Body:** None

**Response:**
```json
{
  "status": "success",
  "message": "Review liked successfully",
  "data": {
    "liked": true,
    "message": "Review liked successfully"
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Bad request (missing review ID)
- `401`: Unauthorized
- `404`: Review not found

---

### 2. Get Review Likes

**GET** `/reviews/{reviewId}/likes`

Retrieves all users who have liked a specific review with their details.

**Parameters:**
- `reviewId` (path, required): UUID of the review
- `page` (query, optional): Page number (default: 1)
- `limit` (query, optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "status": "success",
  "message": "Review likes fetched successfully",
  "data": {
    "likes": [
      {
        "id": "like-uuid",
        "userId": "user-uuid",
        "reviewId": "review-uuid",
        "createdAt": "2024-01-01T00:00:00Z",
        "user": {
          "id": "user-uuid",
          "username": "john_doe",
          "user_type": "INDIVIDUAL",
          "logo_url": "https://example.com/logo.jpg"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 3. Check User Like Status

**GET** `/reviews/{reviewId}/like/check`

Checks whether the currently authenticated user has liked a specific review.

**Parameters:**
- `reviewId` (path, required): UUID of the review

**Response:**
```json
{
  "status": "success",
  "message": "User like status checked successfully",
  "data": {
    "hasLiked": true,
    "likedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### 4. Add Comment

**POST** `/reviews/{reviewId}/comments`

Adds a new comment to a review. Can be a top-level comment or a reply to an existing comment.

**Parameters:**
- `reviewId` (path, required): UUID of the review

**Request Body:**
```json
{
  "comment": "Great review!",
  "parentCommentId": "parent-comment-uuid" // Optional, for replies
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Comment added successfully",
  "data": {
    "id": "comment-uuid",
    "reviewId": "review-uuid",
    "userId": "user-uuid",
    "comment": "Great review!",
    "parent_comment_id": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "user": {
      "id": "user-uuid",
      "username": "john_doe",
      "user_type": "INDIVIDUAL",
      "logo_url": "https://example.com/logo.jpg"
    }
  }
}
```

---

### 5. Get Review Comments

**GET** `/reviews/{reviewId}/comments`

Retrieves all comments for a specific review with user details and nested replies.

**Parameters:**
- `reviewId` (path, required): UUID of the review
- `page` (query, optional): Page number (default: 1)
- `limit` (query, optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "status": "success",
  "message": "Review comments fetched successfully",
  "data": {
    "comments": [
      {
        "id": "comment-uuid",
        "reviewId": "review-uuid",
        "userId": "user-uuid",
        "comment": "Great review!",
        "parent_comment_id": null,
        "createdAt": "2024-01-01T00:00:00Z",
        "user": {
          "id": "user-uuid",
          "username": "john_doe",
          "user_type": "INDIVIDUAL",
          "logo_url": "https://example.com/logo.jpg"
        },
        "replies": [
          {
            "id": "reply-uuid",
            "comment": "I agree!",
            "parent_comment_id": "comment-uuid",
            "createdAt": "2024-01-01T01:00:00Z",
            "user": {
              "id": "reply-user-uuid",
              "username": "jane_doe",
              "user_type": "INDIVIDUAL",
              "logo_url": null
            }
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 6. Update Comment

**PUT** `/comments/{commentId}`

Updates an existing comment. Users can only update their own comments.

**Parameters:**
- `commentId` (path, required): UUID of the comment to update

**Request Body:**
```json
{
  "comment": "Updated comment text"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Comment updated successfully",
  "data": {
    "id": "comment-uuid",
    "comment": "Updated comment text",
    "user": {
      "id": "user-uuid",
      "username": "john_doe",
      "user_type": "INDIVIDUAL",
      "logo_url": "https://example.com/logo.jpg"
    }
  }
}
```

---

### 7. Delete Comment

**DELETE** `/comments/{commentId}`

Deletes a comment and all its replies. Users can only delete their own comments.

**Parameters:**
- `commentId` (path, required): UUID of the comment to delete

**Response:**
```json
{
  "status": "success",
  "message": "Comment deleted successfully",
  "data": {
    "message": "Comment and replies deleted successfully"
  }
}
```

---

### 8. Get Comment Replies

**GET** `/comments/{commentId}/replies`

Retrieves all replies to a specific comment with user details.

**Parameters:**
- `commentId` (path, required): UUID of the parent comment
- `page` (query, optional): Page number (default: 1)
- `limit` (query, optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "status": "success",
  "message": "Comment replies fetched successfully",
  "data": {
    "replies": [
      {
        "id": "reply-uuid",
        "comment": "I agree!",
        "parent_comment_id": "comment-uuid",
        "createdAt": "2024-01-01T01:00:00Z",
        "user": {
          "id": "reply-user-uuid",
          "username": "jane_doe",
          "user_type": "INDIVIDUAL",
          "logo_url": null
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

## Data Models

### Like Model
```typescript
interface Like {
  id: string;
  userId: string;
  reviewId: string;
  createdAt: Date;
  user: UserSummary;
}
```

### Comment Model
```typescript
interface Comment {
  id: string;
  reviewId: string;
  userId: string;
  comment: string;
  parent_comment_id?: string;
  createdAt: Date;
  user: UserSummary;
  replies?: Comment[];
}
```

### UserSummary Model
```typescript
interface UserSummary {
  id: string;
  username: string;
  user_type: 'INDIVIDUAL' | 'BUSINESS' | 'ADMIN';
  logo_url?: string;
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "Error description",
  "details": null
}
```

Common error codes:
- `400`: Bad request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found (resource doesn't exist)
- `500`: Internal server error

## Pagination

Pagination is supported for endpoints that return lists. The response includes:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Rate Limiting

Consider implementing rate limiting for:
- Like/unlike operations
- Comment creation
- Comment updates/deletions

## Security Considerations

1. **Authentication**: Most endpoints require valid JWT tokens
2. **Authorization**: Users can only modify their own comments
3. **Input Validation**: All inputs are validated and sanitized
4. **SQL Injection**: Protected via Prisma ORM
5. **XSS**: Input sanitization for comment text

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run only interaction tests
npm run test:unit -- --testPathPattern=interaction

# Run with coverage
npm run test:coverage
```

## Database Schema Changes

The following changes were made to the Prisma schema:

```prisma
model Like {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  reviewId  String   @db.Uuid
  createdAt DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id])
  review Review @relation(fields: [reviewId], references: [id])

  @@unique([userId, reviewId]) // Added unique constraint
}
```

## Migration

After updating the schema, run:

```bash
# Generate Prisma client
npm run db:generate

# Apply database changes
npm run db:dev:deploy
```

## Examples

### Like a Review
```bash
curl -X POST \
  http://localhost:3000/api/interactions/reviews/review-uuid/like \
  -H 'Authorization: Bearer your-jwt-token'
```

### Add a Comment
```bash
curl -X POST \
  http://localhost:3000/api/interactions/reviews/review-uuid/comments \
  -H 'Authorization: Bearer your-jwt-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "comment": "This is a great review!"
  }'
```

### Get Review Comments
```bash
curl -X GET \
  'http://localhost:3000/api/interactions/reviews/review-uuid/comments?page=1&limit=10'
```
