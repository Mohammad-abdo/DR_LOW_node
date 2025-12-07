# Student Mobile Routes Testing Guide

## Overview
This document lists all mobile student routes that should be tested to ensure the student frontend works correctly.

## Base URL
```
http://localhost:5005/api/mobile/student
```

## Authentication
All routes require:
- Bearer token in Authorization header
- Student role

---

## 1. Course Routes

### GET /courses
**Description**: Get all available courses with filters
**Test**: 
```bash
GET /api/mobile/student/courses?page=1&limit=12&categoryId=&search=
```
**Expected**: List of courses with pagination

### GET /courses/:id
**Description**: Get course details by ID
**Test**:
```bash
GET /api/mobile/student/courses/{courseId}
```
**Expected**: Course details with content, teacher, category

---

## 2. Cart Routes

### GET /cart
**Description**: Get student's cart
**Test**:
```bash
GET /api/mobile/student/cart
```
**Expected**: Cart with items

### POST /cart
**Description**: Add course to cart
**Test**:
```bash
POST /api/mobile/student/cart
Body: { "courseId": "..." }
```
**Expected**: Course added to cart

### DELETE /cart/:courseId
**Description**: Remove course from cart
**Test**:
```bash
DELETE /api/mobile/student/cart/{courseId}
```
**Expected**: Course removed from cart

### DELETE /cart
**Description**: Clear entire cart
**Test**:
```bash
DELETE /api/mobile/student/cart
```
**Expected**: Cart cleared

---

## 3. Wishlist Routes

### GET /wishlist
**Description**: Get student's wishlist
**Test**:
```bash
GET /api/mobile/student/wishlist
```
**Expected**: Wishlist items

### POST /wishlist
**Description**: Add course to wishlist
**Test**:
```bash
POST /api/mobile/student/wishlist
Body: { "courseId": "..." }
```
**Expected**: Course added to wishlist

### DELETE /wishlist/:courseId
**Description**: Remove course from wishlist
**Test**:
```bash
DELETE /api/mobile/student/wishlist/{courseId}
```
**Expected**: Course removed from wishlist

---

## 4. Payment Routes

### POST /payments
**Description**: Create payment for cart
**Test**:
```bash
POST /api/mobile/student/payments
Body: {
  "paymentMethod": "VISA",
  "courseIds": ["..."]
}
```
**Expected**: Payment created

### GET /payments
**Description**: Get student's payments
**Test**:
```bash
GET /api/mobile/student/payments
```
**Expected**: List of payments

---

## 5. Learning Routes

### GET /my-courses
**Description**: Get student's purchased courses with progress
**Test**:
```bash
GET /api/mobile/student/my-courses
```
**Expected**: Courses categorized (notStarted, inProgress, completed) with progress

### GET /courses/:courseId/content
**Description**: Get course content for learning
**Test**:
```bash
GET /api/mobile/student/courses/{courseId}/content
```
**Expected**: Course with all content items

### POST /progress
**Description**: Mark content as watched/update progress
**Test**:
```bash
POST /api/mobile/student/progress
Body: {
  "courseId": "...",
  "contentId": "...",
  "watchedDuration": 120,
  "totalDuration": 150
}
```
**Expected**: Progress updated, course progress calculated

---

## 6. Exam Routes

### GET /exams
**Description**: Get student's exams
**Test**:
```bash
GET /api/mobile/student/exams
```
**Expected**: List of exams for student's courses

### GET /exams/:id
**Description**: Get exam details
**Test**:
```bash
GET /api/mobile/student/exams/{examId}
```
**Expected**: Exam with questions (without correct answers)

### POST /exams/:examId/submit
**Description**: Submit exam answers
**Test**:
```bash
POST /api/mobile/student/exams/{examId}/submit
Body: {
  "answers": [
    { "questionId": "...", "answer": "..." }
  ]
}
```
**Expected**: Exam result with score and pass/fail status

### GET /exams/:id/result
**Description**: Get exam result
**Test**:
```bash
GET /api/mobile/student/exams/{examId}/result
```
**Expected**: Exam result with answers

---

## 7. Rating Routes

### POST /ratings/course
**Description**: Rate a course
**Test**:
```bash
POST /api/mobile/student/ratings/course
Body: {
  "courseId": "...",
  "rating": 5,
  "commentAr": "...",
  "commentEn": "..."
}
```
**Expected**: Rating created/updated

### POST /ratings/teacher
**Description**: Rate a teacher
**Test**:
```bash
POST /api/mobile/student/ratings/teacher
Body: {
  "teacherId": "...",
  "rating": 5,
  "commentAr": "...",
  "commentEn": "..."
}
```
**Expected**: Teacher rating created/updated

---

## 8. Quiz Routes

### GET /content/:contentId/quiz
**Description**: Get quiz for a content item
**Test**:
```bash
GET /api/mobile/student/content/{contentId}/quiz
```
**Expected**: Quiz with questions (without correct answers)

### POST /content/:contentId/quiz/submit
**Description**: Submit quiz answers
**Test**:
```bash
POST /api/mobile/student/content/{contentId}/quiz/submit
Body: {
  "answers": [
    { "questionId": "...", "answer": "..." }
  ]
}
```
**Expected**: Quiz result with score

### GET /content/:contentId/quiz/result
**Description**: Get quiz result
**Test**:
```bash
GET /api/mobile/student/content/{contentId}/quiz/result
```
**Expected**: Quiz result with answers

---

## 9. Web Routes (Public)

### GET /web/banners
**Description**: Get active banners
**Test**:
```bash
GET /api/web/banners?active=true
```
**Expected**: List of active banners

### GET /web/categories
**Description**: Get all categories
**Test**:
```bash
GET /api/web/categories
```
**Expected**: List of categories

---

## Testing Checklist

### Authentication
- [ ] Login with student credentials
- [ ] Token stored correctly
- [ ] Token sent in requests
- [ ] Unauthorized access blocked

### Course Browsing
- [ ] View all courses
- [ ] Filter by category
- [ ] Search courses
- [ ] View course details
- [ ] See course content preview

### Cart & Wishlist
- [ ] Add course to cart
- [ ] Remove from cart
- [ ] Clear cart
- [ ] Add to wishlist
- [ ] Remove from wishlist

### Purchasing
- [ ] Create payment
- [ ] View payment history
- [ ] Course appears in "My Courses" after purchase

### Learning
- [ ] View purchased courses
- [ ] Courses categorized correctly
- [ ] Access course content
- [ ] Video playback works
- [ ] Progress tracking updates
- [ ] Content marked complete at 80%

### Exams
- [ ] View available exams
- [ ] Take exam
- [ ] Submit answers
- [ ] View results

### Quizzes
- [ ] View quiz after video
- [ ] Answer questions
- [ ] Submit quiz
- [ ] View quiz results

### Ratings
- [ ] Rate course
- [ ] Rate teacher
- [ ] Update ratings

---

## Common Issues & Solutions

### 401 Unauthorized
- Check token is valid
- Verify token in Authorization header
- Ensure user has STUDENT role

### 403 Forbidden
- Check course is purchased
- Verify payment status is COMPLETED
- Check profile completion for students

### 404 Not Found
- Verify course/content exists
- Check IDs are correct
- Ensure route paths match

### Progress Not Updating
- Verify watchedDuration and totalDuration sent
- Check content type is VIDEO
- Ensure 80% threshold reached

---

## Test Data

### Test Student
```
Email: student@lms.edu.kw
Password: student123
```

### Test Course IDs
- Use IDs from seed data or create via admin

---

**Last Updated**: 2024

