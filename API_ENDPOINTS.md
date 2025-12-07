# API Endpoints Reference

## Base URL
```
http://localhost:5005/api
```

## Authentication Endpoints

### POST /api/auth/login
Login for all roles
```json
{
  "email": "admin@lms.edu.kw",
  "password": "admin123",
  "role": "ADMIN"
}
```

### POST /api/auth/register/student
Student registration (public)
```json
{
  "nameAr": "محمد",
  "nameEn": "Mohamed",
  "email": "student@example.com",
  "phone": "+96512345678",
  "password": "password123",
  "repeatPassword": "password123",
  "year": 3,
  "semester": 1,
  "department": "Computer Science"
}
```

### POST /api/auth/register/teacher
Teacher registration (Admin only)
```json
{
  "nameAr": "أحمد",
  "nameEn": "Ahmed",
  "email": "teacher@example.com",
  "phone": "+96512345679",
  "department": "Computer Science",
  "password": "password123"
}
```

### POST /api/auth/refresh
Refresh access token
```json
{
  "refreshToken": "your_refresh_token"
}
```

### POST /api/auth/logout
Logout (requires auth)

### GET /api/auth/me
Get current user profile (requires auth)

---

## Admin API (`/api/admin/*`)

All admin endpoints require: `Authorization: Bearer <token>` and `role: ADMIN`

### Dashboard
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/dashboard/analytics?period=month` - Analytics data

### Users
- `GET /api/admin/users?role=STUDENT&page=1&limit=10` - List users
- `GET /api/admin/users/:id` - Get user by ID
- `PUT /api/admin/users/:id` - Update user
- `POST /api/admin/users/:id/block` - Block user
- `POST /api/admin/users/:id/unblock` - Unblock user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/:id/reset-password` - Reset user password

### Categories
- `GET /api/admin/categories` - List categories
- `GET /api/admin/categories/:id` - Get category
- `POST /api/admin/categories` - Create category (multipart/form-data: image)
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category

### Courses
- `GET /api/admin/courses` - List courses
- `GET /api/admin/courses/:id` - Get course
- `POST /api/admin/courses` - Create course (multipart/form-data: cover_image)
- `PUT /api/admin/courses/:id` - Update course
- `DELETE /api/admin/courses/:id` - Delete course

### Banners
- `GET /api/admin/banners` - List banners
- `GET /api/admin/banners/:id` - Get banner
- `POST /api/admin/banners` - Create banner (multipart/form-data: image)
- `PUT /api/admin/banners/:id` - Update banner
- `DELETE /api/admin/banners/:id` - Delete banner

### Payments
- `GET /api/admin/payments` - List payments
- `GET /api/admin/payments/:id` - Get payment
- `PUT /api/admin/payments/:id/status` - Update payment status

### Reports
- `GET /api/admin/reports/student?studentId=xxx&type=enrollment&format=json` - Student report
- `GET /api/admin/reports/teacher?teacherId=xxx&format=json` - Teacher report
- `GET /api/admin/reports/financial?period=month&format=json` - Financial report

### Notifications
- `GET /api/admin/notifications` - List notifications
- `POST /api/admin/notifications` - Create notification
- `DELETE /api/admin/notifications/:id` - Delete notification

### Tickets
- `GET /api/admin/tickets` - List tickets
- `GET /api/admin/tickets/:id` - Get ticket
- `POST /api/admin/tickets/:id/reply` - Reply to ticket
- `PUT /api/admin/tickets/:id/status` - Update ticket status

---

## Student Mobile API (`/api/mobile/student/*`)

All student endpoints require: `Authorization: Bearer <token>` and `role: STUDENT`

### Courses
- `GET /api/mobile/student/courses` - Browse courses
- `GET /api/mobile/student/courses/:id` - Get course details

### Cart
- `GET /api/mobile/student/cart` - Get cart
- `POST /api/mobile/student/cart` - Add to cart
- `DELETE /api/mobile/student/cart/:courseId` - Remove from cart
- `DELETE /api/mobile/student/cart` - Clear cart

### Wishlist
- `GET /api/mobile/student/wishlist` - Get wishlist
- `POST /api/mobile/student/wishlist` - Add to wishlist
- `DELETE /api/mobile/student/wishlist/:courseId` - Remove from wishlist

### Payments
- `POST /api/mobile/student/payments` - Create payment
- `GET /api/mobile/student/payments` - Get my payments

### Learning
- `GET /api/mobile/student/my-courses` - Get my purchased courses
- `GET /api/mobile/student/courses/:courseId/content` - Get course content
- `POST /api/mobile/student/progress` - Mark content as complete

### Exams
- `GET /api/mobile/student/exams` - Get my exams
- `GET /api/mobile/student/exams/:id` - Get exam details
- `POST /api/mobile/student/exams/:examId/submit` - Submit exam
- `GET /api/mobile/student/exams/:id/result` - Get exam result

### Ratings
- `POST /api/mobile/student/ratings/course` - Rate course
- `POST /api/mobile/student/ratings/teacher` - Rate teacher

---

## Teacher Mobile API (`/api/mobile/teacher/*`)

All teacher endpoints require: `Authorization: Bearer <token>` and `role: TEACHER`

### Courses
- `GET /api/mobile/teacher/courses` - Get my courses
- `GET /api/mobile/teacher/courses/:id` - Get course
- `POST /api/mobile/teacher/courses` - Create course
- `PUT /api/mobile/teacher/courses/:id` - Update course
- `POST /api/mobile/teacher/courses/:courseId/content` - Add course content
- `PUT /api/mobile/teacher/courses/:courseId/content/:contentId` - Update content
- `DELETE /api/mobile/teacher/courses/:courseId/content/:contentId` - Delete content

### Exams
- `GET /api/mobile/teacher/exams` - Get my exams
- `GET /api/mobile/teacher/exams/:id` - Get exam
- `POST /api/mobile/teacher/exams` - Create exam
- `PUT /api/mobile/teacher/exams/:id` - Update exam
- `POST /api/mobile/teacher/exams/:examId/questions` - Add question
- `PUT /api/mobile/teacher/exams/:examId/questions/:questionId` - Update question
- `DELETE /api/mobile/teacher/exams/:examId/questions/:questionId` - Delete question
- `GET /api/mobile/teacher/exams/:examId/results` - Get exam results

### Notifications
- `POST /api/mobile/teacher/notifications` - Send notification
- `GET /api/mobile/teacher/notifications` - Get my notifications

---

## Web Frontend API (`/api/web/*`)

Public endpoints (no authentication required)

### Landing Page
- `GET /api/web/landing` - Get landing page data
- `GET /api/web/about` - Get about section

### Courses
- `GET /api/web/courses` - List published courses
- `GET /api/web/courses/:id` - Get course details
- `GET /api/web/categories` - List categories

---

## Profile & Settings (`/api/*`)

All endpoints require: `Authorization: Bearer <token>`

### Profile
- `GET /api/profile` - Get profile
- `PUT /api/profile` - Update profile (multipart/form-data: avatar)
- `POST /api/profile/change-password` - Change password

### Tickets
- `POST /api/tickets` - Create ticket
- `GET /api/tickets` - Get my tickets
- `GET /api/tickets/:id` - Get ticket

### Notifications
- `GET /api/notifications` - Get my notifications
- `POST /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

## Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer <access_token>
```

## File Uploads

For endpoints that accept file uploads, use `multipart/form-data`:
- `avatar` - User avatar
- `image` - Category/Banner image
- `cover_image` - Course cover image



