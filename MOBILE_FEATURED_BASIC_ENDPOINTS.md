# Mobile Endpoints للكورسات المشهورة والأساسية

## ✅ Endpoints المضافة:

### 1. **GET /api/mobile/student/courses/featured**
**الوصف**: يحصل على أشهر الكورسات (الكورسات المشهورة)

**المصادقة**: يتطلب Bearer Token و Student Role

**المعاملات**:
- `page` (query, optional): رقم الصفحة (افتراضي: 1)
- `limit` (query, optional): عدد العناصر في الصفحة (افتراضي: 12)

**مثال الطلب**:
```
GET /api/mobile/student/courses/featured?page=1&limit=12
Headers:
  Authorization: Bearer <student_token>
```

**الاستجابة**:
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "...",
        "titleAr": "...",
        "titleEn": "...",
        "descriptionAr": "...",
        "descriptionEn": "...",
        "price": 100,
        "discount": 10,
        "finalPrice": 90,
        "coverImage": "http://localhost:5005/uploads/images/...",
        "level": "BEGINNER",
        "teacher": {
          "id": "...",
          "nameAr": "...",
          "nameEn": "...",
          "avatar": "http://localhost:5005/uploads/avatars/..."
        },
        "category": {
          "id": "...",
          "nameAr": "...",
          "nameEn": "..."
        },
        "averageRating": 4.5,
        "ratingCount": 20,
        "purchaseCount": 150,
        "contentCount": 25,
        "isPurchased": false,
        "isFeatured": true,
        "isBasic": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 50,
      "pages": 5
    }
  }
}
```

---

### 2. **GET /api/mobile/student/courses/basic**
**الوصف**: يحصل على الكورسات الأساسية

**المصادقة**: يتطلب Bearer Token و Student Role

**المعاملات**:
- `page` (query, optional): رقم الصفحة (افتراضي: 1)
- `limit` (query, optional): عدد العناصر في الصفحة (افتراضي: 12)
- `categoryId` (query, optional): فلترة حسب الفئة

**مثال الطلب**:
```
GET /api/mobile/student/courses/basic?page=1&limit=12&categoryId=xxx
Headers:
  Authorization: Bearer <student_token>
```

**الاستجابة**:
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "...",
        "titleAr": "...",
        "titleEn": "...",
        "descriptionAr": "...",
        "descriptionEn": "...",
        "price": 100,
        "discount": 10,
        "finalPrice": 90,
        "coverImage": "http://localhost:5005/uploads/images/...",
        "level": "BEGINNER",
        "teacher": {
          "id": "...",
          "nameAr": "...",
          "nameEn": "...",
          "avatar": "http://localhost:5005/uploads/avatars/..."
        },
        "category": {
          "id": "...",
          "nameAr": "...",
          "nameEn": "..."
        },
        "averageRating": 4.5,
        "ratingCount": 20,
        "purchaseCount": 150,
        "contentCount": 25,
        "isPurchased": false,
        "isFeatured": false,
        "isBasic": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 30,
      "pages": 3
    }
  }
}
```

---

## 🔒 الأمان:

- جميع الـ endpoints تتطلب:
  - `Authorization: Bearer <token>` في Header
  - `role: STUDENT` في JWT token

---

## 📝 ملاحظات:

1. **Featured Courses**:
   - تعرض الكورسات مع `isFeatured: true`
   - مرتبة حسب عدد المشتريات ثم تاريخ الإنشاء
   - تدعم Pagination

2. **Basic Courses**:
   - تعرض الكورسات مع `isBasic: true`
   - يمكن فلترتها حسب الفئة (`categoryId`)
   - مرتبة حسب `isBasic` أولاً، ثم عدد المشتريات
   - تدعم Pagination

3. **Purchase Status**:
   - `isPurchased` يُحدد بناءً على JWT token
   - إذا لم يكن الطالب مسجل، `isPurchased` سيكون `false`

4. **Image URLs**:
   - جميع الصور (coverImage, avatar) يتم تحويلها إلى روابط كاملة تلقائياً

---

## 🧪 Testing:

### Test Featured Courses:
```bash
GET http://localhost:5005/api/mobile/student/courses/featured?page=1&limit=12
Headers:
  Authorization: Bearer <student_token>
```

### Test Basic Courses:
```bash
GET http://localhost:5005/api/mobile/student/courses/basic?page=1&limit=12
Headers:
  Authorization: Bearer <student_token>
```

### Test Basic Courses by Category:
```bash
GET http://localhost:5005/api/mobile/student/courses/basic?page=1&limit=12&categoryId=xxx
Headers:
  Authorization: Bearer <student_token>
```

---

## 📋 Postman Collection:

تم إضافة الـ endpoints إلى Postman Collection:
- `Get Featured Courses` - في قسم Student (Mobile)
- `Get Basic Courses` - في قسم Student (Mobile)










