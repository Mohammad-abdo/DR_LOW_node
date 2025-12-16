# Mobile Home Endpoints Documentation

## ✅ Endpoints المضافة:

### 1. **GET /api/mobile/student/home**
**الوصف**: يحصل على بيانات الصفحة الرئيسية للـ mobile

**المصادقة**: يتطلب Bearer Token و Student Role

**الاستجابة**:
```json
{
  "success": true,
  "data": {
    "banners": [
      {
        "id": "...",
        "image": "...",
        "titleAr": "...",
        "titleEn": "...",
        "link": "...",
        "order": 1
      }
    ],
    "popularCourses": [
      {
        "id": "...",
        "titleAr": "...",
        "titleEn": "...",
        "descriptionAr": "...",
        "descriptionEn": "...",
        "price": 100,
        "discount": 10,
        "finalPrice": 90,
        "coverImage": "...",
        "level": "BEGINNER",
        "teacher": {
          "id": "...",
          "nameAr": "...",
          "nameEn": "...",
          "avatar": "..."
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
        "isPurchased": false
      }
    ],
    "categories": [
      {
        "id": "...",
        "nameAr": "...",
        "nameEn": "...",
        "descriptionAr": "...",
        "descriptionEn": "...",
        "image": "...",
        "courseCount": 10,
        "courses": [
          {
            "id": "...",
            "titleAr": "...",
            "titleEn": "...",
            "price": 100,
            "finalPrice": 90,
            "coverImage": "...",
            "level": "BEGINNER",
            "teacher": {...},
            "averageRating": 4.5,
            "ratingCount": 20,
            "purchaseCount": 150,
            "contentCount": 25
          }
        ]
      }
    ]
  }
}
```

**البيانات المُرجعة**:
- **banners**: جميع البانرات النشطة مرتبة حسب `order`
- **popularCourses**: أشهر 8 كورسات (حسب عدد المشتريات)
- **categories**: جميع الفئات مع أفضل 4 كورسات لكل فئة

---

### 2. **GET /api/mobile/student/categories/:categoryId/courses**
**الوصف**: يحصل على الكورسات التابعة لفئة معينة

**المصادقة**: يتطلب Bearer Token و Student Role

**المعاملات**:
- `categoryId` (path parameter): معرف الفئة
- `page` (query, optional): رقم الصفحة (افتراضي: 1)
- `limit` (query, optional): عدد العناصر في الصفحة (افتراضي: 12)
- `level` (query, optional): مستوى الكورس (BEGINNER, INTERMEDIATE, ADVANCED)
- `search` (query, optional): كلمة البحث

**مثال الطلب**:
```
GET /api/mobile/student/categories/c4c03d02-3a89-46ff-845a-3de0ba67ff00/courses?page=1&limit=12&level=BEGINNER&search=law
```

**الاستجابة**:
```json
{
  "success": true,
  "data": {
    "category": {
      "id": "...",
      "nameAr": "...",
      "nameEn": "...",
      "descriptionAr": "...",
      "descriptionEn": "...",
      "image": "..."
    },
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
        "coverImage": "...",
        "level": "BEGINNER",
        "teacher": {
          "id": "...",
          "nameAr": "...",
          "nameEn": "...",
          "avatar": "..."
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
        "isPurchased": false
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

## 🔒 الأمان:

- جميع الـ endpoints تتطلب:
  - `Authorization: Bearer <token>` في Header
  - `role: STUDENT` في JWT token

---

## 📝 ملاحظات:

1. **Home Endpoint**:
   - يعيد البانرات النشطة فقط (`active: true`)
   - أشهر الكورسات مرتبة حسب عدد المشتريات
   - كل فئة تحتوي على أفضل 4 كورسات

2. **Courses by Category**:
   - يدعم البحث والفلترة حسب المستوى
   - يدعم Pagination
   - يتحقق من حالة الشراء للطالب المسجل

3. **Purchase Status**:
   - `isPurchased` يُحدد بناءً على JWT token
   - إذا لم يكن الطالب مسجل، `isPurchased` سيكون `false`

---

## 🧪 Testing:

### Test Home Endpoint:
```bash
GET http://localhost:5005/api/mobile/student/home
Headers:
  Authorization: Bearer <student_token>
```

### Test Courses by Category:
```bash
GET http://localhost:5005/api/mobile/student/categories/{categoryId}/courses?page=1&limit=12
Headers:
  Authorization: Bearer <student_token>
```

---

## 📋 Postman Collection:

تم إضافة الـ endpoints إلى Postman Collection:
- `Get Home Data` - في قسم Student (Mobile)
- `Get Courses by Category` - في قسم Student (Mobile)









