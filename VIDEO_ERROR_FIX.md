# إصلاح خطأ تشغيل الفيديو في الموبايل
# Fix Video Playback Error in Mobile

## المشكلة / Problem
عند محاولة تشغيل الفيديو في الموبايل، يظهر الخطأ:
```
PlatformException(VideoError
Video player had error
androidx.media3.exoplayer.ExoPlaybackException: Source error, null, null)
```

## الأسباب المحتملة / Possible Causes

### 1. الـ URL غير صحيح / Incorrect URL
الـ URL قد يحتوي على مسار معقد مع UUIDs إضافية:
```
http://192.168.1.19:5005/uploads/videos/533c2fcf-ad98-423b-a505-f85013091f63/b9ac0c85-5bc6-4dd0-a402-038685771fc3/video-1.mp4
```

لكن الملف الفعلي موجود في:
```
uploads/videos/video-{timestamp}-{random}.mp4
```

### 2. الملف غير موجود / File Not Found
الملف قد لا يكون موجوداً في المسار المحدد.

### 3. مشكلة في الـ Network / Network Issue
الموبايل قد لا يتمكن من الوصول إلى الـ IP address `192.168.1.19:5005`.

## الحلول / Solutions

### الحل 1: التحقق من الـ URLs في قاعدة البيانات
```sql
-- تحقق من الـ videoUrl في جدول course_content
SELECT id, titleEn, videoUrl FROM course_content WHERE videoUrl IS NOT NULL;
```

### الحل 2: استخدام متغير البيئة للـ Base URL
أضف في ملف `.env`:
```env
API_BASE_URL=http://192.168.1.19:5005
# أو للـ production:
# API_BASE_URL=https://yourdomain.com
```

### الحل 3: التحقق من أن السيرفر يعمل على جميع الـ interfaces
تأكد من أن السيرفر يعمل على `0.0.0.0` وليس فقط `localhost`:
```javascript
// في server.js
const HOST = "0.0.0.0"; // ✅ صحيح
// const HOST = "localhost"; // ❌ خطأ
```

### الحل 4: اختبار الـ URL مباشرة
افتح الـ URL في المتصفح أو استخدم curl:
```bash
curl -I http://192.168.1.19:5005/uploads/videos/video-1234567890-123456789.mp4
```

يجب أن يعيد `200 OK` إذا كان الملف موجوداً.

### الحل 5: إضافة Error Handling في الموبايل
في Flutter/React Native، أضف error handling:

**Flutter Example:**
```dart
try {
  await videoPlayerController.setDataSource(videoUrl);
  await videoPlayerController.initialize();
} catch (e) {
  print('Error loading video: $e');
  // Show error message to user
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: Text('خطأ في تشغيل الفيديو'),
      content: Text('تعذر تحميل الفيديو. يرجى التحقق من الاتصال بالإنترنت.'),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text('حسناً'),
        ),
      ],
    ),
  );
}
```

**React Native Example:**
```javascript
<Video
  source={{ uri: videoUrl }}
  onError={(error) => {
    console.error('Video error:', error);
    Alert.alert(
      'خطأ في تشغيل الفيديو',
      'تعذر تحميل الفيديو. يرجى التحقق من الاتصال بالإنترنت.',
      [{ text: 'حسناً' }]
    );
  }}
  onLoad={() => console.log('Video loaded successfully')}
/>
```

## خطوات التحقق / Verification Steps

### 1. تحقق من الـ Base URL
```bash
# في Backend/.env
API_BASE_URL=http://192.168.1.19:5005
```

### 2. تحقق من أن الملف موجود
```bash
# في مجلد Backend
ls -la uploads/videos/
```

### 3. تحقق من الـ URL في الـ Response
استخدم Postman أو curl لاختبار الـ endpoint:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://192.168.1.19:5005/api/mobile/student/courses/COURSE_ID/content
```

تحقق من أن `videoUrl` في الـ response هو URL كامل وصحيح.

### 4. تحقق من الـ Network
- تأكد من أن الموبايل والسيرفر على نفس الـ network
- تأكد من أن الـ firewall لا يمنع الاتصال
- جرب الوصول للـ URL من متصفح الموبايل

## إصلاح الـ URLs القديمة / Fix Old URLs

إذا كانت هناك URLs قديمة في قاعدة البيانات تحتوي على مسارات معقدة، يمكنك إصلاحها:

```sql
-- مثال: إصلاح URLs التي تحتوي على UUIDs إضافية
UPDATE course_content 
SET videoUrl = REPLACE(videoUrl, '/533c2fcf-ad98-423b-a505-f85013091f63/b9ac0c85-5bc6-4dd0-a402-038685771fc3/', '/')
WHERE videoUrl LIKE '%533c2fcf-ad98-423b-a505-f85013091f63%';
```

**⚠️ تحذير:** قم بعمل backup قبل تعديل قاعدة البيانات.

## نصائح إضافية / Additional Tips

1. **استخدم HTTPS في Production**: في البيئة الإنتاجية، استخدم HTTPS بدلاً من HTTP
2. **CORS Configuration**: تأكد من أن CORS مُعد بشكل صحيح للسماح للموبايل بالوصول
3. **Video Streaming**: للفيديوهات الكبيرة، فكر في استخدام video streaming (HLS, DASH)
4. **Error Logging**: أضف logging لتتبع الأخطاء:
   ```javascript
   console.error('Video URL error:', {
     url: videoUrl,
     exists: fs.existsSync(videoPath),
     path: videoPath
   });
   ```

## اختبار سريع / Quick Test

```bash
# 1. تحقق من أن السيرفر يعمل
curl http://192.168.1.19:5005/health

# 2. تحقق من أن الـ uploads folder موجود
curl http://192.168.1.19:5005/uploads/

# 3. جرب الوصول لملف فيديو مباشرة (استبدل بالمسار الصحيح)
curl -I http://192.168.1.19:5005/uploads/videos/video-*.mp4
```

إذا كانت جميع الاختبارات تعمل، المشكلة قد تكون في:
- الـ URL المُخزن في قاعدة البيانات
- إعدادات الـ video player في الموبايل
- مشكلة في الـ network بين الموبايل والسيرفر





















