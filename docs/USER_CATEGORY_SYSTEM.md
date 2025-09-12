# 🏷️ User Category System Documentation

## 📋 Overview

The User Category System manages how users are categorized and subcategorized within the Tapsy application. This system provides different behaviors for individual users vs. business users, allowing for flexible categorization that matches real-world usage patterns.

## 🗄️ Database Schema

### **UserCategory Table**
```sql
model UserCategory {
  id              String   @id @default(uuid())
  userId          String   @db.Uuid
  categoryId      String   @db.Uuid
  categoriesName  String[] // Array of category names
  subcategories   String[] // Array of subcategory names
  user_type       UserType // INDIVIDUAL or BUSINESS
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id])
  category        Category @relation(fields: [categoryId], references: [id])
}
```

### **Category Table**
```sql
model Category {
  id          String           @id @default(uuid())
  name        String           @unique
  slug        String           @unique
  audience    CategoryAudience // INDIVIDUAL, BUSINESS, or BOTH
  status      Boolean          @default(true)
  sort_order  Int              @default(0)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  userCategories UserCategory[]
}
```

## 🔧 **Business Logic Differences**

### **Individual Users:**
- ✅ **Multiple Categories**: Can be assigned to multiple categories
- ✅ **Flexible Subcategories**: Can have different subcategories for each category
- ✅ **Personal Interests**: Categories represent personal interests, skills, or hobbies
- ✅ **Dynamic Assignment**: Categories can be added/removed at any time

### **Business Users:**
- ✅ **Single Category**: Can only be assigned to one primary category
- ✅ **Focused Subcategories**: Subcategories are specific to their business category
- ✅ **Business Classification**: Categories represent business type or industry
- ✅ **Stable Assignment**: Categories are typically set during registration

## 🚀 **API Endpoints**

### **1. Assign Single Category**

**POST** `/api/user-categories/assign`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "userId": "user-uuid-123",
  "categoryId": "category-uuid-456",
  "subcategories": ["Web Development", "Mobile Apps", "UI/UX Design"]
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Category assigned successfully",
  "data": {
    "id": "user-category-uuid",
    "userId": "user-uuid-123",
    "categoryId": "category-uuid-456",
    "categoriesName": ["Technology & IT"],
    "subcategories": ["Web Development", "Mobile Apps", "UI/UX Design"],
    "user_type": "BUSINESS",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "onboardingg:"Location"
  }
}
```

### **2. Assign Multiple Categories (Individual Users Only)**

**POST** `/api/user-categories/assign-multiple`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "userId": "user-uuid-123",
  "categories": [
    {
      "categoryId": "category-uuid-456",
      "subcategories": ["React Development", "Node.js Development"]
    },
    {
      "categoryId": "category-uuid-789",
      "subcategories": ["Photography", "Videography"]
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Multiple categories assigned successfully",
  "data": [
    {
      "id": "user-category-uuid-1",
      "userId": "user-uuid-123",
      "categoryId": "category-uuid-456",
      "categoriesName": ["Technology & IT"],
      "subcategories": ["React Development", "Node.js Development"],
      "user_type": "INDIVIDUAL",
      "category": {
        "id": "category-uuid-456",
        "name": "Technology & IT",
        "slug": "technology-it",
        "audience": "BOTH"
      }
    },
    {
      "id": "user-category-uuid-2",
      "userId": "user-uuid-123",
      "categoryId": "category-uuid-789",
      "categoriesName": ["Art & Creativity"],
      "subcategories": ["Photography", "Videography"],
      "user_type": "INDIVIDUAL",
      "category": {
        "id": "category-uuid-789",
        "name": "Art & Creativity",
        "slug": "art-creativity",
        "audience": "INDIVIDUAL"
      }
    }
  ]
}
```

### **3. Get User's Categories**

**GET** `/api/user-categories/user/{userId}`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "User categories retrieved successfully",
  "data": [
    {
      "id": "user-category-uuid",
      "userId": "user-uuid-123",
      "categoryId": "category-uuid-456",
      "categoriesName": ["Technology & IT"],
      "subcategories": ["Web Development", "Mobile Apps"],
      "user_type": "BUSINESS",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "category": {
        "id": "category-uuid-456",
        "name": "Technology & IT",
        "slug": "technology-it",
        "audience": "BUSINESS",
        "status": true
      }
    }
  ]
}
```

### **4. Remove Category**

**DELETE** `/api/user-categories/remove`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "userId": "user-uuid-123",
  "categoryId": "category-uuid-456"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Category removed successfully",
  "data": {
    "message": "Category removed successfully"
  }
}
```

### **5. Get Available Categories**

