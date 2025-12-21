# Video Progress Tracking Endpoints

## 📋 جميع الـ Routes المتاحة للطالب

### Base URL
```
https://dr-law.developteam.site/api/mobile/student
```

جميع الـ endpoints تحتاج:
- **Authentication**: Bearer Token في Header
- **Role**: STUDENT

---

## 🎥 Video Progress Endpoints (الجديدة)

### 1. Update Video Progress (تحديث تقدم الفيديو أثناء المشاهدة)

**Endpoint**: `POST /api/mobile/student/video/progress`

**الوصف**: لتحديث progress أثناء المشاهدة (يمكن استدعاؤه كل 10-30 ثانية)

**Request Body**:
```json
{
  "courseId": "uuid",
  "contentId": "uuid",
  "watchedDuration": 120,  // بالثواني
  "totalDuration": 600      // بالثواني
}
```

**Response**:
```json
{
  "success": true,
  "message": "Video progress updated",
  "messageAr": "تم تحديث تقدم الفيديو",
  "data": {
    "contentId": "uuid",
    "progress": 20.0,
    "watchedDuration": 120,
    "totalDuration": 600
  }
}
```

**مثال في JavaScript/React**:
```javascript
import api from '@/lib/api';

// أثناء المشاهدة (كل 10-30 ثانية)
const updateVideoProgress = async (courseId, contentId, currentTime, totalDuration) => {
  try {
    const response = await api.post('/mobile/student/video/progress', {
      courseId: courseId,
      contentId: contentId,
      watchedDuration: currentTime,  // الوقت الحالي بالثواني
      totalDuration: totalDuration   // المدة الكلية بالثواني
    });
    
    console.log('Progress updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating progress:', error);
    throw error;
  }
};

// استخدام في Video Player
useEffect(() => {
  const interval = setInterval(() => {
    if (videoRef.current && !videoRef.current.paused) {
      const currentTime = Math.floor(videoRef.current.currentTime);
      const totalDuration = Math.floor(videoRef.current.duration);
      
      updateVideoProgress(courseId, contentId, currentTime, totalDuration);
    }
  }, 10000); // كل 10 ثواني
  
  return () => clearInterval(interval);
}, [courseId, contentId]);
```

---

### 2. Finish Video (إنهاء الفيديو)

**Endpoint**: `POST /api/mobile/student/video/finish`

**الوصف**: لإنهاء الفيديو ووضع completed = true (إذا تم مشاهدة 80% أو أكثر)

**Request Body**:
```json
{
  "courseId": "uuid",
  "contentId": "uuid",
  "watchedDuration": 500,  // بالثواني
  "totalDuration": 600      // بالثواني
}
```

**Response**:
```json
{
  "success": true,
  "message": "Video finished and progress updated",
  "messageAr": "تم إنهاء الفيديو وتحديث التقدم",
  "data": {
    "contentId": "uuid",
    "contentProgress": 83.33,
    "courseProgress": 45.5,
    "completed": true
  }
}
```

**مثال في JavaScript/React**:
```javascript
import api from '@/lib/api';

// عند إنهاء الفيديو
const finishVideo = async (courseId, contentId, watchedDuration, totalDuration) => {
  try {
    const response = await api.post('/mobile/student/video/finish', {
      courseId: courseId,
      contentId: contentId,
      watchedDuration: watchedDuration,
      totalDuration: totalDuration
    });
    
    console.log('Video finished:', response.data);
    
    // إظهار رسالة نجاح
    if (response.data.data.completed) {
      alert('تم إكمال الفيديو بنجاح!');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error finishing video:', error);
    throw error;
  }
};

// استخدام في Video Player
const handleVideoEnd = () => {
  const watchedDuration = Math.floor(videoRef.current.currentTime);
  const totalDuration = Math.floor(videoRef.current.duration);
  
  finishVideo(courseId, contentId, watchedDuration, totalDuration);
};
```

---

## 📚 جميع Learning Routes المتاحة

### 1. Get My Courses
```
GET /api/mobile/student/my-courses
```

### 2. Get Course Content
```
GET /api/mobile/student/courses/:courseId/content
```

### 3. Mark Content Complete (القديم - يمكن استخدامه كبديل)
```
POST /api/mobile/student/progress
Body: { courseId, contentId, watchedDuration, totalDuration }
```

