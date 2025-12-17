# Manual Course Activation API Documentation

This document describes the new manual course activation system that replaces online payments.

---

## Overview

The system has been changed from **online payment** to **manual course activation**:

- ❌ **Removed:** Online payment processing
- ✅ **New:** Course request system with admin approval

---

## Student Flow

### 1. Add Course to Cart

**Endpoint:** `POST /api/mobile/student/cart`

**Authentication:** Required (Bearer Token)

**Role:** STUDENT only

**Request Body:**
```json
{
  "courseId": "course-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Course added to cart successfully",
  "messageAr": "تم إضافة الدورة إلى السلة بنجاح"
}
```

**Validation:**
- Cannot add course if already purchased
- Cannot add course if there's a pending or approved request
- Can re-add course if previous request was rejected

---

### 2. Submit Cart as Course Requests

**Endpoint:** `POST /api/mobile/student/cart/submit`

**Authentication:** Required (Bearer Token)

**Role:** STUDENT only

**Description:** Converts all cart items into course requests with status "pending". Cart is cleared after submission.

**Response (Success):**
```json
{
  "success": true,
  "message": "3 course request(s) submitted successfully",
  "messageAr": "تم تقديم 3 طلب دورة بنجاح",
  "data": {
    "requests": [
      {
        "id": "request-uuid",
        "studentId": "student-uuid",
        "courseId": "course-uuid",
        "status": "pending",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "errors": [
      {
        "courseId": "course-uuid",
        "courseTitle": "Course Name",
        "error": "Course already purchased"
      }
    ]
  }
}
```

**Example (cURL):**
```bash
curl -X POST https://dr-law.developteam.site/api/mobile/student/cart/submit \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json"
```

**Example (Flutter/Dart):**
```dart
Future<Map<String, dynamic>> submitCart() async {
  final response = await http.post(
    Uri.parse('https://dr-law.developteam.site/api/mobile/student/cart/submit'),
    headers: {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    },
  );
  
  return jsonDecode(response.body);
}
```

---

## Admin Flow

### 3. Get All Course Requests

**Endpoint:** `GET /api/admin/course-requests`

**Authentication:** Required (Bearer Token)

**Role:** ADMIN only

**Query Parameters:**
- `status` (optional): `pending`, `approved`, `rejected`
- `studentId` (optional): Filter by student ID
- `courseId` (optional): Filter by course ID

**Response:**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "request-uuid",
        "studentId": "student-uuid",
        "courseId": "course-uuid",
        "status": "pending",
        "rejectionReason": null,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "student": {
          "id": "student-uuid",
          "nameAr": "اسم الطالب",
          "nameEn": "Student Name",
          "email": "student@example.com",
          "phone": "+96512345678"
        },
        "course": {
          "id": "course-uuid",
          "titleAr": "عنوان الدورة",
          "titleEn": "Course Title",
          "price": "100.00",
          "finalPrice": "90.00",
          "teacher": {
            "nameAr": "اسم المعلم",
            "nameEn": "Teacher Name"
          },
          "category": {
            "nameAr": "الفئة",
            "nameEn": "Category"
          }
        }
      }
    ],
    "counts": {
      "pending": 15,
      "approved": 120,
      "rejected": 5
    }
  }
}
```

**Example:**
```bash
# Get all pending requests
curl -X GET "https://dr-law.developteam.site/api/admin/course-requests?status=pending" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get all requests for a specific student
curl -X GET "https://dr-law.developteam.site/api/admin/course-requests?studentId=student-uuid" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### 4. Get Single Course Request

**Endpoint:** `GET /api/admin/course-requests/:id`

**Authentication:** Required (Bearer Token)

**Role:** ADMIN only

**Response:**
```json
{
  "success": true,
  "data": {
    "request": {
      "id": "request-uuid",
      "studentId": "student-uuid",
      "courseId": "course-uuid",
      "status": "pending",
      "rejectionReason": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "student": { ... },
      "course": { ... }
    }
  }
}
```

---

### 5. Approve Course Request

**Endpoint:** `POST /api/admin/course-requests/:id/approve`

**Authentication:** Required (Bearer Token)

**Role:** ADMIN only

**Description:** 
- Changes request status to "approved"
- Automatically creates a Purchase (enrollment)
- Sends notification to student
- Student can now access the course

**Response:**
```json
{
  "success": true,
  "message": "Course request approved and student enrolled successfully",
  "messageAr": "تم اعتماد طلب الدورة وتسجيل الطالب بنجاح",
  "data": {
    "request": {
      "id": "request-uuid",
      "status": "approved",
      ...
    },
    "purchase": {
      "id": "purchase-uuid",
      "studentId": "student-uuid",
      "courseId": "course-uuid",
      "amount": "90.00",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Example:**
```bash
curl -X POST https://dr-law.developteam.site/api/admin/course-requests/request-uuid/approve \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

---

### 6. Reject Course Request

**Endpoint:** `POST /api/admin/course-requests/:id/reject`

**Authentication:** Required (Bearer Token)

**Role:** ADMIN only

