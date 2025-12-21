# Mobile Student Endpoints Documentation

## Overview
These endpoints are for **authenticated students** using the mobile app. All endpoints require Bearer token authentication.

## Base URL
```
/api/mobile/student
```

## Authentication
All endpoints require:
- **Header:** `Authorization: Bearer <token>`
- **Role:** STUDENT

---

## 1. Logout

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

## 2. Delete Account

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

## 3. Invite Friend / Share App

### Get Share Information
**GET** `/api/mobile/student/share`

**Description:** Get share information for inviting friends to the app.

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://lms.edu.kw",
    "titleAr": "انضم إلى منصة التعلم الإلكتروني",
    "titleEn": "Join our Learning Management System",
    "messageAr": "انضم إلى منصة التعلم الإلكتروني وابدأ رحلتك التعليمية اليوم!",
    "messageEn": "Join our Learning Management System and start your learning journey today!"
  }
}
```

---

## 4. About App

### Get About App Information
**GET** `/api/mobile/student/about`

**Description:** Get information about the mobile application.

**Authentication:** Required (Bearer Token)

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

## 5. Help & Support

### Get Help & Support Information
**GET** `/api/mobile/student/help-support`

**Description:** Get help and support information for the mobile app.

**Authentication:** Required (Bearer Token)

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

## 6. Privacy Policy

### Get Privacy Policy
**GET** `/api/mobile/student/privacy-policy`

**Description:** Get the privacy policy content.

**Authentication:** Required (Bearer Token)

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

## 7. Terms & Conditions

### Get Terms & Conditions
**GET** `/api/mobile/student/terms`

**Description:** Get the terms and conditions content.

**Authentication:** Required (Bearer Token)

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

## 8. All Policies

### Get All Policies
**GET** `/api/mobile/student/policies`

**Description:** Get all app policies (privacy policy and terms & conditions).

**Authentication:** Required (Bearer Token)

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

## Example Usage

### Flutter/Dart Example

```dart
// Logout
Future<Map<String, dynamic>> logout(String token, {bool logoutAllDevices = false}) async {
  final response = await http.post(
    Uri.parse('https://dr-law.developteam.site/api/mobile/student/auth/logout'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: json.encode({'logoutAllDevices': logoutAllDevices}),
  );
  return json.decode(response.body);
}

// Delete Account
Future<Map<String, dynamic>> deleteAccount(String token, String password) async {
  final response = await http.delete(
    Uri.parse('https://dr-law.developteam.site/api/mobile/student/profile'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: json.encode({'password': password}),
  );
  return json.decode(response.body);
}

// Invite Friend / Share App
Future<Map<String, dynamic>> getShareInfo(String token) async {
  final response = await http.get(
    Uri.parse('https://dr-law.developteam.site/api/mobile/student/share'),
    headers: {
      'Authorization': 'Bearer $token',
    },
  );
  return json.decode(response.body);
}

// Get About App
Future<Map<String, dynamic>> getAboutApp(String token) async {
  final response = await http.get(
    Uri.parse('https://dr-law.developteam.site/api/mobile/student/about'),
    headers: {
      'Authorization': 'Bearer $token',
    },
  );
  return json.decode(response.body);
}

// Get Privacy Policy
Future<Map<String, dynamic>> getPrivacyPolicy(String token) async {
  final response = await http.get(
    Uri.parse('https://dr-law.developteam.site/api/mobile/student/privacy-policy'),
    headers: {
      'Authorization': 'Bearer $token',
    },
  );
  return json.decode(response.body);
}
```

### React Native Example

```javascript
import axios from 'axios';

const API_BASE_URL = 'https://dr-law.developteam.site/api';
const token = 'your_bearer_token';

// Logout
export const logout = async (logoutAllDevices = false) => {
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

// Delete Account
export const deleteAccount = async (password) => {
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

// Invite Friend / Share App
export const getShareInfo = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/mobile/student/share`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Get About App
export const getAboutApp = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/mobile/student/about`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Get Help & Support
export const getHelpSupport = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/mobile/student/help-support`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Get Privacy Policy
export const getPrivacyPolicy = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/mobile/student/privacy-policy`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
```

---

## Summary of Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/auth/logout` | POST | Logout user | ✅ |
| `/profile` | DELETE | Delete account | ✅ |
| `/share` | GET | Get share/invite info | ✅ |
| `/about` | GET | Get about app info | ✅ |
| `/help-support` | GET | Get help & support | ✅ |
| `/privacy-policy` | GET | Get privacy policy | ✅ |
| `/terms` | GET | Get terms & conditions | ✅ |
| `/policies` | GET | Get all policies | ✅ |

---

## Notes

1. **All endpoints require authentication** - Bearer token must be included in Authorization header
2. **Student role required** - Only users with STUDENT role can access these endpoints
3. **Error Handling:** All endpoints return consistent error format with English and Arabic messages
4. **HTTP Status Codes:** 200 (success), 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)







