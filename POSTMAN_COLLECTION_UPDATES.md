# Postman Collection Updates

This document lists all new endpoints that need to be added to the Postman collection.

## New Endpoints to Add

### 1. Course Requests (Manual Course Activation)

#### Admin Endpoints

**Get All Course Requests**
```
GET {{base_url}}/admin/course-requests
Query Params:
  - status: pending|approved|rejected (optional)
  - studentId: string (optional)
  - courseId: string (optional)
```

**Get Course Request By ID**
```
GET {{base_url}}/admin/course-requests/:id
```

**Approve Course Request**
```
POST {{base_url}}/admin/course-requests/:id/approve
Body: (empty)
```

**Reject Course Request**
```
POST {{base_url}}/admin/course-requests/:id/reject
Body:
{
  "rejectionReason": "Optional reason for rejection"
}
```

**Bulk Approve Course Requests**
```
POST {{base_url}}/admin/course-requests/bulk-approve
Body:
{
  "requestIds": ["request-id-1", "request-id-2", "request-id-3"]
}
```

#### Student Endpoints

**Submit Cart as Course Requests**
```
POST {{base_url}}/mobile/student/cart/submit
Body: (empty)
```

### 2. About App

**Get About App (Public)**
```
GET {{base_url}}/app/about
```

**Admin: Get About App**
```
GET {{base_url}}/admin/about-app
```

**Admin: Create About App**
```
POST {{base_url}}/admin/about-app
Body:
{
  "appName": "Dr. Law LMS",
  "description": "Learning Management System",
  "version": "1.0.0",
  "whatsappPhone1": "+96512345678",
  "whatsappPhone2": "+96587654321"
}
```

**Admin: Update About App**
```
PUT {{base_url}}/admin/about-app/:id
Body:
{
  "appName": "Updated Name",
  "description": "Updated description",
  "version": "1.1.0"
}
```

### 3. Help & Support

**Get Help & Support (Public)**
```
GET {{base_url}}/app/help-support
```

**Admin: Get All Help & Support**
```
GET {{base_url}}/admin/help-support
```

**Admin: Create Help & Support**
```
POST {{base_url}}/admin/help-support
Body:
{
  "title": "Need Help?",
  "description": "Contact us via WhatsApp",
  "whatsappPhone1": "+96512345678",
  "whatsappPhone2": "+96587654321"
}
```

**Admin: Update Help & Support**
```
PUT {{base_url}}/admin/help-support/:id
Body:
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Admin: Delete Help & Support**
```
DELETE {{base_url}}/admin/help-support/:id
```

### 4. App Policies (Privacy Policy & Terms)

**Get App Policies (Public)**
```
GET {{base_url}}/app/policies
Query Params:
  - type: privacy_policy|terms_and_conditions (optional)
```

**Admin: Get All Policies**
```
GET {{base_url}}/admin/policies
```

**Admin: Create Policy**
```
POST {{base_url}}/admin/policies
Body:
{
  "type": "privacy_policy",
  "content": "Privacy policy content here..."
}
```

**Admin: Update Policy**
```
PUT {{base_url}}/admin/policies/:id
Body:
{
  "content": "Updated policy content..."
}
```

**Admin: Delete Policy**
```
DELETE {{base_url}}/admin/policies/:id
```

### 5. Enhanced Logout

**Logout (Enhanced)**
```
POST {{base_url}}/auth/logout
Body:
{
  "logoutAllDevices": false
}
```

### 6. Delete Student Account

**Delete Student Account**
```
DELETE {{base_url}}/mobile/student/profile
Body:
{
  "password": "student_password"
}
```

## Instructions

1. Open Postman
2. Import the existing `LMS_API.postman_collection.json`
3. Add the above endpoints to the appropriate folders:
   - Course Requests → Admin (Web) folder
   - About App, Help & Support, App Policies → Admin (Web) folder
   - Enhanced Logout → Authentication folder
   - Delete Account → Mobile Student folder
   - Submit Cart → Mobile Student folder
4. Save the collection

## Collection Structure

```
LMS API - Complete Collection
├── Authentication
│   ├── Login
│   ├── Register Student
│   ├── Register Teacher
│   ├── Refresh Token
│   └── Logout (Enhanced) ← NEW
├── Admin (Web)
│   ├── Dashboard
│   ├── Users
│   ├── Categories
│   ├── Courses
│   ├── Course Requests ← NEW FOLDER
│   │   ├── Get All Course Requests
│   │   ├── Get Course Request By ID
│   │   ├── Approve Course Request
│   │   ├── Reject Course Request
│   │   └── Bulk Approve Course Requests
│   ├── About App ← NEW FOLDER
│   │   ├── Get About App (Public)
│   │   ├── Admin: Get About App
│   │   ├── Admin: Create About App
│   │   └── Admin: Update About App
│   ├── Help & Support ← NEW FOLDER
│   │   ├── Get Help & Support (Public)
│   │   ├── Admin: Get All Help & Support
│   │   ├── Admin: Create Help & Support
│   │   ├── Admin: Update Help & Support
│   │   └── Admin: Delete Help & Support
│   ├── App Policies ← NEW FOLDER
│   │   ├── Get App Policies (Public)
│   │   ├── Admin: Get All Policies
│   │   ├── Admin: Create Policy
│   │   ├── Admin: Update Policy
│   │   └── Admin: Delete Policy
│   └── ...
└── Mobile Student
    ├── Cart
    │   ├── Get Cart
    │   ├── Add to Cart
    │   ├── Submit Cart ← NEW
    │   ├── Remove from Cart
    │   └── Clear Cart
    ├── Profile
    │   └── Delete Account ← NEW
    └── ...
```

## Notes

- All endpoints require authentication except public endpoints (marked as Public)
- Use `{{base_url}}` variable for base URL
- Use `{{auth_token}}` variable for Bearer token
- Use `{{course_id}}`, `{{user_id}}`, etc. for dynamic values
