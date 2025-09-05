# Category API Documentation

## Overview

The Category API provides comprehensive management of business and individual user categories in the Tapsy platform. Categories help organize users and content, enabling better discovery and filtering capabilities.

## Table of Contents

- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)
- [Business Logic](#business-logic)

## API Endpoints

### Base URL
```
/api/categories
```

### 1. Create Category (Admin Only)

**POST** `/api/categories`

Creates a new category in the system.

#### Authentication
- **Required**: Yes
- **Role**: ADMIN only

#### Request Body
```json
{
  "name": "string",
  "slug": "string", 
  "status": "boolean",
  "audience": "INDIVIDUAL | BUSINESS | BOTH",
  "sort_order": "number"
}
```

#### Request Body Schema
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Category display name |
| `slug` | string | Yes | URL-friendly identifier (must be unique) |
| `status` | boolean | Yes | Whether category is active |
| `audience` | enum | Yes | Target audience: `INDIVIDUAL`, `BUSINESS`, or `BOTH` |
| `sort_order` | number | Yes | Display order (lower numbers appear first) |

#### Response
- **201**: Category created successfully
- **400**: Bad request (validation error)
- **401**: Unauthorized
- **403**: Forbidden (not admin)
- **409**: Category already exists (duplicate slug)

#### Example Request
```bash
curl -X POST /api/categories \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Restaurants",
    "slug": "restaurants",
    "status": true,
    "audience": "BOTH",
    "sort_order": 1
  }'
```

#### Example Response
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Restaurants",
  "slug": "restaurants",
  "audience": "BOTH",
  "status": true,
  "sort_order": 1,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 2. Get All Categories

**GET** `/api/categories`

Retrieves all categories with user count information.

#### Authentication
- **Required**: No

#### Response
- **200**: List of categories retrieved successfully

#### Example Response
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Restaurants",
    "slug": "restaurants",
    "audience": "BOTH",
    "status": true,
    "sort_order": 1,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "_count": {
      "users": 42
    }
  }
]
```

### 3. Get Active Categories

**GET** `/api/categories/active`

Retrieves only active categories that users can select from. This endpoint is optimized for user selection interfaces.

#### Authentication
- **Required**: No

#### Response
- **200**: List of active categories

#### Example Response
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Restaurants",
    "slug": "restaurants",
    "status": true,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Retail",
    "slug": "retail",
    "status": true,
    "createdAt": "2024-01-15T10:31:00Z"
  }
]
```

### 4. Get Category by ID

**GET** `/api/categories/{id}`

Retrieves a specific category by its ID.

#### Authentication
- **Required**: No

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Category ID |

#### Response
- **200**: Category found
- **404**: Category not found

#### Example Response
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Restaurants",
  "slug": "restaurants",
  "audience": "BOTH",
  "status": true,
  "sort_order": 1,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "_count": {
    "users": 42
  }
}
```

### 5. Update Category (Admin Only)

**PUT** `/api/categories/{id}`

Updates an existing category.

#### Authentication
- **Required**: Yes
- **Role**: ADMIN only

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Category ID |

#### Request Body
```json
{
  "name": "string",
  "slug": "string",
  "status": "boolean",
  "audience": "INDIVIDUAL | BUSINESS | BOTH",
  "sort_order": "number"
}
```

#### Response
- **200**: Category updated successfully
- **400**: Bad request
- **401**: Unauthorized
- **403**: Forbidden (not admin)
- **404**: Category not found

#### Example Request
```bash
curl -X PUT /api/categories/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Food & Dining",
    "status": false
  }'
