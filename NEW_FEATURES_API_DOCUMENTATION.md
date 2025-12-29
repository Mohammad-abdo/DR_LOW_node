# New Features API Documentation

This document describes the newly implemented API endpoints for mobile app support, account management, and app information.

---

## Table of Contents

1. [Logout Endpoint](#1-logout-endpoint)
2. [Delete Student Account](#2-delete-student-account)
3. [About App](#3-about-app)
4. [Help & Support](#4-help--support)
5. [Privacy Policy & Terms](#5-privacy-policy--terms)

---

## 1. Logout Endpoint

### Enhanced Logout with All Devices Support

**Endpoint:** `POST /api/auth/logout`

**Authentication:** Required (Bearer Token)

**Description:** Logs out the user and optionally invalidates all refresh tokens (logout from all devices).

**Request Body:**
```json
{
  "logoutAllDevices": false  // Optional: true to logout from all devices
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "messageAr": "تم تسجيل الخروج بنجاح"
}
```

**Response (All Devices):**
```json
{
  "success": true,
  "message": "Logged out from all devices successfully",
  "messageAr": "تم تسجيل الخروج من جميع الأجهزة بنجاح"
}
```

**Example (cURL):**
```bash
# Single device logout
curl -X POST https://back.dr-law.site/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Logout from all devices
curl -X POST https://back.dr-law.site/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"logoutAllDevices": true}'
```

**Example (Flutter/Dart):**
```dart
Future<void> logout({bool logoutAllDevices = false}) async {
  final response = await http.post(
    Uri.parse('https://back.dr-law.site/api/auth/logout'),
    headers: {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'logoutAllDevices': logoutAllDevices,
    }),
  );
  
  if (response.statusCode == 200) {
    // Handle successful logout
    await clearLocalStorage();
  }
}
```

**Example (React Native):**
```javascript
const logout = async (logoutAllDevices = false) => {
  try {
    const response = await fetch('https://back.dr-law.site/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logoutAllDevices }),
    });
    
    const data = await response.json();
    if (data.success) {
      // Clear local storage and navigate to login
      await AsyncStorage.clear();
      navigation.navigate('Login');
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
};
```

---

## 2. Delete Student Account

### Delete Student Account Endpoint

**Endpoint:** `DELETE /api/mobile/student/profile`

**Authentication:** Required (Bearer Token)

**Role:** STUDENT only

**Description:** Allows a student to delete their own account. Requires password verification.

**Request Body:**
```json
{
  "password": "student_password"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Account deleted successfully",
  "messageAr": "تم حذف الحساب بنجاح"
}
```

**Response (Invalid Password):**
```json
{
  "success": false,
  "message": "Invalid password",
  "messageAr": "كلمة المرور غير صحيحة"
}
```

**Example (cURL):**
```bash
curl -X DELETE https://back.dr-law.site/api/mobile/student/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password": "student_password"}'
```

**Example (Flutter/Dart):**
```dart
Future<void> deleteAccount(String password) async {
  final response = await http.delete(
    Uri.parse('https://back.dr-law.site/api/mobile/student/profile'),
    headers: {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'password': password,
    }),
  );
  
  if (response.statusCode == 200) {
    // Account deleted successfully
    await clearLocalStorage();
    Navigator.pushReplacementNamed(context, '/login');
  }
}
```

**Note:** All related data (sessions, tokens, enrollments, etc.) will be automatically deleted due to database cascade rules.

---

## 3. About App

### Get About App Information (Public)

**Endpoint:** `GET /api/app/about`

**Authentication:** Not required

**Description:** Retrieves information about the mobile application.

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "aboutApp": {
      "id": "uuid",
      "appName": "Dr. Law LMS",
      "description": "Learning Management System for Law Students",
      "version": "1.0.0",
      "whatsappPhone1": "+96512345678",
      "whatsappPhone2": "+96587654321",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Response (Not Found):**
```json
{
  "success": false,
  "message": "About app information not found",
  "messageAr": "معلومات التطبيق غير موجودة"
}
```

### Admin: Get About App

**Endpoint:** `GET /api/admin/about-app`

**Authentication:** Required (Bearer Token)

**Role:** ADMIN only

**Description:** Admin endpoint to retrieve about app information for editing.

### Admin: Create About App

**Endpoint:** `POST /api/admin/about-app`

**Authentication:** Required (Bearer Token)

**Role:** ADMIN only

**Request Body:**
```json
{
  "appName": "Dr. Law LMS",
  "description": "Learning Management System for Law Students",
  "version": "1.0.0",
  "whatsappPhone1": "+96512345678",
  "whatsappPhone2": "+96587654321"
}
```

**Required Fields:** `appName`, `version`

**Response:**
```json
{
  "success": true,
  "message": "About app information created successfully",
  "messageAr": "تم إنشاء معلومات التطبيق بنجاح",
  "data": {
    "aboutApp": { ... }
  }
}
```

### Admin: Update About App

**Endpoint:** `PUT /api/admin/about-app/:id`

**Authentication:** Required (Bearer Token)

**Role:** ADMIN only

**Request Body:**
```json
{
  "appName": "Dr. Law LMS Updated",
  "description": "Updated description",
  "version": "1.1.0",
  "whatsappPhone1": "+96512345678",
  "whatsappPhone2": "+96587654321"
}
```

**Example (cURL):**
```bash
# Get about app (public)
curl -X GET https://back.dr-law.site/api/app/about

# Create about app (admin)
curl -X POST https://back.dr-law.site/api/admin/about-app \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "Dr. Law LMS",
    "description": "Learning Management System",
    "version": "1.0.0",
    "whatsappPhone1": "+96512345678"
  }'
```

---

## 4. Help & Support

### Get Help & Support Information (Public)

**Endpoint:** `GET /api/app/help-support`

**Authentication:** Not required

**Description:** Retrieves help and support information for the mobile app.

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "helpSupport": {
      "id": "uuid",
      "title": "Need Help?",
      "description": "Contact us via WhatsApp for support",
      "whatsappPhone1": "+96512345678",
      "whatsappPhone2": "+96587654321",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Admin: Get All Help & Support Entries

**Endpoint:** `GET /api/admin/help-support`

**Authentication:** Required (Bearer Token)

**Role:** ADMIN only

**Response:**
```json
{
  "success": true,
  "data": {
    "helpSupport": [
      {
        "id": "uuid",
        "title": "Need Help?",
        "description": "...",
        "whatsappPhone1": "+96512345678",
        "whatsappPhone2": "+96587654321",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### Admin: Create Help & Support

**Endpoint:** `POST /api/admin/help-support`

**Authentication:** Required (Bearer Token)

**Role:** ADMIN only

**Request Body:**
```json
{
  "title": "Need Help?",
  "description": "Contact us via WhatsApp for support",
  "whatsappPhone1": "+96512345678",
  "whatsappPhone2": "+96587654321"
}
```

**Required Fields:** `title`

### Admin: Update Help & Support

**Endpoint:** `PUT /api/admin/help-support/:id`

**Authentication:** Required (Bearer Token)

**Role:** ADMIN only

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "whatsappPhone1": "+96512345678",
  "whatsappPhone2": "+96587654321"
}
```

### Admin: Delete Help & Support

**Endpoint:** `DELETE /api/admin/help-support/:id`

**Authentication:** Required (Bearer Token)

**Role:** ADMIN only

**Response:**
```json
{
  "success": true,
  "message": "Help & support information deleted successfully",
  "messageAr": "تم حذف معلومات المساعدة والدعم بنجاح"
}
```

**Example (cURL):**
```bash
# Get help support (public)
curl -X GET https://back.dr-law.site/api/app/help-support

# Create help support (admin)
curl -X POST https://back.dr-law.site/api/admin/help-support \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Need Help?",
    "description": "Contact us via WhatsApp",
    "whatsappPhone1": "+96512345678"
  }'
```

---

## 5. Privacy Policy & Terms

### Get App Policies (Public)

**Endpoint:** `GET /api/app/policies`

**Authentication:** Not required

**Query Parameters:**
- `type` (optional): `privacy_policy` or `terms_and_conditions`

**Description:** Retrieves app policies. If `type` is provided, returns specific policy; otherwise returns all policies.

**Response (All Policies):**
```json
{
  "success": true,
  "data": {
    "policies": [
      {
        "id": "uuid",
        "type": "privacy_policy",
        "content": "Privacy policy content...",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "uuid",
        "type": "terms_and_conditions",
        "content": "Terms and conditions content...",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Response (Specific Policy):**
```json
{
  "success": true,
  "data": {
    "policy": {
      "id": "uuid",
      "type": "privacy_policy",
      "content": "Privacy policy content...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Admin: Get All Policies

**Endpoint:** `GET /api/admin/policies`

**Authentication:** Required (Bearer Token)

**Role:** ADMIN only

### Admin: Create Policy

**Endpoint:** `POST /api/admin/policies`

**Authentication:** Required (Bearer Token)

**Role:** ADMIN only

**Request Body:**
```json
{
  "type": "privacy_policy",
  "content": "Privacy policy content here..."
}
```

**Valid Types:** `privacy_policy`, `terms_and_conditions`

**Response:**
```json
{
  "success": true,
  "message": "Policy created successfully",
  "messageAr": "تم إنشاء السياسة بنجاح",
  "data": {
    "policy": { ... }
  }
}
```

### Admin: Update Policy

**Endpoint:** `PUT /api/admin/policies/:id`

**Authentication:** Required (Bearer Token)

**Role:** ADMIN only

**Request Body:**
```json
{
  "content": "Updated policy content..."
}
```

### Admin: Delete Policy

**Endpoint:** `DELETE /api/admin/policies/:id`

**Authentication:** Required (Bearer Token)

**Role:** ADMIN only

**Response:**
```json
{
  "success": true,
  "message": "Policy deleted successfully",
  "messageAr": "تم حذف السياسة بنجاح"
}
```

**Example (cURL):**
```bash
# Get all policies (public)
curl -X GET https://back.dr-law.site/api/app/policies

# Get specific policy (public)
curl -X GET "https://back.dr-law.site/api/app/policies?type=privacy_policy"

# Create policy (admin)
curl -X POST https://back.dr-law.site/api/admin/policies \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "privacy_policy",
    "content": "Privacy policy content..."
  }'
```

---

## Database Schema

### AboutApp Table
```prisma
model AboutApp {
  id              String   @id @default(uuid())
  appName         String   @map("app_name")
  description     String?  @db.Text
  version         String
  whatsappPhone1  String?  @map("whatsapp_phone_1")
  whatsappPhone2  String?  @map("whatsapp_phone_2")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@map("about_app")
}
```

### HelpSupport Table
```prisma
model HelpSupport {
  id              String   @id @default(uuid())
  title           String
  description     String?  @db.Text
  whatsappPhone1  String?  @map("whatsapp_phone_1")
  whatsappPhone2  String?  @map("whatsapp_phone_2")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@map("help_support")
}
```

### AppPolicy Table
```prisma
model AppPolicy {
  id        String   @id @default(uuid())
  type      String   // privacy_policy | terms_and_conditions
  content   String   @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@unique([type])
  @@map("app_policies")
}
```

---

## Migration

To apply the database changes, run:

```bash
cd Backend
npx prisma migrate dev --name add_app_tables
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error message in English",
  "messageAr": "رسالة الخطأ بالعربية"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Notes

1. **Logout Endpoint:** The `logoutAllDevices` parameter allows users to invalidate all refresh tokens, effectively logging out from all devices.

2. **Delete Account:** The delete account endpoint requires password verification for security. All related data is automatically deleted due to database cascade rules.

3. **About App:** Only one about app entry should exist. Use update instead of create if one already exists.

4. **Help & Support:** Multiple help & support entries can exist. The public endpoint returns the most recently updated entry.

5. **App Policies:** Each policy type (`privacy_policy`, `terms_and_conditions`) can only exist once. Use update instead of create if a policy type already exists.

---

## Testing

You can test all endpoints using:
- Postman
- cURL
- Mobile app (Flutter/React Native)
- Frontend dashboard (for admin endpoints)

Make sure to:
1. Run the database migration first
2. Set up proper authentication tokens
3. Test both public and admin endpoints
4. Verify error handling for invalid requests















