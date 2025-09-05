# Notification API Documentation

This document describes the Notification API endpoints for the Tapsy backend.

## Overview

The Notification API allows users to create, read, and manage notifications with real-time updates via WebSocket. The system supports various notification types including likes, comments, follows, mentions, messages, and system notifications. Notifications are automatically archived when marked as read.

## Authentication

All protected endpoints require a valid Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

**Note:** Create notification endpoint requires ADMIN access. User endpoints are for authenticated users only.

## Real-time Features

The notification system includes real-time WebSocket support:
- **Event**: `NEW_NOTIFICATION` - Emitted when a new notification is created
- **Condition**: Only sent to users who are currently online
- **Data**: Complete notification object

## Endpoints

### 1. Create Notification

**POST** `/notifications`

Creates a new notification and sends real-time update if the user is online.

**Headers:**
- `Authorization: Bearer <access_token>` (required - ADMIN only)

**Body (application/json):**
- `userId` (required): ID of the user to receive the notification
- `senderId` (optional): ID of the user sending the notification
- `type` (required): Type of notification (LIKE, COMMENT, FOLLOW, MENTION, MESSAGE, SYSTEM)
- `referenceId` (optional): ID of the referenced object (post, comment, etc.)
- `image_url` (optional): URL of the notification image
- `status` (optional): Status of the notification (ACTIVE, INACTIVE) - defaults to ACTIVE

