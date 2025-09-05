# 🔄 Unified User System Implementation

## 📋 Overview

We've successfully merged the separate ` User` and `BusinessUser` tables into a single, unified `User` table. This eliminates complexity and provides a cleaner, more maintainable database schema.

## 🗄️ Database Schema Changes

### ✅ **New Unified User Table:**

```sql
model User {
  id             String    @id @default(uuid())
  
  // Common fields for both user types
  user_type      UserType  @default( )
  mobile_number  String?   @unique
  email          String?   @unique
  username       String?
  device_id      String?
  status         Status    @default(ACTIVE)
  last_login     DateTime?
  created_at     DateTime  @default(now())
  updated_at     DateTime  @updatedAt
  firebase_token String?
  
  // Verification fields
  otp_verified         Boolean             @default(false)
  verification_method  VerificationMethod?
  otp                  String?
  refresh_token        String?
  
  // Business-specific fields (null for individual users)
  website        String?
  about          String?
  logo_url       String?
  video_url      String?
  
  // Category assignment (for business users - single category)
  categoryId     String?
  category       Category? @relation(fields: [categoryId], references: [id])

  // Relations
  categories            UserCategory[]
  selectedSubcategories UserSubCategory[]
  locations             Location[]        // User can have multiple locations
  
  @@index([user_type])
  @@index([mobile_number])
  @@index([email])
}
```

### ✅ **New Enums:**

```sql
enum VerificationMethod {
  MOBILE
  EMAIL
}
```

### ✅ **Updated Related Tables:**

- ❌ `IndividualUserCategory` → ✅ `UserCategory`
- ❌ `IndividualUserSubCategory` → ✅ `UserSubCategory`
- ❌ `BusinessUserSubCategory` → ✅ `UserSubCategory` (unified)
- ❌ `IndividualUserLocation` → ✅ `Location` (enhanced with full address support)

### ✅ **Enhanced Location System:**

The new `Location` table now supports comprehensive address information:

```sql
model Location {
  id            String       @id @default(uuid())
  userId        String       @db.Uuid
  address       String?      // Street address
  zip_code      String?      // Postal/ZIP code
  latitude      Float        // GPS latitude
  longitude     Float        // GPS longitude
  location      String       // General description
  location_type LocationType // HOME, WORK, OTHER
  city          String?      // City name
  state         String?      // State/Province
  country       String?      // Country name
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  
  user          User         @relation(fields: [userId], references: [id])
}
```

## 🚀 New API Endpoints

### **Unified User Management (`/api/users`)**

```bash
POST   /api/users/register              # Register user (individual or business)
POST   /api/users/login                 # Login user
GET    /api/users/{id}                  # Get user by ID
PUT    /api/users/{id}                  # Update user
POST   /api/users/{id}/deactivate       # Deactivate user
POST   /api/users/{id}/restore          # Restore user
GET    /api/users/type/{user_type}      # Get users by type (INDIVIDUAL/BUSINESS)
GET    /api/users                       # Get all users
POST   /api/users/send-otp             # Send OTP for verification
POST   /api/users/verify-otp           # Verify OTP
POST   /api/users/check-username       # Check username availability
POST   /api/users/refresh-token        # Refresh access token
POST   /api/users/logout               # Logout user
```

### **User Category Assignment (`/api/user-categories`)**

```bash
POST   /api/user-categories/assign          # Assign single category
POST   /api/user-categories/assign-multiple # Assign multiple categories
GET    /api/user-categories/user/{userId}   # Get user's categories
DELETE /api/user-categories/remove          # Remove category
```

### **User Subcategory Assignment (`/api/user-subcategories`)**

```bash
POST   /api/user-subcategories/assign     # Assign subcategory
GET    /api/user-subcategories/user/{id}  # Get user's subcategories
```

## 💡 **Complete API Documentation**

### **1. User Registration**

**POST** `/api/users/register`

#### **Individual User Registration:**
```json
{
  "idToken": "firebase-id-token-here",
  "firebase_token": "firebase-messaging-token",
  "user_type": "INDIVIDUAL",
  "username": "john_doe",
  "device_id": "device-123"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "id": "user-uuid-123",
    "user_type": "INDIVIDUAL",
    "mobile_number": "+1234567890",
    "username": "john_doe",
    "device_id": "device-123",
    "status": "ACTIVE",
    "verification_method": "MOBILE",
    "otp_verified": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "access_token": "jwt-access-token",
    "refresh_token": "jwt-refresh-token"
  }
}
```

