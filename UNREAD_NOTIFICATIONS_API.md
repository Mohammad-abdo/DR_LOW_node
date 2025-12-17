# Unread Notifications API

This document describes the endpoints for getting unread notification counts for both Admin and Student users.

## Endpoints

### 1. Admin - Unread Count

#### Desktop/Web Admin
**GET** `/api/admin/notifications/unread-count`

#### Mobile Admin
**GET** `/api/mobile/admin/notifications/unread-count`

**Authentication:** Required (Admin role)

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

**Example Request:**
```bash
curl -X GET \
  https://dr-law.developteam.site/api/admin/notifications/unread-count \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

---

### 2. Student - Unread Count

#### Desktop/Web Student
**GET** `/api/notifications/unread-count`

**Note:** This endpoint is already available in the profile routes and works for all authenticated users (students, teachers, etc.).

#### Mobile Student
**GET** `/api/mobile/student/notifications/unread-count`

**Authentication:** Required (Student role)

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 3
  }
}
```

**Example Request:**
```bash
curl -X GET \
  https://dr-law.developteam.site/api/mobile/student/notifications/unread-count \
  -H 'Authorization: Bearer YOUR_STUDENT_TOKEN'
```

---

## Flutter/Dart Examples

### Admin Unread Count

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<int> getAdminUnreadCount(String token) async {
  try {
    final response = await http.get(
      Uri.parse('https://dr-law.developteam.site/api/mobile/admin/notifications/unread-count'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        return data['data']['unreadCount'] ?? 0;
      }
    }
    return 0;
  } catch (e) {
    print('Error fetching unread count: $e');
    return 0;
  }
}

// Usage
final unreadCount = await getAdminUnreadCount(adminToken);
print('Unread notifications: $unreadCount');
```

### Student Unread Count

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<int> getStudentUnreadCount(String token) async {
  try {
    final response = await http.get(
      Uri.parse('https://dr-law.developteam.site/api/mobile/student/notifications/unread-count'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        return data['data']['unreadCount'] ?? 0;
      }
    }
    return 0;
  } catch (e) {
    print('Error fetching unread count: $e');
    return 0;
  }
}

// Usage
final unreadCount = await getStudentUnreadCount(studentToken);
print('Unread notifications: $unreadCount');
```

### Polling Example (Auto-refresh every 30 seconds)

```dart
import 'dart:async';

class NotificationService {
  Timer? _pollTimer;
  int _unreadCount = 0;
  Function(int)? onCountChanged;

  void startPolling(String token, {Duration interval = const Duration(seconds: 30)}) {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(interval, (timer) async {
      final count = await getStudentUnreadCount(token);
      if (count != _unreadCount) {
        _unreadCount = count;
        onCountChanged?.call(count);
      }
    });
  }

  void stopPolling() {
    _pollTimer?.cancel();
    _pollTimer = null;
  }

  void dispose() {
    stopPolling();
  }
}

// Usage
final notificationService = NotificationService();
notificationService.onCountChanged = (count) {
  print('Unread count updated: $count');
  // Update UI badge, etc.
};

notificationService.startPolling(studentToken);
```

---

## React Native Examples

### Admin Unread Count

```javascript
import axios from 'axios';

const getAdminUnreadCount = async (token) => {
  try {
    const response = await axios.get(
      'https://dr-law.developteam.site/api/mobile/admin/notifications/unread-count',
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      return response.data.data.unreadCount || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
};

// Usage
const unreadCount = await getAdminUnreadCount(adminToken);
console.log('Unread notifications:', unreadCount);
```

### Student Unread Count

```javascript
import axios from 'axios';

const getStudentUnreadCount = async (token) => {
  try {
    const response = await axios.get(
      'https://dr-law.developteam.site/api/mobile/student/notifications/unread-count',
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      return response.data.data.unreadCount || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
};

// Usage
const unreadCount = await getStudentUnreadCount(studentToken);
console.log('Unread notifications:', unreadCount);
```

### React Hook Example (Auto-refresh)

```javascript
import { useState, useEffect, useRef } from 'react';

const useUnreadNotifications = (token, role = 'student', interval = 30000) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const endpoint = role === 'admin'
        ? '/api/mobile/admin/notifications/unread-count'
        : '/api/mobile/student/notifications/unread-count';

      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setUnreadCount(response.data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    // Fetch immediately
    fetchUnreadCount();

    // Set up polling
    intervalRef.current = setInterval(fetchUnreadCount, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [token, role, interval]);

  return unreadCount;
};

// Usage in component
const MyComponent = () => {
  const token = useSelector(state => state.auth.token);
  const userRole = useSelector(state => state.auth.user.role);
  const unreadCount = useUnreadNotifications(token, userRole, 30000); // Poll every 30 seconds

  return (
    <View>
      <Text>Unread Notifications: {unreadCount}</Text>
    </View>
  );
};
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized",
  "messageAr": "غير مصرح"
}
```

### 403 Forbidden (Wrong Role)
```json
{
  "success": false,
  "message": "Forbidden",
  "messageAr": "غير مسموح"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "messageAr": "خطأ في الخادم"
}
```

---

## Notes

1. **Lightweight Endpoint:** These endpoints are optimized for frequent polling (e.g., every 30-90 seconds) as they only return a count, not the full notification data.

2. **Rate Limiting:** Be mindful of rate limits. The notification endpoints have a rate limit of 500 requests per minute.

3. **Caching:** Consider caching the count on the client side and only polling when the app comes to foreground or when a notification is received.

4. **Real-time Updates:** For real-time updates, consider using WebSockets or Server-Sent Events (SSE) instead of polling.

5. **Authentication:** All endpoints require a valid JWT token in the `Authorization` header.

---

## Summary

| Endpoint | Role | Method | Description |
|----------|------|--------|-------------|
| `/api/admin/notifications/unread-count` | Admin | GET | Get unread count for admin (Desktop/Web) |
| `/api/mobile/admin/notifications/unread-count` | Admin | GET | Get unread count for admin (Mobile) |
| `/api/notifications/unread-count` | All | GET | Get unread count for authenticated user (Desktop/Web) |
| `/api/mobile/student/notifications/unread-count` | Student | GET | Get unread count for student (Mobile) |