```

### 6. Delete Category (Admin Only)

**DELETE** `/api/categories/{id}`

Deletes a category from the system.

#### Authentication
- **Required**: Yes
- **Role**: ADMIN only

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Category ID |

#### Response
- **204**: Category deleted successfully
- **401**: Unauthorized
- **403**: Forbidden (not admin)
- **404**: Category not found

## Data Models

### Category Model

```typescript
interface Category {
  id: string;                    // UUID
  name: string;                  // Display name
  slug: string;                  // URL-friendly identifier (unique)
  audience: CategoryAudience;    // Target audience
  status: boolean;               // Active/inactive status
  sort_order: number;            // Display order
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

### CategoryAudience Enum

```typescript
enum CategoryAudience {
  INDIVIDUAL = "INDIVIDUAL",     // For individual users only
  BUSINESS = "BUSINESS",         // For business users only
  BOTH = "BOTH"                  // For both user types
}
```

### Category with User Count

```typescript
interface CategoryWithCount extends Category {
  _count: {
    users: number;               // Number of users in this category
  };
}
```

## Authentication

### Admin Authentication
Most category management operations require admin authentication:

```bash
Authorization: Bearer <admin_access_token>
```

### Token Requirements
- Valid JWT access token
- User must have `ADMIN` role
- Token must not be expired

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "Validation error message",
  "details": {
    "field": "specific field error"
  }
}
```

#### 401 Unauthorized
```json
{
  "status": "fail",
  "statusCode": 401,
  "message": "User not authenticated"
}
```

#### 403 Forbidden
```json
{
  "status": "fail",
  "statusCode": 403,
  "message": "Admin access required"
}
```

#### 404 Not Found
```json
{
  "status": "fail",
  "statusCode": 404,
  "message": "Category not found"
}
```

#### 409 Conflict
```json
{
  "status": "fail",
  "statusCode": 409,
  "message": "Category already exists with the given unique field(s)",
  "details": {
    "target": ["slug"]
  }
}
```

#### 500 Internal Server Error
```json
{
  "status": "fail",
  "statusCode": 500,
  "message": "Database error while creating category",
  "details": {
    "code": "P2002",
    "meta": "error details"
  }
}
```

## Usage Examples

### 1. Creating Categories for Different Audiences

#### Individual User Categories
```bash
curl -X POST /api/categories \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Personal Interests",
    "slug": "personal-interests",
    "status": true,
    "audience": "INDIVIDUAL",
    "sort_order": 1
  }'
```

#### Business Categories
```bash
curl -X POST /api/categories \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Professional Services",
    "slug": "professional-services",
    "status": true,
    "audience": "BUSINESS",
    "sort_order": 2
  }'
```

#### Universal Categories
```bash
curl -X POST /api/categories \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Food & Dining",
    "slug": "food-dining",
    "status": true,
    "audience": "BOTH",
    "sort_order": 3
  }'
```

### 2. Retrieving Categories for User Selection

#### Get All Active Categories
```bash
curl -X GET /api/categories/active
```

#### Get Specific Category Details
```bash
curl -X GET /api/categories/550e8400-e29b-41d4-a716-446655440000
```

### 3. Managing Category Status

#### Deactivate Category
```bash
curl -X PUT /api/categories/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": false
  }'
```

#### Update Category Order
```bash
curl -X PUT /api/categories/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sort_order": 5
  }'
```

## Business Logic

### Category Management Rules

1. **Unique Slugs**: Each category must have a unique slug for URL-friendly identification
2. **Audience Targeting**: Categories can target specific user types or both
3. **Status Control**: Only active categories are available for user selection
4. **Sort Order**: Categories are displayed in ascending order by `sort_order`
5. **User Count**: The system tracks how many users are associated with each category

### Data Validation

#### Required Fields
- `name`: Must be a non-empty string
- `slug`: Must be unique and URL-friendly
- `status`: Must be a boolean value
- `audience`: Must be one of: `INDIVIDUAL`, `BUSINESS`, `BOTH`
- `sort_order`: Must be a positive integer

#### Slug Validation
- Must be URL-friendly (lowercase, alphanumeric, hyphens only)
- Must be unique across all categories
- Cannot be empty or contain spaces

### Database Constraints

#### Unique Constraints
- `slug`: Must be unique across all categories

#### Foreign Key Relationships
- Categories are linked to users through the `UserCategory` junction table
- Deleting a category will affect user-category associations

### Performance Considerations

1. **Active Categories Query**: Optimized with database index on `status` field
2. **User Count**: Calculated using database aggregation for performance
3. **Sort Order**: Database-level ordering for consistent results

## Integration Notes

### Frontend Integration
- Use `/api/categories/active` for user selection interfaces
- Use `/api/categories` for admin management interfaces
- Implement proper error handling for all API responses

### Mobile App Integration
- Cache active categories for offline use
- Implement proper loading states for category selection
- Handle network errors gracefully

### Admin Panel Integration
- Implement proper form validation matching API requirements
- Show user count for each category in management interface
- Provide bulk operations for category management

## Related APIs

- **User Category Assignment**: `/api/user-categories` - Assign categories to users
- **User Management**: `/api/users` - User management and profiles
- **Review System**: `/api/reviews` - Reviews can be filtered by business categories

## Changelog

### Version 1.0.0
- Initial category management API
- Support for individual, business, and universal categories
- Admin-only creation and management
- Public read access for active categories
