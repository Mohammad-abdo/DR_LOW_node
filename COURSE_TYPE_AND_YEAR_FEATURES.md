# Course Type and Year-Based Features

## ✅ التحديثات المطبقة:

### 1. **Frontend - Admin Course Forms**
تم إضافة inputs جديدة في صفحات إنشاء وتعديل الكورس:

#### AdminCourseCreate.jsx & AdminCourseEdit.jsx:
- ✅ **Checkbox for isBasic**: "دورة أساسية" / "Basic Course"
- ✅ **Checkbox for isFeatured**: "كورس مشهور" / "Featured Course"
- ✅ **Input for targetYear**: "السنة الدراسية المستهدفة" / "Target Study Year" (يظهر فقط عند تفعيل isBasic)

### 2. **Backend - Course Model**
تم إضافة حقل جديد في `schema.prisma`:

```prisma
model Course {
  // ... existing fields
  isBasic       Boolean      @default(false) @map("is_basic")
  isFeatured    Boolean      @default(false) @map("is_featured")
  targetYear    Int?         @map("target_year") // New field
  // ...
}
```

### 3. **Backend - Course Controller**
تم تحديث `courseController.js`:

#### createCourse:
- ✅ يدعم `isBasic`, `isFeatured`, `targetYear`
- ✅ `targetYear` يتم تحويله إلى `Int` أو `null`

#### updateCourse:
- ✅ يدعم تحديث `isBasic`, `isFeatured`, `targetYear`
- ✅ `targetYear` يتم تحويله إلى `Int` أو `null`

### 4. **Backend - Mobile Endpoint**
تم إضافة endpoint جديد في `homeController.js`:

#### getBasicCoursesByYear:
- **Route**: `GET /api/mobile/student/courses/basic/by-year?year={year}`
- **Description**: إرجاع الكورسات الأساسية المرتبطة بسنة دراسية معينة
- **Query Parameters**:
  - `year` (required): السنة الدراسية (1, 2, 3, 4, 5)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "courses": [...],
      "year": 1
    }
  }
  ```
- **Logic**:
  - إرجاع الكورسات الأساسية (`isBasic: true`) التي:
    - `targetYear` يساوي السنة المحددة
    - أو `targetYear` هو `null` (كورسات عامة)
  - ترتيب النتائج: أولاً الكورسات مع `targetYear` المطابق، ثم حسب عدد المشتريات

### 5. **Frontend - Student Registration**
تم تحديث `Register.jsx`:

- ✅ بعد التسجيل الناجح، إذا كان الطالب قد أدخل `year`:
  - يتم جلب الكورسات الأساسية المرتبطة بهذه السنة
  - يتم حفظها في `sessionStorage` لعرضها بعد تسجيل الدخول

```javascript
if (formData.year) {
  const basicCoursesRes = await api.get(`/mobile/student/courses/basic/by-year?year=${formData.year}`);
  if (basicCoursesRes.data?.success && basicCoursesRes.data?.data?.courses?.length > 0) {
    sessionStorage.setItem('basicCoursesForYear', JSON.stringify({
      year: formData.year,
      courses: basicCoursesRes.data.data.courses,
    }));
  }
}
```

## 📋 كيفية الاستخدام:

### 1. **إنشاء/تعديل كورس أساسي:**

1. افتح صفحة إنشاء أو تعديل الكورس
2. حدد "دورة أساسية" (isBasic)
3. أدخل "السنة الدراسية المستهدفة" (targetYear) - اختياري
4. يمكن أيضاً تحديد "كورس مشهور" (isFeatured)
5. احفظ الكورس

### 2. **عرض الكورسات الأساسية حسب السنة:**

#### للطلاب:
- عند التسجيل مع `year`، سيتم جلب الكورسات الأساسية تلقائياً
- يمكن استخدام الـ endpoint مباشرة:
  ```
  GET /api/mobile/student/courses/basic/by-year?year=1
  ```

#### للـ Admin:
- يمكن استخدام نفس الـ endpoint مع authentication

## 🔧 Migration Required:

بعد إضافة `targetYear` في schema، يجب تشغيل migration:

```bash
cd Backend
npx prisma migrate dev --name add_targetYear_to_course
npx prisma generate
```

## 📊 مثال على الاستخدام:

### إنشاء كورس أساسي لسنة أولى:
```javascript
POST /api/admin/courses
{
  "titleAr": "مقدمة في القانون",
  "titleEn": "Introduction to Law",
  "isBasic": "true",
  "targetYear": "1",
  // ... other fields
}
```

### جلب الكورسات الأساسية لسنة أولى:
```javascript
GET /api/mobile/student/courses/basic/by-year?year=1
```

### Response:
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "...",
        "titleAr": "مقدمة في القانون",
        "titleEn": "Introduction to Law",
        "isBasic": true,
        "targetYear": 1,
        // ... other fields
      }
    ],
    "year": 1
  }
}
```

## 🎯 الميزات:

1. **Flexible Course Types**: يمكن للكورس أن يكون:
   - Basic فقط
   - Featured فقط
   - Basic و Featured معاً
   - عادي (لا basic ولا featured)

2. **Year-Based Filtering**: الكورسات الأساسية يمكن ربطها بسنة دراسية محددة

3. **Automatic Recommendations**: عند تسجيل الطالب، يتم جلب الكورسات الأساسية المناسبة تلقائياً

4. **Backward Compatible**: الكورسات بدون `targetYear` ستظهر لجميع السنوات

## ⚠️ ملاحظات:

- `targetYear` اختياري - إذا لم يتم تحديده، سيظهر الكورس لجميع السنوات
- الكورسات الأساسية بدون `targetYear` ستظهر في جميع الاستعلامات
- عند البحث عن كورسات سنة معينة، يتم إرجاع:
  - الكورسات مع `targetYear` المطابق
  - الكورسات بدون `targetYear` (عامة)


