**Example Request:**
```bash
curl -X POST http://localhost:3000/notifications \
  -H "Authorization: Bearer <admin_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-123",
    "senderId": "user-uuid-456",
    "type": "LIKE",
    "referenceId": "post-uuid-789",
    "image_url": "https://example.com/avatar.jpg"
  }'
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Notification created successfully",
  "data": {
    "id": "notification-uuid-123",
    "userId": "user-uuid-123",
    "senderId": "user-uuid-456",
    "type": "LIKE",
    "referenceId": "post-uuid-789",
    "title": "New Like",
    "content": "John Doe liked your post",
    "image_url": "https://example.com/avatar.jpg",
    "is_read": false,
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Get My Notifications

**GET** `/notifications/my`

Retrieves unread notifications for the authenticated user with optional filtering and pagination.

**Headers:**
- `Authorization: Bearer <access_token>` (required)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by notification type (LIKE, COMMENT, FOLLOW, MENTION, MESSAGE, SYSTEM)

**Example Request:**
```bash
curl -H "Authorization: Bearer <access_token>" \
  "http://localhost:3000/notifications/my?page=1&limit=20&type=LIKE"
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Your notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": "notification-uuid-123",
        "userId": "user-uuid-123",
        "senderId": "user-uuid-456",
        "type": "LIKE",
        "referenceId": "post-uuid-789",
        "title": "New Like",
        "content": "John Doe liked your post",
        "image_url": "https://example.com/avatar.jpg",
        "is_read": false,
        "status": "ACTIVE",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "nextCursor": "notification-uuid-124"
  }
}
```

### 3. Get My Unread Count

**GET** `/notifications/my/unread-count`

Retrieves the count of unread notifications for the authenticated user.

**Headers:**
- `Authorization: Bearer <access_token>` (required)

**Example Request:**
```bash
curl -H "Authorization: Bearer <access_token>" \
  "http://localhost:3000/notifications/my/unread-count"
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Unread count retrieved successfully",
  "data": 5
}
```

### 4. Mark My Notification as Read

**PATCH** `/notifications/my/:id/mark-read`

Marks a specific notification as read and archives it.

**Headers:**
- `Authorization: Bearer <access_token>` (required)

**Example Request:**
```bash
curl -X PATCH \
  -H "Authorization: Bearer <access_token>" \
  "http://localhost:3000/notifications/my/notification-uuid-123/mark-read"
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Notification marked as read successfully",
  "data": {
    "id": "notification-uuid-123",
    "userId": "user-uuid-123",
    "senderId": "user-uuid-456",
    "type": "LIKE",
    "referenceId": "post-uuid-789",
    "title": "New Like",
    "content": "John Doe liked your post",
    "image_url": "https://example.com/avatar.jpg",
    "is_read": true,
    "status": "ARCHIVED",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. Mark All My Notifications as Read

**PATCH** `/notifications/my/mark-all-read`

Marks all notifications for the authenticated user as read and archives them.

**Headers:**
- `Authorization: Bearer <access_token>` (required)

**Example Request:**
```bash
curl -X PATCH \
  -H "Authorization: Bearer <access_token>" \
  "http://localhost:3000/notifications/my/mark-all-read"
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "All notifications marked as read successfully",
  "data": {
    "count": 5
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "Invalid input data",
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
  "message": "Admin access required",
  "details": null
}
```

### 404 Not Found
```json
{
  "status": "fail",
  "statusCode": 404,
  "message": "User not found",
  "details": null
}
```

### 500 Internal Server Error
```json
{
  "status": "fail",
  "statusCode": 500,
  "message": "Failed to create notification",
  "details": {
    "originalError": "Database connection failed"
  }
}
```

## Data Models

### Notification
```typescript
interface Notification {
  id: string;
  userId: string;
  senderId?: string;
  type: NotificationType;
  referenceId?: string;
  title: string;
  content: string;
  image_url?: string;
  is_read: boolean;
  status: NotificationStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

### NotificationType
```typescript
type NotificationType = 
  | 'LIKE'        // User liked a post/review
  | 'COMMENT'     // User commented on a post/review
  | 'FOLLOW'      // User followed another user
  | 'MENTION'     // User was mentioned in a post/comment
  | 'MESSAGE'     // User received a direct message
  | 'SYSTEM';     // System-generated notification
```

### NotificationStatus
```typescript
type NotificationStatus = 
  | 'ACTIVE'      // Notification is active and visible
  | 'ARCHIVED';   // Notification is archived (read notifications)
```

## Real-time WebSocket Events

### NEW_NOTIFICATION
Emitted when a new notification is created for an online user.

**Event Data:**
```json
{
  "id": "notification-uuid-123",
  "userId": "user-uuid-123",
  "senderId": "user-uuid-456",
  "type": "LIKE",
  "referenceId": "post-uuid-789",
  "title": "New Like",
  "content": "John Doe liked your post",
  "image_url": "https://example.com/avatar.jpg",
  "is_read": false,
  "status": "ACTIVE",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Client-side Usage:**
```javascript
// Listen for new notifications
socket.on('NEW_NOTIFICATION', (notification) => {
  console.log('New notification:', notification);
  // Update UI with new notification
  updateNotificationUI(notification);
});
```

## Notification Text Generation

The system automatically generates notification titles and content based on the notification type and sender information:

- **LIKE**: "New Like" / "{senderUsername} liked your post"
- **COMMENT**: "New Comment" / "{senderUsername} commented on your post"
- **FOLLOW**: "New Follower" / "{senderUsername} started following you"
- **MENTION**: "You were mentioned" / "{senderUsername} mentioned you"
- **MESSAGE**: "New Message" / "{senderUsername} sent you a message"
- **SYSTEM**: "System Notification" / "{systemMessage}"

## Security Considerations

1. **Admin Access**: Create notification endpoint requires ADMIN user type for security
2. **User Access**: User endpoints are restricted to authenticated users only
3. **User Validation**: All user IDs are validated before processing
4. **Real-time Security**: WebSocket events are only sent to authenticated users
5. **Input Validation**: All inputs are validated and sanitized
6. **Rate Limiting**: Rate limiting is implemented for all endpoints
7. **Auto-Archive**: Notifications are automatically archived when marked as read

## Integration Examples

### Creating a Like Notification
```javascript
// When a user likes a post
const createLikeNotification = async (postId, likerId, postOwnerId) => {
  const response = await fetch('/notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: postOwnerId,
      senderId: likerId,
      type: 'LIKE',
      referenceId: postId
    })
  });
  
  return response.json();
};
```

### Getting My Notifications
```javascript
// Get my notifications with filtering
const getMyNotifications = async (type = null, page = 1, limit = 20) => {
  const params = new URLSearchParams({ page, limit });
  if (type) params.append('type', type);
  
  const response = await fetch(`/notifications/my?${params}`, {
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  return response.json();
};
```

### Real-time Notification Handling
```javascript
// WebSocket connection for real-time notifications
const socket = io('ws://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to notification service');
});

socket.on('NEW_NOTIFICATION', (notification) => {
  // Show notification toast
  showNotificationToast(notification);
  
  // Update unread count
  updateUnreadCount();
  
  // Add to notifications list
  addNotificationToList(notification);
});
```

## Testing

Run the test suite to ensure the API works correctly:

```bash
npm test -- --testPathPattern=notification
```

## Environment Variables

Ensure these environment variables are set for WebSocket support:

```env
# WebSocket Configuration
WEBSOCKET_PORT=3001
WEBSOCKET_CORS_ORIGIN=http://localhost:3000

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/tapsy_db
```

## Performance Considerations

1. **Database Indexing**: Ensure proper indexes on `userId`, `is_read`, and `createdAt` fields
2. **Pagination**: Consider implementing pagination for large notification lists
3. **Cleanup**: Implement notification cleanup for old/inactive notifications
4. **Caching**: Consider caching unread counts for better performance
5. **WebSocket Scaling**: Use Redis adapter for WebSocket scaling in production
