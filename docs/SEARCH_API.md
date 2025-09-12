# Search API Documentation

## Overview

The Search API provides comprehensive business discovery functionality with Redis caching, Google Maps integration, and advanced filtering capabilities. It includes features for searching businesses, managing search history, and discovering trending businesses.

## Features

- **Multi-source Search**: Combines local database with Google Maps API
- **Redis ZSET Caching**: Efficient recent searches with automatic deduplication
- **Search History**: Database storage for analytics and user convenience
- **Location-based Search**: Distance filtering and sorting
- **Category Filtering**: Search within specific business categories
- **Trending Businesses**: Discover popular businesses based on recent activity

## Base URL

All search endpoints are prefixed with `/api/search`

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### 1. Search Businesses

Search for businesses across multiple sources with advanced filtering.

**POST** `/api/search/businesses`

#### Headers
- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`

#### Request Body

```json
{
  "query": "coffee shop",
  "categoryIds": ["uuid1", "uuid2"],
  "rating": 4.0,
  "radius": 5000,
  "page": 1,
  "limit": 20,
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query (business name, keyword, etc.) |
| categoryIds | array | No | Filter by category UUIDs |
| rating | number | No | Minimum rating filter (1-5) |
| radius | number | No | Search radius in meters (1-50000) |
| page | number | No | Page number for pagination (default: 1) |
| limit | number | No | Results per page (1-100, default: 20) |
| latitude | number | No | User's latitude for location-based search |
| longitude | number | No | User's longitude for location-based search |

#### Success Response (200)

```json
{
  "status": "success",
  "message": "Search completed successfully",
  "data": {
    "businesses": [
      {
        "id": "business-uuid",
        "username": "coffee_central",
        "name": "Coffee Central",
        "logo_url": "https://example.com/logo.jpg",
        "about": "Best coffee in town",
        "email": "info@coffeecentral.com",
        "website": "https://coffeecentral.com",
        "rating": 4.5,
        "ratingCount": 128,
        "distance": 1250,
        "source": "local",
        "categories": [
          {
            "category": {
              "id": "category-uuid",
              "name": "Coffee Shop"
            }
          }
        ],
        "locations": [
          {
            "id": "location-uuid",
            "address": "123 Main St",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "city": "New York",
            "state": "NY",
            "country": "USA"
          }
        ],
        "_count": {
          "businessReviews": 128,
          "followers": 45
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    },
    "sources": {
      "local": 12,
      "google": 8
    },
    "query": "coffee shop",
    "filters": {
      "categoryIds": [],
      "rating": 4.0,
      "radius": 5000
    }
  }
}
```

### 2. Get Businesses by Category

Get businesses filtered by specific categories with advanced sorting.

**POST** `/api/search/categories`

#### Request Body

```json
{
  "categoryIds": ["category-uuid-1", "category-uuid-2"],
  "rating": 4.0,
  "search": "premium",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 3000,
  "page": 1,
  "limit": 15,
  "sortBy": "rating",
  "sortOrder": "desc"
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| categoryIds | array | Yes | Category UUIDs to filter by |
| rating | number | No | Minimum rating filter |
| search | string | No | Additional text search within category |
| latitude | number | No | User's latitude |
| longitude | number | No | User's longitude |
| radius | number | No | Search radius in meters |
| page | number | No | Page number |
| limit | number | No | Results per page |
| sortBy | string | No | Sort by: "rating", "reviews", "name", "distance" |
| sortOrder | string | No | Sort order: "asc", "desc" |

### 3. Get Recent Searches

Retrieve user's recent searches from Redis cache.

**GET** `/api/search/recent`

#### Success Response (200)

```json
{
  "status": "success",
  "message": "Recent searches fetched successfully",
  "data": {
    "searches": [
      "coffee shop near me",
      "pizza restaurant",
      "gym membership"
    ],
    "count": 3
  }
}
```

### 4. Get Search History

Retrieve complete search history from database with pagination.

**GET** `/api/search/history?page=1&limit=20`

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Results per page (1-100, default: 20) |

#### Success Response (200)

```json
{
  "status": "success",
  "message": "Search history fetched successfully",
  "data": {
    "searches": [
      {
        "id": "search-uuid",
        "searchText": "coffee shop",
        "status": "COMPLETED",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

### 5. Clear Recent Searches

Clear all recent searches from Redis cache.

**DELETE** `/api/search/recent`

#### Success Response (200)

```json
{
  "status": "success",
  "message": "Recent searches cleared successfully",
  "data": {
    "userId": "user-uuid",
    "message": "Recent searches cleared successfully"
  }
}
```

### 6. Search Google Places

Direct search using Google Places API.

**POST** `/api/search/google-places`

#### Request Body

```json
{
  "query": "restaurant",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 2000
}
```

#### Success Response (200)

```json
{
  "status": "success",
  "message": "Google Places search completed successfully",
  "data": {
    "places": [
      {
        "place_id": "ChIJ...",
        "name": "Amazing Restaurant",
        "formatted_address": "456 Broadway, New York, NY",
        "rating": 4.3,
        "user_ratings_total": 89,
        "price_level": 2,
        "types": ["restaurant", "food", "establishment"],
        "geometry": {
          "location": {
            "lat": 40.7128,
            "lng": -74.0060
          }
        },
        "photos": [
          {
            "photo_reference": "photo_ref_123",
            "width": 400,
            "height": 300
          }
        ]
      }
    ],
    "query": "restaurant",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "radius": 2000
    },
    "count": 10
  }
}
```

### 7. Get Popular Businesses

Get trending businesses based on recent activity.

**GET** `/api/search/popular?limit=10&timeframe=week&categoryIds=uuid1,uuid2`

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Number of results (1-50, default: 10) |
| categoryIds | array | No | Filter by categories |
| timeframe | string | No | "day", "week", "month" (default: "week") |

#### Success Response (200)

```json
{
  "status": "success",
  "message": "Popular businesses fetched successfully",
  "data": {
    "businesses": [
      {
        "id": "business-uuid",
        "name": "Trending Cafe",
        "rating": 4.7,
        "ratingCount": 234,
        "recentReviews": 15,
        "trendingScore": 987.5
      }
    ],
    "timeframe": "week",
    "total": 10
  }
}
```

### 8. Get Business Details

Get detailed information about a specific business.

**GET** `/api/search/business/{businessId}`

#### Success Response (200)

```json
{
  "status": "success",
  "message": "Business details fetched successfully",
  "data": {
    "id": "business-uuid",
    "username": "amazing_cafe",
    "name": "Amazing Cafe",
    "logo_url": "https://example.com/logo.jpg",
    "about": "Serving the best coffee since 2020",
    "email": "contact@amazingcafe.com",
    "website": "https://amazingcafe.com",
    "video_url": "https://youtube.com/watch?v=...",
    "rating": 4.6,
    "ratingCount": 145,
    "createdAt": "2020-01-15T10:00:00Z",
    "categories": [...],
    "locations": [...],
    "_count": {
      "businessReviews": 145,
      "followers": 67,
      "businessVideos": 3
    }
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "status": "error",
  "message": "Search query is required",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": "Query parameter must be a non-empty string"
  }
}
```

### 401 Unauthorized

```json
{
  "status": "error",
  "message": "User not authenticated",
  "error": {
    "code": "AUTHENTICATION_ERROR"
  }
}
```

### 500 Internal Server Error

```json
{
  "status": "error",
  "message": "Failed to perform search",
  "error": {
    "code": "INTERNAL_ERROR",
    "details": "Database connection failed"
  }
}
```

## Search Features

### Redis ZSET Implementation

Recent searches are stored using Redis Sorted Sets (ZSET) for optimal performance:

- **Key Pattern**: `recent_searches:{userId}`
- **Score**: Unix timestamp for ordering
- **Value**: Search query text
- **Auto-trim**: Keeps only 10 most recent searches
- **TTL**: 30 days automatic expiration

### Search Algorithm

1. **Local Database Search**: Searches business name, username, and description
2. **Google Maps Integration**: Location-based external results
3. **Result Combination**: Deduplicates and merges results
4. **Ranking**: Prioritizes local results, then by rating and review count

### Performance Optimizations

- Redis caching for frequent searches
- Database indexing on search fields
- Pagination for large result sets
- Async processing for external API calls
- Result deduplication and ranking

## Rate Limits

- Search endpoints: Limited by `dataFetchLimiter` middleware
- Recommended: Max 100 requests per minute per user
- Google Places API: Subject to Google's quotas and billing

## Environment Variables

Required environment variables:

```bash
GOOGLE_API_KEY=your_google_maps_api_key
TTL_SEEN_DAYS=30  # For Redis TTL configuration
```

## Usage Examples

### Basic Text Search

```javascript
const response = await fetch('/api/search/businesses', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'pizza restaurant',
    page: 1,
    limit: 10
  })
});
```

### Location-based Search

```javascript
const response = await fetch('/api/search/businesses', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'coffee shop',
    latitude: 40.7128,
    longitude: -74.0060,
    radius: 2000,
    rating: 4.0
  })
});
```

### Category Filtering

```javascript
const response = await fetch('/api/search/categories', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    categoryIds: ['restaurant-uuid', 'cafe-uuid'],
    sortBy: 'rating',
    sortOrder: 'desc',
    limit: 15
  })
});
```

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Distance is returned in meters
- Rating is calculated as `rating_sum / review_count`
- Search queries are automatically saved to history
- Recent searches are unique per user and auto-deduplicated
- Google Places results include external business data
- Trending score considers recent reviews, overall rating, and follower count
