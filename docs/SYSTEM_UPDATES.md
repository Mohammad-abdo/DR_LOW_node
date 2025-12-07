# System Updates - Student Learning Features

## Overview
This document outlines the major updates made to the LMS system to support enhanced student learning features including profile completion, automatic progress tracking, video quizzes, and course categorization.

---

## 1. Profile Completion on First Login

### Feature
When a student logs in for the first time with a new account, they must complete their profile by entering:
- Full name (Arabic and English)
- Phone number
- Academic year level
- Semester

### Implementation
- **Middleware**: `backend/src/middlewares/profileCompletion.js`
  - `requireProfileCompletion` middleware checks if student profile is complete
  - Returns 403 with `PROFILE_INCOMPLETE` code if missing fields

- **Updated Controllers**:
  - `authController.js`: `getMe` now returns `profileComplete` flag
  - `profileController.js`: Updated to check and return profile completion status

### API Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "nameAr": "...",
      "nameEn": "...",
      "phone": "...",
      "year": 2024,
      "semester": 1,
      "profileComplete": true
    }
  }
}
```

### Error Response (Incomplete Profile)
```json
{
  "success": false,
  "message": "Profile completion required",
  "code": "PROFILE_INCOMPLETE",
  "data": {
    "missingFields": {
      "nameAr": false,
      "nameEn": false,
      "phone": true,
      "year": true,
      "semester": false
    }
  }
}
```

---

## 2. Automatic Progress Tracking

### Feature
After purchasing a course, a progress tracking system is automatically activated. Each video watched counts toward a certain percentage of course completion.

### Implementation
- **Updated Controller**: `backend/src/controllers/mobile/student/learningController.js`
  - `markContentComplete`: Now accepts `watchedDuration` and `totalDuration`
  - Automatically calculates progress percentage based on video watch time
  - Marks content as completed when 80% of video is watched
  - Updates overall course progress based on completed videos

### Progress Calculation
- **Content Progress**: Based on video watch percentage (80% = completed)
- **Course Progress**: `(Completed Videos / Total Videos) * 100`
- Only VIDEO type content counts toward progress

### API Endpoint
```
POST /api/mobile/student/progress
Body: {
  "courseId": "...",
  "contentId": "...",
  "watchedDuration": 120, // seconds
  "totalDuration": 150     // seconds
}
```

### Response
```json
{
  "success": true,
  "message": "Content progress updated",
  "data": {
    "contentProgress": 80,
    "courseProgress": 45.5,
    "completed": true
  }
}
```

---

## 3. Quiz System for Videos

### Feature
Every video can have its own quiz that students must complete after watching the video.

### Database Schema
New models added to `schema.prisma`:
- **Quiz**: Linked to CourseContent
- **QuizQuestion**: Questions for each quiz
- **QuizResult**: Student quiz results
- **QuizAnswer**: Individual answers

### Admin Endpoints
```
GET    /api/admin/courses/:courseId/content/:contentId/quiz
POST   /api/admin/courses/:courseId/content/:contentId/quiz
PUT    /api/admin/courses/:courseId/content/:contentId/quiz/:quizId
DELETE /api/admin/courses/:courseId/content/:contentId/quiz/:quizId
POST   /api/admin/courses/:courseId/content/:contentId/quiz/:quizId/questions
PUT    /api/admin/courses/:courseId/content/:contentId/quiz/:quizId/questions/:questionId
DELETE /api/admin/courses/:courseId/content/:contentId/quiz/:quizId/questions/:questionId
```

### Student Endpoints
```
GET  /api/mobile/student/content/:contentId/quiz
POST /api/mobile/student/content/:contentId/quiz/submit
GET  /api/mobile/student/content/:contentId/quiz/result
```

### Quiz Features
- Each quiz has a passing score (default: 60%)
- Optional time limit
- Supports MCQ, TRUE_FALSE, and ESSAY question types
- Students can only submit once
- Results are calculated automatically

---

## 4. Course Categorization

### Feature
Students can now view their courses organized into three categories:
1. **Not Started**: Purchased but no content watched
2. **In Progress**: At least one content item watched, but not completed
3. **Completed**: All videos watched (100% progress)

### Implementation
- **Updated Controller**: `backend/src/controllers/mobile/student/learningController.js`
  - `getMyCourses`: Now categorizes courses automatically
  - Returns both flat list and categorized structure

### API Response
```
GET /api/mobile/student/my-courses
```

```json
{
  "success": true,
  "data": {
    "courses": [...], // All courses with status
    "categorized": {
      "notStarted": [...],
      "inProgress": [...],
      "completed": [...]
    }
  }
}
```

### Course Status Logic
- `not_started`: `completedContent === 0`
- `in_progress`: `completedContent > 0 && progress < 100`
- `completed`: `progress === 100`

---

## 5. Final Exam Requirement

### Feature
A final exam is required to pass the course. The course is only considered completed when:
1. All videos are watched (100% progress)
2. Final exam is passed

### Implementation
- Course completion status checks both:
  - Video progress (100%)
  - Final exam result (passed)

---

## Database Changes

### New Models
1. **Quiz** - Quizzes linked to course content
2. **QuizQuestion** - Questions for quizzes
3. **QuizResult** - Student quiz results
4. **QuizAnswer** - Individual quiz answers

### Updated Models
1. **CourseContent** - Added relation to Quiz
2. **Progress** - Added relation to CourseContent
3. **User** - Added relation to QuizResult

### Migration Required
Run the following to apply schema changes:
```bash
cd backend
npx prisma migrate dev --name add_quiz_system
npx prisma generate
```

---

## API Endpoints Summary

### Profile
- `GET /api/auth/me` - Returns profile with completion status
- `PUT /api/profile` - Update profile (completes profile if all fields filled)

### Progress
- `POST /api/mobile/student/progress` - Mark content as watched/update progress

### Courses
- `GET /api/mobile/student/my-courses` - Get courses with categorization

### Quizzes
- `GET /api/mobile/student/content/:contentId/quiz` - Get quiz for content
- `POST /api/mobile/student/content/:contentId/quiz/submit` - Submit quiz
- `GET /api/mobile/student/content/:contentId/quiz/result` - Get quiz result

---

## Frontend Integration Notes

### Profile Completion Modal
- Check `user.profileComplete` on login
- Show modal if `false`
- Require: nameAr, nameEn, phone, year, semester
- Call `PUT /api/profile` to update

### Course List
- Display courses in three tabs/sections:
  - Not Started
  - In Progress
  - Completed
- Show progress percentage for each course

### Video Player
- Track watch time
- Call `POST /api/mobile/student/progress` when:
  - Video reaches 80% watched
  - Video ends
- Show quiz button after video completion

### Quiz Flow
- After video completion, show "Take Quiz" button
- Load quiz via `GET /api/mobile/student/content/:contentId/quiz`
- Submit answers via `POST /api/mobile/student/content/:contentId/quiz/submit`
- Show results immediately

---

## Testing Checklist

- [ ] Student registration creates account
- [ ] First login shows profile completion modal
- [ ] Profile completion blocks access until complete
- [ ] Video watching updates progress automatically
- [ ] Progress percentage calculates correctly
- [ ] Courses categorize correctly (not started, in progress, completed)
- [ ] Quiz creation for content items
- [ ] Quiz taking and submission
- [ ] Quiz results display correctly
- [ ] Final exam requirement for course completion

---

## Notes

1. **Progress Tracking**: Only VIDEO type content counts toward progress. PDFs, text, and assignments don't affect progress percentage.

2. **Quiz Completion**: Students can only submit a quiz once. Previous results are returned if they try to submit again.

3. **Course Completion**: Currently based on video progress only. Final exam integration will be added in next update.

4. **Profile Completion**: The middleware can be applied to specific routes that require complete profiles. Not all routes need it.

---

**Last Updated**: 2024
**Version**: 2.0

