# تعليمات Migration لإضافة isBasic إلى Category

## 📋 الخطوات المطلوبة:

### 1. تشغيل Migration:
```bash
cd Backend
npx prisma migrate dev --name add_isBasic_to_category
```

### 2. Regenerate Prisma Client:
```bash
npx prisma generate
```

### 3. إعادة تشغيل الـ Server:
```bash
npm start
```

## ⚠️ ملاحظات مهمة:

- الـ migration سوف تضيف حقل `isBasic` إلى جدول `categories`
- القيمة الافتراضية هي `false` (0 في MySQL)
- جميع الفئات الموجودة ستحصل على `isBasic = false` تلقائياً

## ✅ التحقق من Migration:

بعد تشغيل الـ migration، تحقق من:
1. جدول `categories` يحتوي على عمود `is_basic` (Boolean)
2. جميع السجلات الموجودة لديها `is_basic = 0` (false)

## 🔧 Rollback (إذا لزم الأمر):

إذا أردت التراجع عن الـ migration:
```bash
npx prisma migrate resolve --rolled-back add_isBasic_to_category
```
















