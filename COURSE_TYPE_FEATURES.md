# إضافة خيارات نوع الكورس (دورة أساسية / كورس مشهور)

## ✅ التحديثات المطبقة:

### 1. **Schema Updates**
- ✅ تم إضافة حقل `isBasic` إلى `Category` model
- ✅ الحقول `isBasic` و `isFeatured` موجودة بالفعل في `Course` model

### 2. **Category Controller**
- ✅ `createCategory`: يدعم الآن `isBasic` (boolean)
- ✅ `updateCategory`: يدعم الآن `isBasic` (boolean)

### 3. **Course Controller**
- ✅ `createCourse`: يدعم `isBasic` و `isFeatured` (boolean)
- ✅ `updateCourse`: يدعم `isBasic` و `isFeatured` (boolean)

### 4. **Home Controller**
- ✅ `getHomeData`: يعرض الكورسات المشهورة (`isFeatured: true`)
- ✅ الكورسات في الفئات مرتبة حسب `isBasic` أولاً

## 📋 الحقول الجديدة:

### Category:
- `isBasic` (Boolean): فئة الدورات الأساسية
  - `true`: الفئة تحتوي على دورات أساسية
  - `false`: الفئة عادية (افتراضي)

### Course:
- `isBasic` (Boolean): دورة أساسية
  - `true`: الكورس دورة أساسية
  - `false`: الكورس عادي (افتراضي)

- `isFeatured` (Boolean): كورس مشهور
  - `true`: الكورس يظهر في الكورسات المشهورة
  - `false`: الكورس عادي (افتراضي)

## 🔧 كيفية الاستخدام:

### إنشاء Category مع isBasic:
```json
POST /api/admin/categories
{
  "nameAr": "القانون الدستوري",
  "nameEn": "Constitutional Law",
  "descriptionAr": "...",
  "descriptionEn": "...",
  "isBasic": true
}
```

### تحديث Category:
```json
PUT /api/admin/categories/:id
{
  "isBasic": true
}
```

### إنشاء Course مع isBasic و isFeatured:
```json
POST /api/admin/courses
{
  "titleAr": "القانون الدستوري",
  "titleEn": "Constitutional Law",
  "teacherId": "...",
  "categoryId": "...",
  "price": 100,
  "isBasic": true,
  "isFeatured": true
}
```

### تحديث Course:
```json
PUT /api/admin/courses/:id
{
  "isBasic": true,
  "isFeatured": true
}
```

## 📝 Migration Required:

بعد تحديث الـ schema، يجب تشغيل:
```bash
cd Backend
npx prisma migrate dev --name add_isBasic_to_category
npx prisma generate
```

## 🎯 الاستخدام في Frontend:

### عرض الكورسات المشهورة:
- الـ endpoint `/api/mobile/student/home` يعرض الكورسات مع `isFeatured: true`

### عرض الدورات الأساسية:
- الكورسات في الفئات مرتبة حسب `isBasic` أولاً
- يمكن فلترة الكورسات حسب `isBasic` في queries

## 🔒 ملاحظات:

- `isBasic` و `isFeatured` يمكن أن يكونا `true` في نفس الوقت
- الكورسات المشهورة (`isFeatured: true`) تظهر في الصفحة الرئيسية
- الدورات الأساسية (`isBasic: true`) تظهر أولاً في قائمة الكورسات داخل الفئة

