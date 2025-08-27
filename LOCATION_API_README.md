# 📍 Location API Documentation

The Location API provides comprehensive location management functionality for users in the Tapsy application. Users can create, read, update, and delete their locations, as well as discover nearby locations.

## 🔐 Authentication

Most endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

The user ID is automatically extracted from the access token by the auth middleware.

## 🚀 API Endpoints

### 1. Create Location
**POST** `/api/locations`

Creates a new location for the authenticated user.

**Request Body:**
```json
{
  "location": "123 Main Street",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "location_type": "HOME",
  "city": "New York",
  "state": "NY",
  "country": "USA"
}
```

**Required Fields:**
- `location`: Street address
- `latitude`: Latitude coordinate (-90 to 90)
- `longitude`: Longitude coordinate (-180 to 180)
- `location_type`: One of "HOME", "WORK", or "OTHER"

**Optional Fields:**
- `city`: City name
- `state`: State/province name
- `country`: Country name

**Response:**
```json
{
  "status": "success",
  "message": "Location created successfully",
  "data": {
    "id": "uuid",
    "userId": "user_uuid",
    "location": "123 Main Street",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "location_type": "HOME",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Get User Locations
**GET** `/api/locations`

Retrieves all locations for the authenticated user.

**Response:**
```json
{
  "status": "success",
  "message": "User locations retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "userId": "user_uuid",
      "location": "123 Main Street",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "location_type": "HOME",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 3. Get Location by ID
**GET** `/api/locations/:locationId`

Retrieves a specific location by ID (must belong to the authenticated user).

**Response:**
```json
{
  "status": "success",
  "message": "Location retrieved successfully",
  "data": {
    "id": "uuid",
    "userId": "user_uuid",
    "location": "123 Main Street",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "location_type": "HOME",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Update Location
**PUT** `/api/locations/:locationId`

Updates a specific location (must belong to the authenticated user).

**Request Body:**
```json
{
  "location": "456 Oak Avenue",
  "latitude": 40.7589,
  "longitude": -73.9851,
  "city": "New York"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Location updated successfully",
  "data": {
    "id": "uuid",
    "userId": "user_uuid",
    "location": "456 Oak Avenue",
    "latitude": 40.7589,
    "longitude": -73.9851,
    "location_type": "HOME",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### 5. Delete Location
**DELETE** `/api/locations/:locationId`

Deletes a specific location (must belong to the authenticated user).

**Response:**
```json
{
  "status": "success",
  "message": "Location deleted successfully",
  "data": {
    "message": "Location deleted successfully"
  }
}
```

### 6. Get Nearby Locations
**GET** `/api/locations/nearby?latitude=40.7128&longitude=-74.0060&radius=10`

Retrieves locations within a specified radius (public endpoint, no authentication required).

**Query Parameters:**
- `latitude`: Center point latitude (required)
- `longitude`: Center point longitude (required)
- `radius`: Search radius in kilometers (optional, default: 10km, max: 100km)

**Response:**
```json
{
  "status": "success",
  "message": "Nearby locations retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "userId": "user_uuid",
      "location": "123 Main Street",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "location_type": "HOME",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": "user_uuid",
        "username": "john_doe",
        "user_type": "INDIVIDUAL",
        "logo_url": "https://example.com/logo.jpg"
      }
    }
  ]
}
```

## 🔒 Security Features

- **User Isolation**: Users can only access, modify, or delete their own locations
- **Input Validation**: All coordinates and location types are validated
- **Authentication Required**: Most endpoints require valid access tokens
- **Public Nearby Search**: Nearby locations endpoint is public for discovery

## 📍 Location Types

- **HOME**: User's home address
- **WORK**: User's workplace address
- **OTHER**: Any other location (gym, restaurant, etc.)

## 🌍 Coordinate Validation

- **Latitude**: Must be between -90 and 90 degrees
- **Longitude**: Must be between -180 and 180 degrees
- **Radius**: Must be between 0 and 100 kilometers

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "Missing required fields: location, latitude, longitude, location_type",
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

### 404 Not Found
```json
{
  "status": "fail",
  "statusCode": 404,
  "message": "Location not found",
  "details": null
}
```

### 500 Internal Server Error
```json
{
  "status": "fail",
  "statusCode": 500,
  "message": "Failed to create location",
  "details": null
}
```

## 🧪 Testing

You can test the API endpoints using tools like:
- Postman
- cURL
- Thunder Client (VS Code extension)

### Example cURL Commands

**Create Location:**
```bash
curl -X POST http://localhost:3000/api/locations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "123 Main Street",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "location_type": "HOME",
    "city": "New York"
  }'
```

**Get User Locations:**
```bash
curl -X GET http://localhost:3000/api/locations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Get Nearby Locations:**
```bash
curl -X GET "http://localhost:3000/api/locations/nearby?latitude=40.7128&longitude=-74.0060&radius=5"
```

## 🔧 Implementation Details

The Location API is built with:
- **TypeScript** for type safety
- **Prisma ORM** for database operations
- **Express.js** for routing and middleware
- **Custom middleware** for authentication and response formatting
- **Input validation** for data integrity
- **Error handling** with custom AppError class

## 📁 File Structure

```
src/
├── controllers/
│   └── location.controller.ts    # Location API controllers
├── services/
│   └── location.service.ts       # Location business logic
├── routes/
│   └── location.routes.ts        # Location API routes
├── middlewares/
│   ├── auth.middleware.ts        # Authentication middleware
│   └── response.middleware.ts    # Response formatting middleware
└── types/
    └── express/
        └── index.d.ts            # TypeScript type definitions
```