**Request Body:**
```json
{
  "rejectionReason": "Optional reason for rejection"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Course request rejected successfully",
  "messageAr": "تم رفض طلب الدورة بنجاح",
  "data": {
    "request": {
      "id": "request-uuid",
      "status": "rejected",
      "rejectionReason": "Optional reason for rejection",
      ...
    }
  }
}
```

**Example:**
```bash
curl -X POST https://dr-law.developteam.site/api/admin/course-requests/request-uuid/reject \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionReason": "Payment not received"
  }'
```

---

### 7. Bulk Approve Course Requests

**Endpoint:** `POST /api/admin/course-requests/bulk-approve`

**Authentication:** Required (Bearer Token)

**Role:** ADMIN only

**Request Body:**
```json
{
  "requestIds": ["request-uuid-1", "request-uuid-2", "request-uuid-3"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "3 request(s) approved successfully",
  "messageAr": "تم اعتماد 3 طلب بنجاح",
  "data": {
    "approved": [
      { "requestId": "request-uuid-1" },
      { "requestId": "request-uuid-2" },
      { "requestId": "request-uuid-3" }
    ],
    "errors": []
  }
}
```

**Example:**
```bash
curl -X POST https://dr-law.developteam.site/api/admin/course-requests/bulk-approve \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestIds": ["uuid-1", "uuid-2", "uuid-3"]
  }'
```

---

## Database Schema

### CourseRequest Table

```prisma
model CourseRequest {
  id              String   @id @default(uuid())
  studentId       String   @map("student_id")
  courseId        String   @map("course_id")
  status          String   @default("pending") // pending, approved, rejected
  rejectionReason String?   @map("rejection_reason") @db.Text
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  student User   @relation("CourseRequests", fields: [studentId], references: [id], onDelete: Cascade)
  course  Course @relation("CourseRequests", fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([studentId, courseId])
  @@index([status])
  @@index([studentId])
  @@index([courseId])
  @@map("course_requests")
}
```

---

## Business Rules

### Student Rules

1. ✅ Student can add courses to cart
2. ✅ Student can submit cart as course requests
3. ❌ Student **cannot** purchase courses directly
4. ✅ Student can re-request a course if previous request was rejected
5. ❌ Student **cannot** request the same course if:
   - Status is `pending`
   - Status is `approved` (already enrolled)

### Admin Rules

1. ✅ Admin can view all course requests
2. ✅ Admin can filter by status, student, or course
3. ✅ Admin can approve requests (auto-enrolls student)
4. ✅ Admin can reject requests (with optional reason)
5. ✅ Admin can bulk approve multiple requests
6. ❌ Admin **cannot** reject an already approved request

### Request Status Flow

```
pending → approved (enrollment created)
pending → rejected (can be re-requested)
rejected → pending (student re-submits)
```

---

## Migration

To apply the database changes:

```bash
cd Backend
npx prisma migrate dev --name add_course_requests
```

---

## Disabled Endpoints

The following payment endpoints have been **disabled**:

- ❌ `POST /api/mobile/student/payments` - Returns 410 (Gone)
- ❌ `GET /api/mobile/student/payments` - Commented out

**Alternative:** Use course requests instead.

---

## Error Handling

All endpoints follow consistent error response format:

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
- `410` - Gone (payment endpoints disabled)
- `500` - Internal Server Error

---

## Example Workflow

### Student Workflow

1. **Browse Courses**
   ```
   GET /api/mobile/student/courses
   ```

2. **Add to Cart**
   ```
   POST /api/mobile/student/cart
   Body: { "courseId": "uuid" }
   ```

3. **Submit Cart**
   ```
   POST /api/mobile/student/cart/submit
   ```
   → Creates course requests with status "pending"

4. **Wait for Admin Approval**
   → Student receives notification when approved

5. **Access Course** (after approval)
   ```
   GET /api/mobile/student/my-courses
   ```

### Admin Workflow

1. **View Pending Requests**
   ```
   GET /api/admin/course-requests?status=pending
   ```

2. **Review Request Details**
   ```
   GET /api/admin/course-requests/:id
   ```

3. **Approve Request**
   ```
   POST /api/admin/course-requests/:id/approve
   ```
   → Auto-enrolls student, sends notification

4. **Or Reject Request**
   ```
   POST /api/admin/course-requests/:id/reject
   Body: { "rejectionReason": "Reason" }
   ```

---

## Notes

1. **Cart Behavior:** Cart is now a "request basket" - items are converted to requests upon submission.

2. **Automatic Enrollment:** When admin approves a request, a Purchase record is automatically created, giving the student access to the course.

3. **Notifications:** Students receive notifications when their requests are approved.

4. **Re-requesting:** If a request is rejected, the student can add the course to cart again and submit a new request.

5. **Payment Records:** The Payment table still exists in the database but is no longer used for new enrollments. Existing payment records are preserved for historical data.

---

## Testing

Test the new system using:

1. **Postman Collection:** Import the endpoints and test the full workflow
2. **Mobile App:** Test student flow (add to cart → submit → wait for approval)
3. **Admin Dashboard:** Test admin approval/rejection flow

Make sure to:
- Run database migration first
- Test with different request statuses
- Verify automatic enrollment on approval
- Check notification delivery


