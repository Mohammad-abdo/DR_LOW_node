# تحديث Seed File مع صور حقيقية وكورسات مميزة وأساسية

## ✅ التحديثات المطبقة:

### 1. **Categories (الفئات)**
تم تحديث جميع الفئات مع:
- ✅ صور حقيقية من Unsplash
- ✅ `isBasic: true` للفئات الأساسية:
  - القانون الدستوري (isBasic: true)
  - القانون المدني (isBasic: true)
  - القانون الجنائي (isBasic: false)
  - القانون التجاري (isBasic: false)
  - القانون الإداري (isBasic: false)

### 2. **Courses (الكورسات)**
تم تحديث الكورسات مع:
- ✅ صور حقيقية من Unsplash (coverImage)
- ✅ `isFeatured: true` للكورسات المشهورة
- ✅ `isBasic: true` للكورسات الأساسية

#### الكورسات المضافة/المحدثة:

1. **القانون الدستوري**
   - isBasic: true
   - isFeatured: true
   - coverImage: https://images.unsplash.com/photo-1589829545856-d10d557cf95f

2. **القانون الجنائي**
   - isBasic: false
   - isFeatured: true
   - coverImage: https://images.unsplash.com/photo-1507679799987-c73779587ccf

3. **القانون التجاري**
   - isBasic: false
   - isFeatured: true
   - coverImage: https://images.unsplash.com/photo-1454165804606-c3d57bc86b40

4. **القانون المدني المتقدم** (جديد)
   - isBasic: true
   - isFeatured: true
   - coverImage: https://images.unsplash.com/photo-1450101499163-c8848c66ca85

5. **القانون الإداري الشامل** (جديد)
   - isBasic: true
   - isFeatured: false
   - coverImage: https://images.unsplash.com/photo-1450101499163-c8848c66ca85

6. **القانون التجاري الدولي** (جديد)
   - isBasic: false
   - isFeatured: true
   - coverImage: https://images.unsplash.com/photo-1454165804606-c3d57bc86b40

7. **مبادئ القانون المدني** (جديد)
   - isBasic: true
   - isFeatured: false
   - coverImage: https://images.unsplash.com/photo-1450101499163-c8848c66ca85

## 📸 الصور المستخدمة:

### Categories:
- القانون الدستوري: `https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=600&fit=crop`
- القانون المدني: `https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop`
- القانون الجنائي: `https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=600&fit=crop`
- القانون التجاري: `https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop`
- القانون الإداري: `https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop`

### Courses:
- جميع الكورسات تستخدم صور من Unsplash بحجم 1200x800

## 📊 ملخص الكورسات:

### Featured Courses (isFeatured: true):
1. القانون الدستوري
2. القانون الجنائي
3. القانون التجاري
4. القانون المدني المتقدم
5. القانون التجاري الدولي

**المجموع: 5 كورسات مشهورة**

### Basic Courses (isBasic: true):
1. القانون الدستوري
2. القانون المدني المتقدم
3. القانون الإداري الشامل
4. مبادئ القانون المدني

**المجموع: 4 كورسات أساسية**

### Categories with isBasic: true:
1. القانون الدستوري
2. القانون المدني

**المجموع: 2 فئات أساسية**

## 🔧 كيفية الاستخدام:

### 1. تشغيل Migration (إذا لزم الأمر):
```bash
cd Backend
npx prisma migrate dev --name add_isBasic_to_category
npx prisma generate
```

### 2. تشغيل Seed:
```bash
npm run prisma:seed
```

### 3. التحقق من البيانات:
- الفئات مع صور و isBasic
- الكورسات مع صور و isFeatured/isBasic

## 📋 ملاحظات:

- جميع الصور من Unsplash (روابط حقيقية)
- الصور ستظهر مباشرة في الـ API responses
- يمكن استخدام helper function `convertImageUrls` لتحويلها إلى روابط كاملة إذا لزم الأمر
- الكورسات الجديدة تحتوي على chapters و videos و quizzes

## 🧪 Testing:

بعد تشغيل seed:
1. تحقق من الفئات: `GET /api/admin/categories`
2. تحقق من الكورسات: `GET /api/admin/courses`
3. تحقق من Featured Courses: `GET /api/mobile/student/courses/featured`
4. تحقق من Basic Courses: `GET /api/mobile/student/courses/basic`