**GET** `/api/categories/active`

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": "category-uuid-1",
      "name": "Technology & IT",
      "slug": "technology-it",
      "audience": "BOTH",
      "status": true,
      "sort_order": 1
    },
    {
      "id": "category-uuid-2",
      "name": "Healthcare & Medical",
      "slug": "healthcare-medical",
      "audience": "BUSINESS",
      "status": true,
      "sort_order": 2
    },
    {
      "id": "category-uuid-3",
      "name": "Fitness & Health",
      "slug": "fitness-health",
      "audience": "INDIVIDUAL",
      "status": true,
      "sort_order": 3
    }
  ]
}
```

## 🎯 **Category Assignment Rules**

### **Individual Users:**
- Can be assigned to **multiple categories**
- Each category can have **different subcategories**
- Categories are **personal interests or skills**
- **Dynamic assignment** - can change over time

### **Business Users:**
- Can be assigned to **only one category**
- Subcategories are **specific to their business type**
- Categories represent **business industry or type**
- **Stable assignment** - typically set during registration

## 📝 **Subcategory Management**

### **Subcategory Types:**

#### **Technology & IT:**
- Web Development
- Mobile Apps
- UI/UX Design
- Data Science
- Cloud Computing
- Cybersecurity

#### **Healthcare & Medical:**
- Primary Care
- Specialized Medicine
- Dental Care
- Mental Health
- Physical Therapy
- Alternative Medicine

#### **Fitness & Health:**
- Personal Training
- Yoga & Meditation
- Nutrition
- Sports Coaching
- Wellness Coaching

#### **Art & Creativity:**
- Photography
- Videography
- Graphic Design
- Music
- Painting
- Digital Art

## 🔄 **Frontend Integration Examples**

### **React Component Example:**

```jsx
import React, { useState, useEffect } from 'react';

const CategorySelector = ({ userType, onCategoryChange }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories/active');
      const data = await response.json();
      setCategories(data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCategorySelect = (categoryId, subcategories) => {
    if (userType === 'BUSINESS') {
      // Business users can only have one category
      setSelectedCategories([{ categoryId, subcategories }]);
    } else {
      // Individual users can have multiple categories
      setSelectedCategories(prev => [...prev, { categoryId, subcategories }]);
    }
    
    onCategoryChange(selectedCategories);
  };

  return (
    <div className="category-selector">
      <h3>Select {userType === 'BUSINESS' ? 'Business Category' : 'Your Interests'}</h3>
      
      {categories
        .filter(cat => cat.audience === 'BOTH' || cat.audience === userType.toUpperCase())
        .map(category => (
          <div key={category.id} className="category-item">
            <label>
              <input
                type={userType === 'BUSINESS' ? 'radio' : 'checkbox'}
                name="category"
                value={category.id}
                onChange={(e) => handleCategorySelect(category.id, [])}
              />
              {category.name}
            </label>
          </div>
        ))}
    </div>
  );
};

export default CategorySelector;
```

### **Category Assignment Function:**

```javascript
const assignUserCategories = async (userId, categories) => {
  try {
    const endpoint = categories.length > 1 
      ? '/api/user-categories/assign-multiple'
      : '/api/user-categories/assign';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        userId,
        ...(categories.length > 1 
          ? { categories } 
          : { 
              categoryId: categories[0].categoryId,
              subcategories: categories[0].subcategories 
            }
        )
      })
    });

    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('Categories assigned successfully:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error assigning categories:', error);
    throw error;
  }
};
```

## 🚨 **Error Handling**

### **Common Error Responses:**

#### **400 Bad Request - Invalid Category:**
```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "Category ID is invalid",
  "details": null
}
```

#### **400 Bad Request - Business User Multiple Categories:**
```json
{
  "status": "fail",
  "statusCode": 400,
  "message": "Business users can only have one category",
  "details": null
}
```

#### **409 Conflict - Category Already Assigned:**
```json
{
  "status": "fail",
  "statusCode": 409,
  "message": "User already has this category assigned",
  "details": null
}
```

## 📊 **Best Practices**

### **For Frontend Developers:**
1. **Validate User Type**: Check user type before allowing multiple category selection
2. **Handle Subcategories**: Provide UI for subcategory selection after category selection
3. **Real-time Updates**: Update UI immediately after successful category assignment
4. **Error Handling**: Show user-friendly error messages for validation failures
5. **Loading States**: Display loading indicators during API calls

### **For Backend Integration:**
1. **Token Validation**: Always include valid access tokens in requests
2. **User Ownership**: Ensure users can only modify their own categories
3. **Data Validation**: Validate category IDs and subcategory arrays
4. **Transaction Safety**: Use database transactions for multiple category assignments
5. **Audit Logging**: Log category changes for business intelligence

## ✅ **Ready for Production**

The User Category System is fully implemented and provides:

- 🏷️ **Flexible Categorization**: Different rules for individual vs. business users
- 🔄 **Dynamic Assignment**: Add/remove categories as needed
- 📝 **Rich Subcategories**: Detailed subcategory support for each category
- 🔐 **Secure Access**: Proper authentication and authorization
- 📚 **Complete API**: Full CRUD operations for category management
- 🎯 **User Experience**: Intuitive category selection and management

**Next Steps:** Integrate the category selection UI into your user registration and profile management flows.
