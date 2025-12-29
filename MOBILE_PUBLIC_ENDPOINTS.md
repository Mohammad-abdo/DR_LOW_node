# Mobile Public Endpoints Documentation

## Overview
These endpoints are **public** and **do not require authentication**. They are designed for mobile app students and can be accessed without any authentication token.

## Base URL
```
/api/mobile/public
```

---

## 1. About App

### Get About App Information
**GET** `/api/mobile/public/about`

**Description:** Get information about the mobile application.

**Authentication:** Not required (Public)

**Response:**
```json
{
  "success": true,
  "data": {
    "aboutApp": {
      "id": "uuid",
      "appName": "Dr. Law LMS",
      "description": "Learning Management System",
      "version": "1.0.0",
      "whatsappPhone1": "+96512345678",
      "whatsappPhone2": "+96587654321",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "About app information not found",
  "messageAr": "معلومات التطبيق غير موجودة"
}
```

---

## 2. Help & Support

### Get Help & Support Information
**GET** `/api/mobile/public/help-support`

**Description:** Get help and support information for the mobile app.

**Authentication:** Not required (Public)

**Response:**
```json
{
  "success": true,
  "data": {
    "helpSupport": {
      "id": "uuid",
      "title": "Need Help?",
      "description": "Contact us for support",
      "whatsappPhone1": "+96512345678",
      "whatsappPhone2": "+96587654321",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Help & support information not found",
  "messageAr": "معلومات المساعدة والدعم غير موجودة"
}
```

---

## 3. Privacy Policy

### Get Privacy Policy
**GET** `/api/mobile/public/privacy-policy`

**Description:** Get the privacy policy content.

**Authentication:** Not required (Public)

**Response:**
```json
{
  "success": true,
  "data": {
    "policy": {
      "id": "uuid",
      "type": "privacy_policy",
      "content": "Privacy policy content here...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Privacy policy not found",
  "messageAr": "سياسة الخصوصية غير موجودة"
}
```

---

## 4. Terms & Conditions

### Get Terms & Conditions
**GET** `/api/mobile/public/terms`

**Description:** Get the terms and conditions content.

**Authentication:** Not required (Public)

**Response:**
```json
{
  "success": true,
  "data": {
    "policy": {
      "id": "uuid",
      "type": "terms_and_conditions",
      "content": "Terms and conditions content here...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Terms and conditions not found",
  "messageAr": "الشروط والأحكام غير موجودة"
}
```

---

## 5. All Policies

### Get All Policies
**GET** `/api/mobile/public/policies`

**Description:** Get all app policies (privacy policy and terms & conditions).

**Authentication:** Not required (Public)

**Response:**
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

---

## Mobile Student Authenticated Endpoints

## 6. Logout

### Logout User
**POST** `/api/mobile/student/auth/logout`

**Description:** Logout the authenticated student user.

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "logoutAllDevices": false  // Optional: true to logout from all devices
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "messageAr": "تم تسجيل الخروج بنجاح"
}
```

**Response (logoutAllDevices: true):**
```json
{
  "success": true,
  "message": "Logged out from all devices successfully",
  "messageAr": "تم تسجيل الخروج من جميع الأجهزة بنجاح"
}
```

---

## 7. Delete Account

### Delete Student Account
**DELETE** `/api/mobile/student/profile`

**Description:** Delete the authenticated student's account. Requires password verification.

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "password": "user_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully",
  "messageAr": "تم حذف الحساب بنجاح"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid password",
  "messageAr": "كلمة المرور غير صحيحة"
}
```

---

## Example Usage

### Flutter/Dart Example

```dart
// Get About App (Public)
Future<Map<String, dynamic>> getAboutApp() async {
  final response = await http.get(
    Uri.parse('https://back.dr-law.site/api/mobile/public/about'),
  );
  return json.decode(response.body);
}

// Get Privacy Policy (Public)
Future<Map<String, dynamic>> getPrivacyPolicy() async {
  final response = await http.get(
    Uri.parse('https://back.dr-law.site/api/mobile/public/privacy-policy'),
  );
  return json.decode(response.body);
}

// Logout (Authenticated)
Future<Map<String, dynamic>> logout(String token, {bool logoutAllDevices = false}) async {
  final response = await http.post(
    Uri.parse('https://back.dr-law.site/api/mobile/student/auth/logout'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: json.encode({'logoutAllDevices': logoutAllDevices}),
  );
  return json.decode(response.body);
}

// Delete Account (Authenticated)
Future<Map<String, dynamic>> deleteAccount(String token, String password) async {
  final response = await http.delete(
    Uri.parse('https://back.dr-law.site/api/mobile/student/profile'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: json.encode({'password': password}),
  );
  return json.decode(response.body);
}
```

### React Native Example

```javascript
import axios from 'axios';

const API_BASE_URL = 'https://back.dr-law.site/api';

// Get About App (Public)
export const getAboutApp = async () => {
  const response = await axios.get(`${API_BASE_URL}/mobile/public/about`);
  return response.data;
};

// Get Privacy Policy (Public)
export const getPrivacyPolicy = async () => {
  const response = await axios.get(`${API_BASE_URL}/mobile/public/privacy-policy`);
  return response.data;
};

// Logout (Authenticated)
export const logout = async (token, logoutAllDevices = false) => {
  const response = await axios.post(
    `${API_BASE_URL}/mobile/student/auth/logout`,
    { logoutAllDevices },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Delete Account (Authenticated)
export const deleteAccount = async (token, password) => {
  const response = await axios.delete(
    `${API_BASE_URL}/mobile/student/profile`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: { password },
    }
  );
  return response.data;
};
```

---

## Notes

1. **Public Endpoints** (`/api/mobile/public/*`):
   - No authentication required
   - Can be accessed by anyone
   - Perfect for displaying app information before login

2. **Authenticated Endpoints** (`/api/mobile/student/*`):
   - Require Bearer token in Authorization header
   - Student role required
   - Protected by authentication middleware

3. **Error Handling:**
   - All endpoints return consistent error format
   - Include both English and Arabic messages
   - HTTP status codes: 200 (success), 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)

4. **Rate Limiting:**
   - Public endpoints may have rate limiting
   - Authenticated endpoints respect user rate limits















