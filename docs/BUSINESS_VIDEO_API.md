# Business Video API Documentation

## Overview

The Business Video API provides comprehensive functionality for managing business video content. This API allows businesses to upload, retrieve, update, and delete promotional videos with features like hashtag filtering, pagination, and file management through AWS S3.

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Create Business Video](#create-business-video)
  - [Get Business Videos by Business ID](#get-business-videos-by-business-id)
  - [Get Business Video by ID](#get-business-video-by-id)
  - [Update Business Video](#update-business-video)
  - [Delete Business Video](#delete-business-video)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

**User Types:**
- `BUSINESS`: Required for create, update, and delete operations
- `BUSINESS` or `ADMIN`: Required for delete operations (admin can delete any video)
- Any authenticated user: Can view videos

## Rate Limiting

All endpoints are protected by rate limiting middleware:
- **Rate Limit**: Configured via `businessVideoLimiter`
- **Purpose**: Prevents abuse and ensures fair usage

## Endpoints

### Create Business Video

Creates a new business video with file upload to AWS S3.

**Endpoint:** `POST /api/business-videos/`

**Authentication:** Required (BUSINESS user type)

**Content-Type:** `multipart/form-data`

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Title of the business video |
| `caption` | string | No | Optional caption for the video |
| `hashtags` | string | Yes | Comma-separated hashtags or array |
| `video` | file | Yes | Video file to upload (max 100MB) |

#### File Requirements

- **Maximum Size**: 100MB
- **Supported Formats**: All video/* MIME types
- **Storage**: Files stored in S3 under `gallery/{userId}/video-{timestamp}.{extension}`

#### Response

**Success (201):**
```json
{
  "status": "success",
  "message": "Business video uploaded successfully"
}
```

**Error (400):**
```json
{
  "status": "fail",
  "message": "Title and hashtags are required"
}
```

**Error (401):**
```json
{
  "status": "fail",
  "message": "Business user not authenticated"
}
```

---

### Get Business Videos by Business ID

Retrieves all business videos for a specific business with pagination and hashtag filtering.

**Endpoint:** `GET /api/business-videos/{businessId}`

**Authentication:** Required (any user type)

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number for pagination |
| `limit` | integer | 10 | Number of videos per page |
| `hashtag` | string | - | Optional hashtag to filter videos |

#### Response

**Success (200):**
```json
{
  "status": "success",
  "message": "Business videos fetched successfully",
  "data": {
    "videos": [
      {
        "id": "video-uuid",
        "businessId": "business-uuid",
        "title": "Promotional Video",
        "caption": "Summer Sale Launch",
        "hashtags": ["#sale", "#summer"],
        "video_url": "https://cdn.example.com/video.mp4",
        "status": "ACTIVE",
        "createdAt": "2025-09-12T16:58:51.554Z",
        "updatedAt": "2025-09-12T16:58:51.554Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

---

### Get Business Video by ID

Retrieves a single business video by its unique ID.

**Endpoint:** `GET /api/business-videos/businessvidoeId/{id}`

**Authentication:** Required (any user type)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | The unique ID of the business video |

#### Response

**Success (200):**
```json
{
  "status": "success",
  "message": "Business video fetched successfully",
  "data": {
    "id": "video-uuid",
    "businessId": "business-uuid",
    "title": "Promotional Video",
    "caption": "Check out our latest services",
    "hashtags": ["#promo", "#business"],
    "video_url": "https://cdn.example.com/video.mp4",
    "status": "ACTIVE",
    "createdAt": "2025-09-12T16:58:51.554Z",
    "updatedAt": "2025-09-12T17:30:15.123Z"
  }
}
```

**Error (404):**
```json
{
  "status": "fail",
  "message": "Business video not found"
}
```

---

### Update Business Video

Updates one or more fields of a business video. Only the owner can update their videos.

**Endpoint:** `PATCH /api/business-videos/update/{id}`

**Authentication:** Required (BUSINESS user type)

**Content-Type:** `multipart/form-data`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | The ID of the business video to update |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Video title |
| `caption` | string | No | Video caption |
| `hashtags` | string | No | Comma-separated hashtags |
| `status` | string | No | Status: ACTIVE, INACTIVE, DELETED |
| `video` | file | No | New video file to upload |

#### Response

**Success (200):**
```json
{
  "status": "success",
  "message": "Business video updated successfully",
  "data": {
    "id": "video-uuid",
    "businessId": "business-uuid",
    "title": "Updated Video Title",
    "caption": "Updated video caption",
    "hashtags": ["#updated", "#business"],
    "video_url": "https://cdn.example.com/updated-video.mp4",
    "status": "ACTIVE",
    "createdAt": "2025-09-12T16:58:51.554Z",
    "updatedAt": "2025-09-12T17:30:15.123Z"
  }
}
```

**Error (403):**
```json
{
  "status": "fail",
  "message": "You can only update your own business videos"
}
```

---

### Delete Business Video

Permanently deletes a business video. Only the owner or admin can delete videos.

**Endpoint:** `DELETE /api/business-videos/delete/{id}`

**Authentication:** Required (BUSINESS or ADMIN user type)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | The ID of the business video to delete |

#### Response

**Success (200):**
```json
{
  "status": "success",
  "message": "Business video deleted successfully"
}
```

**Error (403):**
```json
{
  "status": "fail",
  "message": "You can only delete your own business videos"
}
```

**Error (404):**
```json
{
  "status": "fail",
  "message": "Business video not found"
}
```

## Data Models

### BusinessVideo

```typescript
interface BusinessVideo {
  id: string;           // UUID
  businessId: string;   // UUID - Reference to User
  title: string;        // Video title
  caption?: string;     // Optional caption
  hashtags: string[];   // Array of hashtags
  video_url: string;    // S3 URL
  status: Status;       // ACTIVE, INACTIVE, DELETED
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last update timestamp
}
```

### Status Enum

```typescript
enum Status {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE", 
  DELETED = "DELETED"
}
```

## Error Handling

### Common Error Responses

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| 400 | Bad Request | Missing required fields, invalid file type, invalid status value |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User not authorized for the operation |
| 404 | Not Found | Business video not found |
| 413 | Payload Too Large | File exceeds 100MB limit |
| 500 | Internal Server Error | Server-side error |

### File Upload Errors

| Error Code | Description |
|------------|-------------|
| `LIMIT_FILE_SIZE` | File exceeds 100MB limit |
| `LIMIT_UNEXPECTED_FILE` | Wrong field name (expected: `video`) |
| `INVALID_FILE_TYPE` | File is not a video |

## Examples

### cURL Examples

#### 1. Create Business Video

```bash
curl -X POST "https://api.tapsy.com/api/business-videos/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Our Amazing Product Demo" \
  -F "caption=Check out our latest product in action!" \
  -F "hashtags=product,demo,amazing,business" \
  -F "video=@/path/to/video.mp4"
```

#### 2. Get Business Videos with Pagination

```bash
curl -X GET "https://api.tapsy.com/api/business-videos/business-uuid?page=1&limit=5&hashtag=sale" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. Get Single Business Video

```bash
curl -X GET "https://api.tapsy.com/api/business-videos/businessvidoeId/video-uuid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Update Business Video

```bash
curl -X PATCH "https://api.tapsy.com/api/business-videos/update/video-uuid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Updated Video Title" \
  -F "caption=Updated caption" \
  -F "hashtags=updated,business" \
  -F "status=ACTIVE"
```

#### 5. Delete Business Video

```bash
curl -X DELETE "https://api.tapsy.com/api/business-videos/delete/video-uuid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### JavaScript/TypeScript Examples

#### 1. Create Business Video (Frontend)

```typescript
const formData = new FormData();
formData.append('title', 'Our Amazing Product Demo');
formData.append('caption', 'Check out our latest product!');
formData.append('hashtags', 'product,demo,amazing');
formData.append('video', videoFile);

const response = await fetch('/api/business-videos/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
```

#### 2. Get Videos with Pagination

```typescript
const getBusinessVideos = async (businessId: string, page = 1, limit = 10, hashtag?: string) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (hashtag) {
    params.append('hashtag', hashtag);
  }
  
  const response = await fetch(`/api/business-videos/${businessId}?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

## Implementation Notes

### File Storage

- Videos are uploaded to AWS S3
- Storage path: `gallery/{userId}/video-{timestamp}.{extension}`
- Files are stored with memory storage for processing
- Maximum file size: 100MB

### Database Indexing

- Index on `businessId` and `createdAt` for efficient querying
- Pagination uses `skip` and `take` for performance
- Hashtag filtering uses PostgreSQL array operations

### Security

- JWT authentication required for all endpoints
- Business users can only modify their own videos
- Admins can delete any video
- File type validation prevents malicious uploads

### Performance Considerations

- Pagination implemented for large result sets
- Database queries optimized with proper indexing
- S3 integration for scalable file storage
- Rate limiting prevents abuse

## Related Documentation

- [User API Documentation](./USER_API.md)
- [Authentication Guide](./AUTH_GUIDE.md)
- [File Upload Guidelines](./FILE_UPLOAD.md)
- [Database Schema Guide](./DB_SCHEMA_GUIDE.md)
