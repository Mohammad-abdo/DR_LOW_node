# حل مشاكل Prisma Generate و Login

## 🔧 المشكلة 1: خطأ EPERM عند تشغيل `npx prisma generate`

### السبب:
هناك عملية Node.js (الـ server) تعمل وتستخدم ملف Prisma Client.

### الحل:

#### الخطوة 1: إيقاف جميع عمليات Node.js
```bash
# في PowerShell:
taskkill /F /IM node.exe

# أو في CMD:
taskkill /F /IM node.exe
```

#### الخطوة 2: تشغيل Prisma Generate
```bash
cd Backend
npx prisma generate
```

#### الخطوة 3: تشغيل Migration (إذا لزم الأمر)
```bash
npx prisma migrate dev --name add_isBasic_to_category
```

#### الخطوة 4: إعادة تشغيل الـ Server
```bash
npm start
```

---

## 🔐 المشكلة 2: خطأ "Invalid credentials" عند تسجيل الدخول

### السبب:
المستخدم `a@gmail.com` غير موجود في قاعدة البيانات أو كلمة المرور غير صحيحة.

### الحل:

#### الخيار 1: إنشاء مستخدم جديد عبر Registration
```json
POST /api/auth/register/student
{
  "nameAr": "طالب تجريبي",
  "nameEn": "Test Student",
  "email": "a@gmail.com",
  "phone": "+96512345678",
  "password": "12345678",
  "repeatPassword": "12345678",
  "gender": "MALE",
  "year": 3,
  "semester": 1,
  "department": "Law"
}
```

#### الخيار 2: استخدام بيانات من Seed File
بعد تشغيل `npm run prisma:seed`، يمكنك استخدام:
- **Admin**: 
  - Email: `admin@lms.edu.kw`
  - Password: `admin123`
  - Role: `ADMIN`

- **Student**: 
  - Email: `student@example.com` (أو أي email من seed file)
  - Password: `password123` (أو كلمة المرور المستخدمة في seed)
  - Role: `STUDENT`

#### الخيار 3: إنشاء مستخدم يدوياً في Database
```sql
-- تأكد من تشفير كلمة المرور باستخدام bcrypt
-- Password: 12345678 -> Hash: $2a$10$...
```

---

## 📋 خطوات كاملة لحل المشاكل:

### 1. إيقاف الـ Server:
```bash
# في terminal آخر أو Task Manager
taskkill /F /IM node.exe
```

### 2. تشغيل Prisma Generate:
```bash
cd Backend
npx prisma generate
```

### 3. تشغيل Migration (إذا لزم الأمر):
```bash
npx prisma migrate dev --name add_isBasic_to_category
```

### 4. تشغيل Seed (لإنشاء بيانات تجريبية):
```bash
npm run prisma:seed
```

### 5. إعادة تشغيل الـ Server:
```bash
npm start
```

### 6. تسجيل الدخول:
```json
POST /api/auth/login
{
  "email": "admin@lms.edu.kw",
  "password": "admin123",
  "role": "ADMIN"
}
```

أو إنشاء طالب جديد:
```json
POST /api/auth/register/student
{
  "nameAr": "طالب تجريبي",
  "nameEn": "Test Student",
  "email": "a@gmail.com",
  "password": "12345678",
  "repeatPassword": "12345678",
  "gender": "MALE",
  "year": 3,
  "semester": 1,
  "department": "Law"
}
```

---

## ⚠️ ملاحظات:

1. **Prisma Generate**: يجب إيقاف الـ server قبل تشغيله
2. **Seed File**: تأكد من أن كلمات المرور في seed file صحيحة
3. **Password Hashing**: جميع كلمات المرور يجب أن تكون مشفرة بـ bcrypt
4. **Database**: تأكد من أن قاعدة البيانات متصلة وصحيحة

---

## 🧪 اختبار:

بعد حل المشاكل، جرب:
1. تسجيل الدخول كـ Admin
2. تسجيل الدخول كـ Student (بعد التسجيل)
3. التحقق من أن Prisma Client يعمل بشكل صحيح





