#### **Business User Registration:**
```json
{
  "idToken": "firebase-id-token-here",
  "firebase_token": "firebase-messaging-token",
  "user_type": "BUSINESS",
  "username": "mycompany",
  "device_id": "device-123",
  "email": "business@company.com",
  "address": "123 Business St",
  "zip_code": "12345",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "location": "Downtown Business District",
  "location_type": "WORK",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "website": "https://mycompany.com",
  "about": "We are a technology consulting company",
  "logo_url": "https://mycompany.com/logo.png",
  "video_url": "https://youtube.com/watch?v=123",
  "categories": ["category-uuid-1"],
  "subcategories": ["Web Development", "Mobile Apps"]
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "id": "user-uuid-123",
    "user_type": "BUSINESS",
    "email": "business@company.com",
    "username": "mycompany",
    "device_id": "device-123",
    "status": "PENDING",
    "verification_method": "EMAIL",
    "otp_verified": false,
    "website": "https://mycompany.com",
    "about": "We are a technology consulting company",
    "logo_url": "https://mycompany.com/logo.png",
    "video_url": "https://youtube.com/watch?v=123",
    "created_at": "2024-01-01T00:00:00.000Z",
    "categories": [
      {
        "id": "user-category-uuid",
        "categoryId": "category-uuid-1",
        "user_type": "BUSINESS",
        "subcategories": ["Web Development", "Mobile Apps"],
        "category": {
          "id": "category-uuid-1",
          "name": "Technology & IT",
          "slug": "technology-it"
        }
      }
    ]
  }
}
```

### **2. User Login**

**POST** `/api/users/login`

#### **Mobile Login:**
```json
{
  "idToken": "firebase-id-token",
  "firebase_token": "firebase-messaging-token",
  "device_id": "device-123"
}
```

#### **Email Login:**
```json
{
  "email": "user@example.com",
  "device_id": "device-123"
}
```

**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "message": "Login successful",
  "data": {
    "userId": "user-uuid-123",
    "mobile_number": "+1234567890",
    "access_token": "jwt-access-token",
    "refresh_token": "jwt-refresh-token"
  }
}
```

**Response for Email Verification Required (200 OK):**
```json
{
  "status": "OTP_SENT",
  "message": "OTP has been sent to your email",
  "data": {
    "user_type": "BUSINESS"
  }
}
```

### **3. Send OTP**

**POST** `/api/users/send-otp`

```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "OTP sent successfully",
  "otp_expiry": "2024-01-01T00:10:00.000Z"
}
```

### **4. Verify OTP**

**POST** `/api/users/verify-otp`

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "OTP verified successfully",
  "data": {
    "id": "user-uuid-123",
    "user_type": "BUSINESS",
    "email": "user@example.com",
    "username": "mycompany",
    "status": "ACTIVE",
    "otp_verified": true,
    "access_token": "jwt-access-token",
    "refresh_token": "jwt-refresh-token"
  }
}
```

### **5. Check Username Availability**

**POST** `/api/users/check-username`

```json
{
  "username": "john_doe"
}
```

**Response (200 OK) - Username Available:**
```json
{
  "status": "success",
  "message": "Username is available",
  "data": {
    "username": "john_doe",
    "available": true
  }
}
```

**Response (200 OK) - Username Taken:**
```json
{
  "status": "success",
  "message": "Username is already taken",
  "data": {
    "username": "admin",
    "available": false
  }
}
```

**Response (400 Bad Request) - Invalid Username:**
```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "Username is required and must be a string",
  "details": null
}
```

### **6. Get User by ID**