### 4. Update Video Progress (الجديد) ⭐
```
POST /api/mobile/student/video/progress
```

### 5. Finish Video (الجديد) ⭐
```
POST /api/mobile/student/video/finish
```

---

## 🎬 مثال كامل: Video Player Component

```javascript
import React, { useRef, useEffect, useState } from 'react';
import api from '@/lib/api';

const VideoPlayer = ({ courseId, contentId, videoUrl }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const progressIntervalRef = useRef(null);

  // تحديث progress كل 10 ثواني أثناء المشاهدة
  useEffect(() => {
    if (isPlaying && videoRef.current) {
      progressIntervalRef.current = setInterval(async () => {
        try {
          const currentTime = Math.floor(videoRef.current.currentTime);
          const totalDuration = Math.floor(videoRef.current.duration);
          
          if (totalDuration > 0) {
            await api.post('/mobile/student/video/progress', {
              courseId,
              contentId,
              watchedDuration: currentTime,
              totalDuration: totalDuration
            });
          }
        } catch (error) {
          console.error('Error updating progress:', error);
        }
      }, 10000); // كل 10 ثواني
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, courseId, contentId]);

  // عند إنهاء الفيديو
  const handleVideoEnd = async () => {
    try {
      const watchedDuration = Math.floor(videoRef.current.currentTime);
      const totalDuration = Math.floor(videoRef.current.duration);
      
      await api.post('/mobile/student/video/finish', {
        courseId,
        contentId,
        watchedDuration: watchedDuration,
        totalDuration: totalDuration
      });
      
      alert('تم إكمال الفيديو بنجاح!');
    } catch (error) {
      console.error('Error finishing video:', error);
    }
  };

  // عند إغلاق/ترك الصفحة
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (videoRef.current && videoRef.current.currentTime > 0) {
        const watchedDuration = Math.floor(videoRef.current.currentTime);
        const totalDuration = Math.floor(videoRef.current.duration);
        
        // حفظ progress قبل الخروج
        try {
          await api.post('/mobile/student/video/progress', {
            courseId,
            contentId,
            watchedDuration: watchedDuration,
            totalDuration: totalDuration
          });
        } catch (error) {
          console.error('Error saving progress on exit:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [courseId, contentId]);

  return (
    <div>
      <video
        ref={videoRef}
        src={videoUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleVideoEnd}
        controls
      />
    </div>
  );
};

export default VideoPlayer;
```

---

## 📱 مثال في React Native / Flutter

### React Native Example:
```javascript
import axios from 'axios';

const API_BASE_URL = 'https://dr-law.developteam.site/api/mobile/student';

// Update progress
const updateVideoProgress = async (token, courseId, contentId, currentTime, totalDuration) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/video/progress`,
      {
        courseId,
        contentId,
        watchedDuration: currentTime,
        totalDuration: totalDuration
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Finish video
const finishVideo = async (token, courseId, contentId, watchedDuration, totalDuration) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/video/finish`,
      {
        courseId,
        contentId,
        watchedDuration,
        totalDuration
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

---

## 🔑 ملاحظات مهمة

1. **Authentication**: جميع الـ endpoints تحتاج Bearer Token
   ```javascript
   headers: {
     'Authorization': `Bearer ${token}`
   }
   ```

2. **Timing**: 
   - `updateVideoProgress`: استدعاء كل 10-30 ثانية أثناء المشاهدة
   - `finishVideo`: استدعاء مرة واحدة عند إنهاء الفيديو

3. **Completion Threshold**: الفيديو يعتبر مكتمل إذا تم مشاهدة 80% أو أكثر

4. **Progress Calculation**: 
   - `progress = (watchedDuration / totalDuration) * 100`
   - يتم حفظه في قاعدة البيانات تلقائياً

5. **Course Progress**: يتم تحديث overall course progress تلقائياً عند `finishVideo`

---

## ✅ Checklist للتنفيذ

- [ ] إضافة `updateVideoProgress` في Video Player (كل 10-30 ثانية)
- [ ] إضافة `finishVideo` عند إنهاء الفيديو
- [ ] حفظ progress عند إغلاق/ترك الصفحة
- [ ] إظهار رسالة نجاح عند إكمال الفيديو
- [ ] تحديث UI لعرض progress الحالي

