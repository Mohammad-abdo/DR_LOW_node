# Video Protection & Course Lifecycle Management

## Overview

This document describes the implementation of video protection and course lifecycle management features in the LMS platform.

## Features Implemented

### 1. Video Protection (Multi-Layer)

#### Frontend Protection
- **Custom Video Player Component** (`Frontend/src/components/SecureVideoPlayer.jsx`)
  - Disables right-click context menu
  - Prevents keyboard shortcuts (Ctrl+S, F12)
  - Disables drag and drop
  - Custom controls (no native download button)
  - `controlsList="nodownload noremoteplayback"`
  - Watermark overlay
  - Auto-hide controls

#### Backend Protection
- **Secure Video Streaming** (`Backend/src/controllers/mobile/student/videoController.js`)
  - Token-based access (JWT tokens)
  - Short-lived tokens (1 hour expiry)
  - User-bound tokens
  - Range request support for streaming
  - Headers to prevent download:
    - `Content-Disposition: inline`
    - `X-Download-Options: noopen`
    - `Cache-Control: no-store, no-cache`
    - `X-Content-Type-Options: nosniff`

#### Video Token System
- **Token Generation** (`Backend/src/models/VideoToken.js`)
  - JWT-based tokens
  - Includes: userId, contentId, courseId
  - 1-hour expiration
  - Type validation (`video_stream`)

#### Endpoints
- `GET /api/mobile/student/video/token/:contentId` - Get streaming token
- `GET /api/mobile/student/video/stream/:contentId?token=...` - Stream video

### 2. Course Expiration System

#### Database Schema
- Added `publishStartDate` and `publishEndDate` to `Course` model
- Added `EXPIRED` status to `CourseStatus` enum

#### Middleware
- **Course Expiration Check** (`Backend/src/middlewares/courseExpiration.js`)
  - `checkCourseExpiration` - Middleware to check course expiration
  - `filterExpiredCourses` - Helper to filter expired courses
  - `buildActiveCoursesWhere` - Helper to build query excluding expired courses

#### Automatic Archiving
- **Archiving Service** (`Backend/src/services/courseArchivingService.js`)
  - `archiveExpiredCourse` - Archive a single expired course
  - `archiveAllExpiredCourses` - Archive all expired courses
  - `reactivateCourse` - Reactivate an expired course (admin)

#### Scheduled Job
- **Course Expiration Job** (`Backend/src/jobs/courseExpirationJob.js`)
  - Runs daily at 2:00 AM
  - Automatically archives expired courses
  - Logs archiving actions

#### Controller Updates
- All course listing endpoints filter out expired courses
- Course content access checks expiration before allowing access
- Expired courses return 403 with appropriate message

### 3. Course Lifecycle States

1. **DRAFT** - Course is being created/edited
2. **PUBLISHED** - Course is active and accessible
3. **EXPIRED** - Course has passed `publishEndDate`
4. **ARCHIVED** - Course manually archived by admin

### 4. Data Preservation

When a course expires:
- Course status changes to `EXPIRED`
- All metadata is preserved:
  - Course ID, title, description
  - Instructor information
  - Category
  - Enrollment count
  - Revenue data
  - Ratings
- Videos remain in database but are not accessible via streaming
- Analytics data is preserved for reporting

## API Endpoints

### Video Streaming
```
GET /api/mobile/student/video/token/:contentId
GET /api/mobile/student/video/stream/:contentId?token=...
```

### Course Expiration (Admin)
```
POST /api/admin/courses/:id/reactivate
GET /api/admin/courses/expired
```

## Usage Examples

### Frontend: Using Secure Video Player
```jsx
import SecureVideoPlayer from '@/components/SecureVideoPlayer';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

function VideoContent({ contentId }) {
  const [token, setToken] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);

  useEffect(() => {
    // Get video token
    api.get(`/mobile/student/video/token/${contentId}`)
      .then(res => {
        setToken(res.data.data.token);
        setVideoUrl(res.data.data.streamUrl);
      });
  }, [contentId]);

  if (!token || !videoUrl) return <div>Loading...</div>;

  return (
    <SecureVideoPlayer
      videoUrl={videoUrl}
      token={token}
      contentId={contentId}
      onProgress={(progress) => console.log('Progress:', progress)}
      onEnded={() => console.log('Video ended')}
    />
  );
}
```

### Backend: Checking Course Expiration
```javascript
import { checkCourseExpiration } from '../middlewares/courseExpiration.js';

router.get('/courses/:courseId/content', 
  checkCourseExpiration,
  learningController.getCourseContent
);
```

## Migration

To apply database changes:

```bash
npx prisma migrate dev --name add_course_publish_dates
```

## Configuration

### Environment Variables
- `JWT_SECRET` - Secret for video token generation
- `API_BASE_URL` - Base URL for video streaming

### Scheduled Job
The course expiration job runs automatically when the server starts (if `NODE_ENV !== 'test'`).

To manually trigger:
```javascript
import { runCourseExpirationJob } from './jobs/courseExpirationJob.js';
await runCourseExpirationJob();
```

## Security Considerations

1. **Video Tokens**
   - Short expiration (1 hour)
   - User-bound (cannot be shared)
   - Content-bound (specific to one video)

2. **Course Expiration**
   - Automatic enforcement
   - No bypass for students
   - Admin can reactivate if needed

3. **Download Prevention**
   - Multiple layers of protection
   - Server-side validation
   - Client-side restrictions

## Testing

### Test Video Protection
1. Get video token
2. Try to access video without token (should fail)
3. Try to access video with expired token (should fail)
4. Try to access video with valid token (should succeed)

### Test Course Expiration
1. Create course with `publishEndDate` in the past
2. Try to access course content (should fail with 403)
3. Verify course status is `EXPIRED`
4. Run archiving job manually
5. Verify course is archived

## Future Enhancements

1. HLS streaming support
2. DRM integration
3. Watermarking with user ID
4. Analytics for video views
5. Course expiration notifications