**GET** `/api/users/{id}`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "User retrieved successfully",
  "data": {
    "id": "user-uuid-123",
    "user_type": "BUSINESS",
    "email": "business@company.com",
    "username": "mycompany",
    "status": "ACTIVE",
    "website": "https://mycompany.com",
    "about": "We are a technology consulting company",
    "logo_url": "https://mycompany.com/logo.png",
    "video_url": "https://youtube.com/watch?v=123",
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_login": "2024-01-01T12:00:00.000Z",
    "categories": [
      {
        "id": "user-category-uuid",
        "categoryId": "category-uuid-1",
        "user_type": "BUSINESS",
        "subcategories": ["Web Development", "Mobile Apps"],
        "category": {
          "id": "category-uuid-1",
          "name": "Technology & IT",
          "slug": "technology-it"
        }
      }
    ],
    "locations": [
      {
        "id": "location-uuid-123",
        "address": "123 Business St",
        "zip_code": "12345",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "location": "Downtown Business District",
        "location_type": "WORK",
        "city": "New York",
        "state": "NY",
        "country": "USA"
      }
    ]
  }
}
```

### **7. Update User**

**PUT** `/api/users/{id}`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "username": "updated_username",
  "website": "https://newwebsite.com",
  "about": "Updated company description"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "User updated successfully",
  "data": {
    "id": "user-uuid-123",
    "username": "updated_username",
    "website": "https://newwebsite.com",
    "about": "Updated company description",
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}
```

### **8. Get Users by Type**

**GET** `/api/users/type/{user_type}`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "user-uuid-123",
      "user_type": "BUSINESS",
      "username": "company1",
      "status": "ACTIVE",
      "logo_url": "https://example.com/logo1.png"
    },
    {
      "id": "user-uuid-456",
      "user_type": "BUSINESS",
      "username": "company2",
      "status": "ACTIVE",
      "logo_url": "https://example.com/logo2.png"
    }
  ]
}
```

### **9. Refresh Token**

**POST** `/api/users/refresh-token`

```json
{
  "refresh_token": "jwt-refresh-token"
}
```

**Response (200 OK):**
```json
{
  "access_token": "new-jwt-access-token",
  "refresh_token": "new-jwt-refresh-token"
}
```

### **10. Logout**

**POST** `/api/users/logout`

```json
{
  "refresh_token": "jwt-refresh-token"
}
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

### **11. Deactivate User**

**POST** `/api/users/{id}/deactivate`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "User deactivated successfully",
  "data": {
    "id": "user-uuid-123",
    "status": "DELETED",
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}
```

### **12. Restore User**

**POST** `/api/users/{id}/restore`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "User restored successfully",
  "data": {
    "id": "user-uuid-123",
    "status": "ACTIVE",
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}
```

## 🚨 **Error Responses**

### **400 Bad Request**
```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "Missing required fields: username, device_id",
  "details": null
}
```

### **401 Unauthorized**
```json
{
  "status": "fail",
  "statusCode": 401,
  "message": "User not authenticated",
  "details": null
}
```

### **403 Forbidden**
```json
{
  "status": "fail",
  "statusCode": 403,
  "message": "User account is not active. Please register and verify your account first",
  "details": null
}
```

### **404 Not Found**
```json
{
  "status": "fail",
  "statusCode": 404,
  "message": "User not found",
  "details": null
}
```

### **409 Conflict**
```json
{
  "status": "fail",
  "statusCode": 409,
  "message": "User with this mobile number already exists",
  "details": null
}
```

### **500 Internal Server Error**
```json
{
  "status": "fail",
  "statusCode": 500,
  "message": "Failed to register user",
  "details": {
    "originalError": "Database connection failed"
  }
}
```

## 🔐 **Authentication Headers**

All protected endpoints require the following header:

```
Authorization: Bearer <your_access_token>
```

**Example:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📱 **Firebase Integration**

### **Required Firebase Tokens:**
- **`idToken`**: Firebase ID token for user authentication
- **`firebase_token`**: Firebase Cloud Messaging token for push notifications

### **Token Validation:**
- ID tokens are automatically validated by the backend
- Mobile numbers are extracted from verified Firebase tokens
- Invalid or expired tokens return 401 Unauthorized

## 🎯 **Frontend Integration Workflow**

### **Step 2: Check Username Availability (Optional)**
```javascript
POST /api/users/check-username
{
  "username": "john_doe"
}

// Response: { "status": "success", "message": "Username is available", "data": { "username": "john_doe", "available": true } }
```

### **Step 3: User Login**
```javascript
POST /api/users/login
{
  "idToken": "firebase-token",
  "firebase_token": "fcm-token",
  "mobile_number": "+1234567890", // or email
  "device_id": "device123"
}
```

### **Step 4: OTP Verification**
```javascript
POST /api/users/{userId}/verify
{
  "verification_method": "MOBILE" // or "EMAIL"
}
```

### **Step 5: Category Selection**
```javascript
// Get available categories
GET /api/categories/active

// Assign category to user
POST /api/ -user-categories/assign
{
  "userId": "user-123",
  "categoryId": "cat-456"
}
```

### **Step 6: Subcategory Selection (AI-generated)**
```javascript
// Assign AI-generated subcategories
POST /api/ -user-subcategories/assign
{
  "userId": "user-123",
  "subcategories": ["React Development", "Node.js Development"]
}
```

## 🔧 **Business Logic Differences**

### **  Users:**
- ✅ Can have **multiple categories** (many-to-many via `UserCategory`)
- ✅ Can have **multiple subcategories** (stored as text in `UserSubCategory`)
- ✅ Registration requires: mobile OR email + username (optional)

### **Business Users:**
- ✅ Can have **one category** (direct foreign key `categoryId` on User table)
- ✅ Can have **multiple subcategories** (same `UserSubCategory` table)
- ✅ Registration requires: mobile OR email + business_name (required)

## 📊 **Key Benefits**

1. **✅ Simplified Schema:** Single user table instead of two separate tables
2. **✅ Unified Authentication:** Same login/registration flow for both user types
3. **✅ Flexible Contact Methods:** Support both mobile and email verification
4. **✅ Clear Verification Flow:** Explicit verification status and method tracking
5. **✅ Enhanced Location System:** Comprehensive address support with GPS coordinates
6. **✅ Better Performance:** Reduced JOINs and simplified queries
7. **✅ Easier Maintenance:** Single codebase for user management
8. **✅ Rich Location Data:** Support for street addresses, cities, states, and countries

## 🔄 **Migration Strategy**

1. **✅ Schema Updated:** New unified User table created
2. **✅ Services Created:** New UserService with comprehensive functionality
3. **✅ Controllers Created:** New UserController with all endpoints
4. **✅ Routes Created:** Complete API routes with Swagger documentation
5. **✅ Category/Subcategory Services:** Updated to work with unified User table
6. **🔄 Legacy Services:** Old  User services need migration to UserService

## 🎯 **Usage Example**

```javascript
// Registration for Individual User
const individualUser = {
  user_type: "INDIVIDUAL",
  username: "john_doe",
  device_id: "device123",
  idToken: "firebase-token",
  firebase_token: "fcm-token"
  // Mobile number extracted from Firebase token
}

// Registration for Business User  
const businessUser = {
  user_type: "BUSINESS",
  email: "business@company.com",
  username: "mycompany",
  device_id: "device123",
  // Location information
  address: "123 Business St",
  zip_code: "12345",
  latitude: 40.7128,
  longitude: -74.0060,
  location: "Downtown Business District",
  location_type: "WORK",
  city: "New York",
  state: "NY",
  country: "USA",
  // Business details
  website: "https://mycompany.com",
  about: "We are a technology consulting company",
  logo_url: "https://mycompany.com/logo.png",
  video_url: "https://youtube.com/watch?v=123",
  // Categories
  categories: ["category-id-1"],
  subcategories: ["Web Development", "Mobile Apps"],
  idToken: "firebase-token",
  firebase_token: "fcm-token"
}
```

## ✅ **Ready for Production**

The unified user system is fully implemented and ready for use! All new endpoints are tested and working correctly. The system now provides:

- 🎯 Clean, unified user management
- 🔐 Flexible authentication (mobile/email)
- 📱 Proper OTP verification workflow
- 🏷️ Smart category assignment (individual = multiple, business = single)
- 📝 AI-powered subcategory support
- 📍 Enhanced location system with full address support
- 🌍 GPS coordinates and comprehensive address fields
- 📚 Complete Swagger documentation
- ✅ Full test coverage

**Next Steps:** Migrate existing frontend code to use the new `/api/users` endpoints instead of the old individual/business specific endpoints.

## 📚 **Additional Documentation**

For detailed information about the User Category System, see:
- **[🏷️ User Category System Documentation](./USER_CATEGORY_SYSTEM.md)** - Complete guide to category and subcategory management
- **[📍 Location API Documentation](./LOCATION_API_README.md)** - Enhanced location system with full address support
